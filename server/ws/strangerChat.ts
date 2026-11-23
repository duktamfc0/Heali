import crypto from 'node:crypto';
import type http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';
import { sqliteDb } from '../db/database.js';
import { findUserByRawToken } from '../middleware/auth.js';
import { detectContactOrPaymentInChat, detectRisk } from '../../shared/riskDetector.js';
import { getCommunityGateStatus, sanitizePublicAlias } from '../utils/communityGate.js';

interface ChatMessage {
  id: string;
  clientMsgId?: string;
  roomId: string;
  senderId: string;
  senderSocketId: string;
  senderAlias: string;
  text: string;
  createdAt: string;
}

interface LoungeMessage {
  id: string;
  clientMsgId?: string;
  senderId: string;
  senderSocketId?: string;
  senderAlias: string;
  senderAvatar: string;
  topicTag: string;
  text: string;
  createdAt: string;
}

interface ClientSession {
  ws: WebSocket;
  socketId: string;
  userId: string;
  nickname: string;
  avatar: string;
  blockedUserIds: string[];
  roomId: string | null;
  msgTimestamps: number[];
}

interface ActiveRoom {
  id: string;
  topic: string;
  members: Set<WebSocket>;
  messages: ChatMessage[];
  msgCountSinceReminder: number;
  lastReminderAt: number;
}

const ALLOWED_CHAT_TOPICS = new Set(['all', 'heartbreak', 'loneliness', 'family', 'just_listen']);

const wsEnvelopeSchema = z.object({
  type: z.string().min(1).max(60),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});

export function setupStrangerChatWebSocket(httpServer: http.Server): { getActiveCount: () => number } {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 8 * 1024, // 8 KB max WS frame payload
  });
  const clients = new Map<WebSocket, ClientSession>();
  const waitingQueue: Array<{ ws: WebSocket; topic: string; joinedAt: number }> = [];
  const rooms = new Map<string, ActiveRoom>();

  const sendJson = (ws: WebSocket, type: string, payload: unknown) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  };

  const broadcastStats = () => {
    const stats = {
      onlineCount: clients.size,
      waitingCount: waitingQueue.length,
      activeRoomsCount: rooms.size,
    };
    for (const [sock] of clients) {
      sendJson(sock, 'presence:stats', stats);
    }
  };

  const removeFromQueue = (ws: WebSocket) => {
    const idx = waitingQueue.findIndex((item) => item.ws === ws);
    if (idx !== -1) waitingQueue.splice(idx, 1);
  };

  const leaveActiveRoom = (ws: WebSocket, reason: 'left' | 'ended' = 'left') => {
    const session = clients.get(ws);
    if (!session || !session.roomId) return;

    const roomId = session.roomId;
    const room = rooms.get(roomId);
    session.roomId = null;
    if (!room) return;
    room.members.delete(ws);

    for (const peerWs of room.members) {
      const peerSession = clients.get(peerWs);
      if (peerSession) peerSession.roomId = null;
      sendJson(peerWs, 'chat:partner_left', { roomId, reason });
    }
    rooms.delete(roomId);
  };

  const isRateLimited = (session: ClientSession) => {
    const now = Date.now();
    session.msgTimestamps = session.msgTimestamps.filter((ts) => now - ts < 10_000);
    if (session.msgTimestamps.length >= 10) return true;
    session.msgTimestamps.push(now);
    return false;
  };

  httpServer.on('upgrade', (req, socket, head) => {
    const urlPath = req.url?.split('?')[0] || '';
    if (urlPath !== '/ws/stranger-chat') return;
    if (clients.size >= 1500) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(raw.toString());
      } catch {
        sendJson(ws, 'chat:error', { message: 'Dữ liệu gửi lên không hợp lệ.' });
        return;
      }

      const env = wsEnvelopeSchema.safeParse(parsedJson);
      if (!env.success) {
        sendJson(ws, 'chat:error', { message: 'Định dạng gói tin không hợp lệ.' });
        return;
      }

      const { type, payload } = env.data;

      if (type === 'chat:auth') {
        const token = typeof payload.token === 'string' ? payload.token : '';
        const user = findUserByRawToken(token);
        if (!user) {
          sendJson(ws, 'chat:error', { message: 'Phiên đăng nhập chưa sẵn sàng, vui lòng tải lại.' });
          return;
        }
        if (user.is_banned) {
          sendJson(ws, 'chat:error', {
            message: 'Tài khoản này đang bị tạm khóa quyền trò chuyện công khai để bảo vệ an toàn cộng đồng.',
          });
          return;
        }

        let blocked: string[] = [];
        try {
          blocked = JSON.parse(user.blocked_user_ids_json || '[]');
        } catch {
          blocked = [];
        }

        const safeAlias = sanitizePublicAlias(user.nickname);
        const socketId = `sock_${crypto.randomUUID().slice(0, 12)}`;
        const session: ClientSession = {
          ws,
          socketId,
          userId: user.id,
          nickname: safeAlias,
          avatar: user.avatar,
          blockedUserIds: blocked,
          roomId: null,
          msgTimestamps: [],
        };
        clients.set(ws, session);

        const loungeRows = sqliteDb
          .prepare('SELECT * FROM lounge_messages ORDER BY created_at DESC LIMIT 50')
          .all() as Array<{
          id: string;
          client_msg_id: string | null;
          sender_id: string;
          sender_socket_id: string | null;
          sender_alias: string;
          sender_avatar: string;
          topic_tag: string;
          text: string;
          created_at: string;
        }>;

        sendJson(ws, 'chat:authenticated', {
          socketId,
          userId: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
        });
        sendJson(ws, 'lounge:history', {
          messages: loungeRows.reverse().map((r) => ({
            id: r.id,
            clientMsgId: r.client_msg_id || undefined,
            senderId: r.sender_id,
            senderSocketId: r.sender_socket_id || undefined,
            senderAlias: r.sender_alias,
            senderAvatar: r.sender_avatar,
            topicTag: r.topic_tag,
            text: r.text,
            createdAt: r.created_at,
          })),
        });
        broadcastStats();
        return;
      }

      const session = clients.get(ws);
      if (!session) {
        sendJson(ws, 'chat:error', { message: 'Vui lòng kết nối phiên trước khi trò chuyện.' });
        return;
      }

      if (type === 'chat:find_partner') {
        const dbUser = sqliteDb.prepare('SELECT is_banned FROM users WHERE id = ?').get(session.userId) as
          | { is_banned: number }
          | undefined;
        if (dbUser?.is_banned) {
          sendJson(ws, 'chat:error', { message: 'Tài khoản đang bị tạm khóa quyền trò chuyện để bảo vệ cộng đồng.' });
          return;
        }

        const gate = getCommunityGateStatus();
        if (!gate.communityOpen) {
          sendJson(ws, 'chat:error', {
            message:
              gate.closedReason ||
              'Khu vực trò chuyện người lạ đang tạm nghỉ ngoài ca trực kiểm duyệt để đảm bảo an toàn.',
          });
          return;
        }

        const rawTopic = typeof payload.topic === 'string' ? payload.topic : 'all';
        const topic = ALLOWED_CHAT_TOPICS.has(rawTopic) ? rawTopic : 'all';
        removeFromQueue(ws);
        leaveActiveRoom(ws, 'left');

        const candidateIdx = waitingQueue.findIndex((candidate) => {
          if (candidate.ws === ws || candidate.ws.readyState !== WebSocket.OPEN) return false;
          const peer = clients.get(candidate.ws);
          if (!peer) return false;
          if (peer.userId !== session.userId) {
            if (session.blockedUserIds.includes(peer.userId) || peer.blockedUserIds.includes(session.userId)) {
              return false;
            }
          }
          return topic === 'all' || candidate.topic === 'all' || candidate.topic === topic;
        });

        if (candidateIdx !== -1) {
          const [matchedItem] = waitingQueue.splice(candidateIdx, 1);
          const peerSession = clients.get(matchedItem.ws);
          if (!peerSession) return;

          const roomId = `room_${crypto.randomUUID().slice(0, 12)}`;
          const resolvedTopic = topic !== 'all' ? topic : matchedItem.topic;
          rooms.set(roomId, {
            id: roomId,
            topic: resolvedTopic,
            members: new Set([ws, matchedItem.ws]),
            messages: [],
            msgCountSinceReminder: 0,
            lastReminderAt: Date.now(),
          });
          session.roomId = roomId;
          peerSession.roomId = roomId;

          sendJson(ws, 'chat:matched', {
            roomId,
            topic: resolvedTopic,
            partner: { alias: peerSession.nickname, avatar: peerSession.avatar },
          });
          sendJson(matchedItem.ws, 'chat:matched', {
            roomId,
            topic: resolvedTopic,
            partner: { alias: session.nickname, avatar: session.avatar },
          });
          broadcastStats();
          return;
        }

        waitingQueue.push({ ws, topic, joinedAt: Date.now() });
        sendJson(ws, 'chat:searching', { topic, position: waitingQueue.length });
        broadcastStats();
        return;
      }

      if (type === 'chat:cancel_search') {
        removeFromQueue(ws);
        sendJson(ws, 'chat:search_cancelled', {});
        broadcastStats();
        return;
      }

      if (type === 'chat:leave_room') {
        removeFromQueue(ws);
        leaveActiveRoom(ws, 'left');
        broadcastStats();
        return;
      }

      if (type === 'chat:typing') {
        const roomId = typeof payload.roomId === 'string' ? payload.roomId : '';
        if (!roomId || session.roomId !== roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;
        for (const peerWs of room.members) {
          if (peerWs !== ws) {
            sendJson(peerWs, 'chat:typing', { roomId, isTyping: Boolean(payload.isTyping) });
          }
        }
        return;
      }

      if (type === 'chat:send_message') {
        const roomId = typeof payload.roomId === 'string' ? payload.roomId : '';
        const rawText = typeof payload.text === 'string' ? payload.text.trim() : '';
        const clientMsgId = typeof payload.clientMsgId === 'string' ? payload.clientMsgId.slice(0, 64) : undefined;

        if (!roomId || session.roomId !== roomId) {
          sendJson(ws, 'chat:error', { message: 'Phòng trò chuyện đã kết thúc.' });
          return;
        }
        if (!rawText) return;
        if (isRateLimited(session)) {
          sendJson(ws, 'chat:error', { message: 'Bạn gửi tin nhắn hơi nhanh, hãy thở nhẹ một nhịp nhé.' });
          return;
        }

        const room = rooms.get(roomId);
        if (!room) return;

        // Section 4.3: Detect phone numbers, social handles, links, bank transfer keywords
        const contactCheck = detectContactOrPaymentInChat(rawText);
        if (contactCheck.hasContactOrPayment) {
          sendJson(ws, 'chat:safety_notice', {
            type: 'contact_warning',
            message: `Vì an toàn ẩn danh, Heali không cho phép gửi ${contactCheck.reasons.join(', ')} trong phòng trò chuyện.`,
          });
          return;
        }

        const risk = detectRisk(rawText);
        const chatMsg: ChatMessage = {
          id: `msg_${crypto.randomUUID().slice(0, 12)}`,
          clientMsgId,
          roomId,
          senderId: session.userId,
          senderSocketId: session.socketId,
          senderAlias: session.nickname,
          text: rawText.slice(0, 1000),
          createdAt: new Date().toISOString(),
        };

        room.messages.push(chatMsg);
        if (room.messages.length > 100) room.messages = room.messages.slice(-100);
        room.msgCountSinceReminder += 1;

        const nowMs = Date.now();
        const shouldRemind =
          room.msgCountSinceReminder >= 8 || nowMs - room.lastReminderAt >= 240_000;
        if (shouldRemind) {
          room.msgCountSinceReminder = 0;
          room.lastReminderAt = nowMs;
        }

        for (const memberWs of room.members) {
          sendJson(memberWs, 'chat:message', chatMsg);
          if (shouldRemind) {
            sendJson(memberWs, 'chat:safety_notice', {
              type: 'periodic_reminder',
              message:
                'Nhắc nhẹ từ Heali: Bạn có thể dừng, rời phòng hoặc dùng nút Báo cáo / Chặn bất cứ lúc nào nếu thấy không thoải mái. Tuyệt đối không chia sẻ số điện thoại hay thông tin chuyển khoản.',
            });
          }
          if (risk.level >= 2) {
            if (memberWs === ws) {
              sendJson(memberWs, 'chat:safety_notice', {
                type: 'self_risk',
                riskLevel: risk.level,
              });
            } else {
              sendJson(memberWs, 'chat:safety_notice', {
                type: 'peer_distress',
                message:
                  'Tin nhắn vừa nhận có thể chứa nội dung nặng nề hoặc nhắc đến việc tự làm hại. Bạn không có trách nhiệm gánh thay; hãy giữ bình tĩnh và có thể mở mục "Cần giúp ngay" hoặc rời phòng nếu thấy quá sức.',
              });
            }
          }
        }
        return;
      }

      if (type === 'chat:report_partner') {
        const roomId = typeof payload.roomId === 'string' ? payload.roomId : '';
        const reason = typeof payload.reason === 'string' ? payload.reason.trim().slice(0, 240) : 'Hành vi gây tổn hại / thiếu tôn trọng';
        if (!roomId || session.roomId !== roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;

        let targetId = 'unknown';
        for (const peerWs of room.members) {
          if (peerWs !== ws) {
            const peer = clients.get(peerWs);
            if (peer) targetId = peer.userId;
          }
        }

        sqliteDb
          .prepare(`
            INSERT INTO moderation_queue (id, source_type, source_id, reporter_user_id, reason, risk_level, status, created_at)
            VALUES (?, 'stranger_chat', ?, ?, ?, 1, 'pending', ?)
          `)
          .run(`mq-${crypto.randomUUID()}`, `${roomId}:${targetId}`, session.userId, reason, new Date().toISOString());

        sendJson(ws, 'chat:report_received', {
          message: 'Đã ghi nhận báo cáo vào hàng đợi rà soát an toàn.',
        });
        return;
      }

      if (type === 'chat:block_partner') {
        const roomId = typeof payload.roomId === 'string' ? payload.roomId : '';
        if (!roomId || session.roomId !== roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;

        for (const peerWs of room.members) {
          if (peerWs !== ws) {
            const peer = clients.get(peerWs);
            if (peer && peer.userId !== session.userId) {
              if (!session.blockedUserIds.includes(peer.userId)) {
                session.blockedUserIds.push(peer.userId);
                sqliteDb
                  .prepare('UPDATE users SET blocked_user_ids_json = ? WHERE id = ?')
                  .run(JSON.stringify(session.blockedUserIds), session.userId);
              }
            }
          }
        }
        leaveActiveRoom(ws, 'ended');
        broadcastStats();
        return;
      }

      if (type === 'lounge:report') {
        const messageId = typeof payload.messageId === 'string' ? payload.messageId.trim() : '';
        const reason =
          typeof payload.reason === 'string' && payload.reason.trim()
            ? payload.reason.trim().slice(0, 240)
            : 'Tin nhắn phòng trà có dấu hiệu gây tổn hại / quấy rối';
        if (!messageId) return;

        const targetMsg = sqliteDb
          .prepare(`SELECT id FROM lounge_messages WHERE id = ?`)
          .get(messageId) as { id: string } | undefined;
        if (!targetMsg) {
          sendJson(ws, 'chat:error', { message: 'Không tìm thấy tin nhắn cần báo cáo.' });
          return;
        }

        sqliteDb
          .prepare(`
            INSERT INTO moderation_queue (id, source_type, source_id, reporter_user_id, reason, risk_level, status, created_at)
            VALUES (?, 'lounge_message', ?, ?, ?, 1, 'pending', ?)
          `)
          .run(`mq-${crypto.randomUUID()}`, messageId, session.userId, reason, new Date().toISOString());

        sendJson(ws, 'chat:report_received', {
          message: 'Đã chuyển tin nhắn phòng trà vào hàng đợi kiểm duyệt để xem xét.',
        });
        return;
      }

      if (type === 'lounge:send') {
        const dbUser = sqliteDb.prepare('SELECT is_banned FROM users WHERE id = ?').get(session.userId) as
          | { is_banned: number }
          | undefined;
        if (dbUser?.is_banned) {
          sendJson(ws, 'chat:error', { message: 'Tài khoản đang bị tạm khóa quyền gửi tin nhắn công khai.' });
          return;
        }

        const gate = getCommunityGateStatus();
        if (!gate.communityOpen) {
          sendJson(ws, 'chat:error', {
            message:
              gate.closedReason ||
              'Phòng trà gặp gỡ đang tạm nghỉ ngoài ca trực kiểm duyệt để đảm bảo an toàn.',
          });
          return;
        }

        const rawText = typeof payload.text === 'string' ? payload.text.trim() : '';
        const topicTag = typeof payload.topicTag === 'string' ? payload.topicTag.trim().slice(0, 32) : 'Sẻ chia';
        const clientMsgId = typeof payload.clientMsgId === 'string' ? payload.clientMsgId.slice(0, 64) : undefined;
        if (!rawText) return;
        if (isRateLimited(session)) {
          sendJson(ws, 'chat:error', { message: 'Bạn gửi tin nhắn hơi nhanh, hãy đợi vài giây nhé.' });
          return;
        }

        const contactCheck = detectContactOrPaymentInChat(rawText);
        if (contactCheck.hasContactOrPayment) {
          sendJson(ws, 'chat:safety_notice', {
            type: 'contact_warning',
            message: `Vì an toàn ẩn danh, phòng trà không cho phép chia sẻ ${contactCheck.reasons.join(', ')}.`,
          });
          return;
        }

        const risk = detectRisk(rawText);
        if (risk.level >= 2) {
          // Do not broadcast crisis ideation publicly in lounge; keep user text intact in prompt and show support immediately
          sendJson(ws, 'chat:safety_notice', {
            type: 'self_risk',
            riskLevel: risk.level,
          });
          return;
        }

        const loungeMsg: LoungeMessage = {
          id: `lg_${crypto.randomUUID().slice(0, 12)}`,
          clientMsgId,
          senderId: session.userId,
          senderSocketId: session.socketId,
          senderAlias: session.nickname,
          senderAvatar: session.avatar,
          topicTag: topicTag || 'Sẻ chia',
          text: rawText.slice(0, 600),
          createdAt: new Date().toISOString(),
        };

        sqliteDb
          .prepare(`
            INSERT INTO lounge_messages (id, client_msg_id, sender_id, sender_socket_id, sender_alias, sender_avatar, topic_tag, text, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .run(
            loungeMsg.id,
            loungeMsg.clientMsgId || null,
            loungeMsg.senderId,
            loungeMsg.senderSocketId || null,
            loungeMsg.senderAlias,
            loungeMsg.senderAvatar,
            loungeMsg.topicTag,
            loungeMsg.text,
            loungeMsg.createdAt
          );

        for (const [sock] of clients) {
          sendJson(sock, 'lounge:message', loungeMsg);
        }
      }
    });

    ws.on('close', () => {
      removeFromQueue(ws);
      leaveActiveRoom(ws, 'left');
      clients.delete(ws);
      broadcastStats();
    });
  });

  return {
    getActiveCount: () => clients.size,
  };
}
