import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, type CommunityStatus } from '../services/api';
import { SupportPromptCard } from './SupportPromptCard';
import { SanctuaryScene3D } from './3d/SanctuaryScene3D';
import type { RiskLevel } from '../../shared/riskDetector';
import {
  MessageCircle,
  Users,
  Send,
  Search,
  RefreshCw,
  LogOut,
  ShieldAlert,
  Sparkles,
  Coffee,
  ShieldCheck,
  Wifi,
  WifiOff,
  Ban,
  Flag,
  X,
  Clock,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  clientMsgId?: string;
  roomId: string;
  senderId: string;
  senderSocketId?: string;
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

interface PresenceStats {
  onlineCount: number;
  waitingCount: number;
  activeRoomsCount: number;
}

const TOPICS = [
  { id: 'all', label: 'Mọi tâm sự', desc: 'Kết nối ngẫu nhiên với người bạn đồng điệu' },
  { id: 'heartbreak', label: 'Chữa lành chia ly', desc: 'Những vết xước tình cảm cần được lắng nghe' },
  { id: 'loneliness', label: 'Vượt qua cô đơn', desc: 'Khi chỉ muốn có ai đó trò chuyện nhẹ nhàng' },
  { id: 'family', label: 'Áp lực cuộc sống', desc: 'Gia đình, công việc & những khoảng lặng khó nói' },
  { id: 'just_listen', label: 'Chỉ muốn lắng nghe', desc: 'Sẵn sàng ngồi bên và nghe câu chuyện của bạn' },
] as const;

const LOUNGE_TAGS = ['Sẻ chia', 'Lắng nghe', 'Gửi bình yên', 'Chào bạn mới'];

interface StrangerChatViewProps {
  lowMotion?: boolean;
  embeddedIn3DRoom?: boolean;
}

export const StrangerChatView: React.FC<StrangerChatViewProps> = ({
  lowMotion = false,
  embeddedIn3DRoom = false,
}) => {
  const [subMode, setSubMode] = useState<'one_on_one' | 'lounge'>('one_on_one');
  const [connStatus, setConnStatus] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
  const [mySocketId, setMySocketId] = useState<string>('');
  const [myUserId, setMyUserId] = useState<string>('');
  const [myAlias, setMyAlias] = useState<string>('');
  const [stats, setStats] = useState<PresenceStats>({ onlineCount: 1, waitingCount: 0, activeRoomsCount: 0 });
  const [communityStatus, setCommunityStatus] = useState<CommunityStatus | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [safetyRiskLevel, setSafetyRiskLevel] = useState<RiskLevel | null>(null);
  const [peerNotice, setPeerNotice] = useState<string | null>(null);
  const [periodicReminder, setPeriodicReminder] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<
    | { kind: 'room'; roomId: string }
    | { kind: 'lounge'; messageId: string; alias: string }
    | null
  >(null);
  const [reportReason, setReportReason] = useState('Quấy rối / thiếu tôn trọng');
  const [conductAccepted, setConductAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('heali_chat_conduct_accepted') === '1';
    } catch {
      return false;
    }
  });

  // 1-on-1 Stranger Matchmaking State
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [matchState, setMatchState] = useState<'idle' | 'searching' | 'matched' | 'partner_left'>('idle');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [partnerAlias, setPartnerAlias] = useState<string>('');
  const [matchedTopic, setMatchedTopic] = useState<string>('all');
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');

  // Shared Sanctuary Lounge State
  const [loungeMessages, setLoungeMessages] = useState<LoungeMessage[]>([]);
  const [loungeInput, setLoungeInput] = useState<string>('');
  const [loungeTag, setLoungeTag] = useState<string>('Sẻ chia');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const roomBottomRef = useRef<HTMLDivElement>(null);
  const loungeBottomRef = useRef<HTMLDivElement>(null);
  const lastRoomDraftRef = useRef<{ id: string; text: string } | null>(null);
  const lastLoungeDraftRef = useRef<{ id: string; text: string } | null>(null);

  const sendWs = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }, []);

  useEffect(() => {
    api.getCommunityStatus().then(setCommunityStatus).catch(() => {});
  }, []);

  useEffect(() => {
    let disposed = false;
    let attempt = 0;

    const connect = async () => {
      if (disposed) return;

      let token = api.getToken();
      if (!token) {
        const user = await api.initSession();
        token = user.token ?? api.getToken();
      }
      if (disposed || !token) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/stranger-chat`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) {
          ws.close();
          return;
        }
        attempt = 0;
        setConnStatus('connected');
        setErrorBanner(null);
        ws.send(JSON.stringify({ type: 'chat:auth', payload: { token } }));
      };

      ws.onmessage = (event) => {
        let data: { type?: string; payload?: Record<string, unknown> };
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        const payload = data.payload || {};
        switch (data.type) {
          case 'chat:authenticated':
            setMySocketId(String(payload.socketId || ''));
            setMyUserId(String(payload.userId || ''));
            setMyAlias(String(payload.nickname || 'Bạn Lữ Hành'));
            break;

          case 'presence:stats':
            setStats({
              onlineCount: Number(payload.onlineCount || 0),
              waitingCount: Number(payload.waitingCount || 0),
              activeRoomsCount: Number(payload.activeRoomsCount || 0),
            });
            break;

          case 'chat:searching':
            setMatchState('searching');
            setRoomId(null);
            setPartnerTyping(false);
            break;

          case 'chat:search_cancelled':
            setMatchState('idle');
            break;

          case 'chat:matched': {
            const partner = (payload.partner || {}) as { alias?: string };
            setMatchState('matched');
            setRoomId(String(payload.roomId || ''));
            setMatchedTopic(String(payload.topic || 'all'));
            setPartnerAlias(partner.alias || 'Người Lạ Ấm Áp');
            setRoomMessages([]);
            setPartnerTyping(false);
            setErrorBanner(null);
            break;
          }

          case 'chat:message': {
            const incoming = payload as unknown as ChatMessage;
            setRoomMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id || (incoming.clientMsgId && m.clientMsgId === incoming.clientMsgId))) {
                return prev.map((m) =>
                  incoming.clientMsgId && m.clientMsgId === incoming.clientMsgId ? incoming : m
                );
              }
              return [...prev, incoming];
            });
            setPartnerTyping(false);
            break;
          }

          case 'chat:typing':
            setPartnerTyping(Boolean(payload.isTyping));
            break;

          case 'chat:partner_left':
            setMatchState('partner_left');
            setPartnerTyping(false);
            break;

          case 'lounge:history': {
            const list = Array.isArray(payload.messages) ? (payload.messages as LoungeMessage[]) : [];
            setLoungeMessages(list);
            break;
          }

          case 'lounge:message': {
            const incoming = payload as unknown as LoungeMessage;
            setLoungeMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id || (incoming.clientMsgId && m.clientMsgId === incoming.clientMsgId))) {
                return prev.map((m) =>
                  incoming.clientMsgId && m.clientMsgId === incoming.clientMsgId ? incoming : m
                );
              }
              return [...prev, incoming].slice(-60);
            });
            break;
          }

          case 'chat:safety_notice': {
            const noticeType = String(payload.type || '');
            if (noticeType === 'self_risk') {
              const lvl = Math.min(3, Math.max(1, Number(payload.riskLevel || 2))) as RiskLevel;
              setSafetyRiskLevel(lvl);
              // Keep user's typed text if lounge message was held
              if (lastLoungeDraftRef.current) {
                const draft = lastLoungeDraftRef.current;
                setLoungeMessages((prev) => prev.filter((m) => m.clientMsgId !== draft.id));
                setLoungeInput((cur) => cur || draft.text);
                lastLoungeDraftRef.current = null;
              }
            } else if (noticeType === 'contact_warning') {
              setErrorBanner(String(payload.message || 'Không gửi thông tin liên hệ hoặc chuyển khoản trong phòng chat.'));
              if (lastRoomDraftRef.current) {
                const draft = lastRoomDraftRef.current;
                setRoomMessages((prev) => prev.filter((m) => m.clientMsgId !== draft.id));
                setInputText((cur) => cur || draft.text);
                lastRoomDraftRef.current = null;
              }
              if (lastLoungeDraftRef.current) {
                const draft = lastLoungeDraftRef.current;
                setLoungeMessages((prev) => prev.filter((m) => m.clientMsgId !== draft.id));
                setLoungeInput((cur) => cur || draft.text);
                lastLoungeDraftRef.current = null;
              }
            } else if (noticeType === 'peer_distress') {
              setPeerNotice(String(payload.message || 'Bạn có thể rời phòng bất cứ lúc nào nếu thấy quá sức.'));
            } else if (noticeType === 'periodic_reminder') {
              setPeriodicReminder(
                String(
                  payload.message ||
                    'Nhắc nhẹ từ Heali: Bạn có thể dừng, rời phòng hoặc Báo cáo/Chặn bất cứ lúc nào.'
                )
              );
            }
            break;
          }

          case 'chat:report_received':
            setErrorBanner(String(payload.message || 'Đã ghi nhận báo cáo vào hàng đợi rà soát an toàn.'));
            break;

          case 'chat:error':
            setErrorBanner(String(payload.message || 'Có gián đoạn nhỏ, vui lòng thử lại.'));
            break;
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        setConnStatus('reconnecting');
        const delay = Math.min(8000, 1000 * Math.pow(1.6, attempt));
        attempt += 1;
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    roomBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages, partnerTyping]);

  useEffect(() => {
    loungeBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [loungeMessages]);

  const handleFindPartner = () => {
    setErrorBanner(null);
    sendWs('chat:find_partner', { topic: selectedTopic });
  };

  const handleCancelSearch = () => {
    sendWs('chat:cancel_search');
    setMatchState('idle');
  };

  const handleLeaveRoom = () => {
    sendWs('chat:leave_room');
    setMatchState('idle');
    setRoomId(null);
    setRoomMessages([]);
    setPartnerTyping(false);
  };

  const handleBlockPartner = () => {
    if (!roomId) return;
    sendWs('chat:block_partner', { roomId });
    setMatchState('idle');
    setRoomId(null);
    setRoomMessages([]);
    setErrorBanner('Đã ngắt kết nối và ẩn người dùng này khỏi những lần ghép đôi tiếp theo.');
  };

  const handleReportPartner = () => {
    if (!roomId) return;
    setReportTarget({ kind: 'room', roomId });
  };

  const handleSubmitChatReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    if (reportTarget.kind === 'room') {
      sendWs('chat:report_partner', {
        roomId: reportTarget.roomId,
        reason: reportReason,
      });
    } else {
      sendWs('lounge:report', {
        messageId: reportTarget.messageId,
        reason: reportReason,
      });
    }
    setReportTarget(null);
  };

  const handleAcceptConduct = () => {
    try {
      localStorage.setItem('heali_chat_conduct_accepted', '1');
    } catch {
      // ignore storage failure
    }
    setConductAccepted(true);
  };

  const handleSendRoomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !roomId || matchState !== 'matched') return;

    const clientMsgId = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    lastRoomDraftRef.current = { id: clientMsgId, text: trimmed };
    // Optimistic message
    setRoomMessages((prev) => [
      ...prev,
      {
        id: clientMsgId,
        clientMsgId,
        roomId,
        senderId: myUserId,
        senderSocketId: mySocketId,
        senderAlias: myAlias || 'Bạn',
        text: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);

    sendWs('chat:send_message', { roomId, clientMsgId, text: trimmed });
    sendWs('chat:typing', { roomId, isTyping: false });
    setInputText('');
  };

  const handleRoomInputChange = (val: string) => {
    setInputText(val);
    if (!roomId || matchState !== 'matched') return;
    sendWs('chat:typing', { roomId, isTyping: val.trim().length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      sendWs('chat:typing', { roomId, isTyping: false });
    }, 2000);
  };

  const handleSendLoungeMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = loungeInput.trim();
    if (!trimmed || connStatus !== 'connected') return;

    const clientMsgId = `lgc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    lastLoungeDraftRef.current = { id: clientMsgId, text: trimmed };
    setLoungeMessages((prev) => [
      ...prev,
      {
        id: clientMsgId,
        clientMsgId,
        senderId: myUserId,
        senderSocketId: mySocketId,
        senderAlias: myAlias || 'Bạn',
        senderAvatar: 'leaf',
        topicTag: loungeTag,
        text: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);

    sendWs('lounge:send', { clientMsgId, topicTag: loungeTag, text: trimmed });
    setLoungeInput('');
  };

  const formatClock = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const topicLabel = (id: string) => TOPICS.find((t) => t.id === id)?.label || 'Mọi tâm sự';

  const isCommunityOpen = communityStatus ? communityStatus.communityOpen : true;

  return (
    <div className="space-y-5 text-[#273829] dark:text-[#edf2e8] heali-stage-enter">
      {/* Off-duty Moderation Pause Notice */}
      {communityStatus && !communityStatus.communityOpen && (
        <div className="rounded-2xl bg-[#f9ece8] dark:bg-[#32201d] border border-[#e3b9af] dark:border-[#603932] p-4 flex items-start gap-3 text-xs sm:text-sm text-[#7a3121] dark:text-[#f2c6bc]">
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Khu vực trò chuyện người lạ đang tạm nghỉ ngoài ca trực kiểm duyệt</div>
            <p className="leading-relaxed">
              {communityStatus.closedReason ||
                'Tính năng ghép đôi & phòng trà tạm đóng khi chưa có điều phối viên trực để đảm bảo an toàn cộng đồng.'}
            </p>
          </div>
        </div>
      )}

      {/* 3D Interactive Evening Community Clearing Stage */}
      {embeddedIn3DRoom ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#222c24] border border-[#dcdad0] dark:border-[#324236]">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#46613e] dark:text-[#98c18e] flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Bàn trà gặp gỡ 1:1 · Ẩn danh thời gian thực</span>
            </div>
            <p className="text-xs text-[#576c59] dark:text-[#b0c0b2]">
              Không lưu lịch sử 1:1 sau khi rời bàn trà.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#faf7ef] dark:bg-[#19211b] border border-[#dcdad0] dark:border-[#344236] text-xs">
            <div className="flex items-center gap-1.5 font-semibold">
              {connStatus === 'connected' ? (
                <Wifi className="w-3.5 h-3.5 text-[#46613e]" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-[#b54736]" />
              )}
              <span className="tabular-nums">{stats.onlineCount} bạn trực tuyến</span>
            </div>
          </div>
        </div>
      ) : (
        <SanctuaryScene3D
          variant="community"
          lowMotion={lowMotion}
          allowPureViewToggle
          className="min-h-[210px] sm:min-h-[240px]"
        >
          <div className="p-5 sm:p-8 flex flex-col justify-between min-h-[210px] sm:min-h-[240px] text-[#f4f4ed]">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-widest text-[#e6c37b]">
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span>Góc gặp gỡ · Trò chuyện ẩn danh</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-6">
              <div className="space-y-1 max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-bold font-serif-healing text-white">
                  Trò chuyện cùng người lạ
                </h2>
                <p className="text-xs sm:text-sm text-[#dce5d9] font-serif-healing italic">
                  Kết nối ẩn danh theo thời gian thực dưới tán cây ấm áp, không lưu lịch sử 1:1 sau khi rời phòng.
                </p>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-[#162219]/85 border border-[#4a6250]/60 text-xs shrink-0 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 font-semibold text-[#f4f4ed]">
                  {connStatus === 'connected' ? (
                    <Wifi className="w-3.5 h-3.5 text-[#98d18f]" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-[#e89581]" />
                  )}
                  <span className="tabular-nums">{stats.onlineCount} bạn trực tuyến</span>
                </div>
                <div className="text-[11px] text-[#b4c4b6] mt-0.5 tabular-nums">
                  {stats.waitingCount} đang đợi · {stats.activeRoomsCount} cặp đang trò chuyện
                </div>
              </div>
            </div>
          </div>
        </SanctuaryScene3D>
      )}

      {/* Mode Switcher Bar */}
      <div className="rounded-2xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-2.5 flex flex-wrap items-center gap-2 shadow-sm">
        <button
          type="button"
          onClick={() => setSubMode('one_on_one')}
          className={`min-h-[42px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            subMode === 'one_on_one'
              ? 'bg-[#46613e] text-white shadow-sm'
              : 'bg-[#f1efe5] dark:bg-[#232e25] text-[#4b604d] dark:text-[#b4c4b6] hover:text-[#273829] dark:hover:text-[#edf2e8] border border-[#dcdad0] dark:border-[#324236]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ghép đôi 1:1 ẩn danh</span>
        </button>

        <button
          type="button"
          onClick={() => setSubMode('lounge')}
          className={`min-h-[42px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            subMode === 'lounge'
              ? 'bg-[#46613e] text-white shadow-sm'
              : 'bg-[#f1efe5] dark:bg-[#232e25] text-[#4b604d] dark:text-[#b4c4b6] hover:text-[#273829] dark:hover:text-[#edf2e8] border border-[#dcdad0] dark:border-[#324236]'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Phòng trà gặp gỡ chung</span>
        </button>

        {myAlias && (
          <span className="ml-auto px-2 text-[11px] text-[#5e7260] dark:text-[#a6b7a8]">
            Danh xưng hiện tại: <strong className="text-[#273829] dark:text-[#edf2e8]">{myAlias}</strong>
          </span>
        )}
      </div>

      {errorBanner && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#f7eae4] dark:bg-[#38231e] border border-[#dfc0b4] dark:border-[#5e382f] text-xs text-[#8f4431] dark:text-[#f0b4a5]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="p-1 hover:text-[#273829] dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {peerNotice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#eef3ea] dark:bg-[#223024] border border-[#c3d3bd] dark:border-[#3e5642] text-xs text-[#2d452a] dark:text-[#b6deb0]">
          <span>{peerNotice}</span>
          <button onClick={() => setPeerNotice(null)} className="p-1 hover:text-[#273829] dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {safetyRiskLevel !== null && (
        <SupportPromptCard forcedLevel={safetyRiskLevel} />
      )}

      {/* 18+ & Safety Conduct Gate before accessing real-time chat */}
      {!conductAccepted ? (
        <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 sm:p-8 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-2.5 text-[#46613e] dark:text-[#98c18e]">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-lg font-bold text-[#243627] dark:text-[#f2f6ee] font-serif-healing">
              Nguyên tắc an toàn trước khi trò chuyện
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-[#3c4d3e] dark:text-[#c7d4c8] leading-relaxed list-disc pl-5">
            <li>Khu vực trò chuyện trực tiếp chỉ dành cho người từ <strong>18 tuổi trở lên</strong>.</li>
            <li>Không trao đổi số điện thoại, tài khoản mạng xã hội, địa chỉ hoặc thông tin chuyển tiền.</li>
            <li>Tôn trọng nhau, không gạ gẫm hẹn hò hoặc quấy rối; bạn có thể nhấn <strong>Báo cáo</strong> hoặc <strong>Rời phòng</strong> bất cứ lúc nào.</li>
          </ul>
          <button
            type="button"
            onClick={handleAcceptConduct}
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#46613e] hover:bg-[#384f31] text-white text-sm font-semibold transition shadow-sm"
          >
            Tôi đủ 18 tuổi và đồng ý nguyên tắc an toàn
          </button>
        </div>
      ) : (
      <>
      {/* SUB-MODE 1: 1-ON-1 REAL-TIME STRANGER CHAT */}
      {subMode === 'one_on_one' && (
        <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm overflow-hidden">
          {matchState === 'idle' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-[#243627] dark:text-[#f2f6ee] font-serif-healing">
                  Chọn điều bạn đang muốn sẻ chia
                </h3>
                <p className="text-xs text-[#576c59] dark:text-[#a6b7a8]">
                  Hệ thống sẽ ghép bạn với một người lạ đang trực tuyến có chung mong muốn trò chuyện.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TOPICS.map((t) => {
                  const active = selectedTopic === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTopic(t.id)}
                      className={`p-4 rounded-2xl border text-left transition ${
                        active
                          ? 'bg-[#e6efe2] dark:bg-[#273829] border-[#46613e] dark:border-[#6a935f] shadow-sm'
                          : 'bg-[#f1efe5] dark:bg-[#232e25] border-[#dfe2d5] dark:border-[#324236] hover:border-[#9eb198]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#243627] dark:text-[#f2f6ee]">{t.label}</div>
                      <div className="text-[11px] text-[#5e7260] dark:text-[#a6b7a8] mt-1 leading-relaxed">{t.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#e6e4d8] dark:border-[#2e3d31]">
                <div className="flex items-start gap-2 text-[11px] text-[#5e7260] dark:text-[#a6b7a8] max-w-md">
                  <ShieldCheck className="w-4 h-4 text-[#46613e] dark:text-[#98c18e] shrink-0 mt-0.5" />
                  <span>
                    Giữ an toàn cho chính mình: không chia sẻ số điện thoại, địa chỉ hay thông tin cá nhân nhạy cảm với người lạ.
                  </span>
                </div>

                <button
                  type="button"
                  disabled={connStatus !== 'connected' || !isCommunityOpen}
                  onClick={handleFindPartner}
                  className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  <span>{isCommunityOpen ? 'Tìm người trò chuyện' : 'Tạm nghỉ ngoài ca trực'}</span>
                </button>
              </div>
            </div>
          )}

          {matchState === 'searching' && (
            <div className="p-8 sm:p-12 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#e6efe2] dark:bg-[#253628] border border-[#c3d4bd] dark:border-[#3e5642] flex items-center justify-center text-[#46613e] dark:text-[#98c18e]">
                <Search className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-[#243627] dark:text-[#f2f6ee] font-serif-healing">
                  Đang tìm một người bạn đồng điệu trực tuyến...
                </h3>
                <p className="text-xs sm:text-sm text-[#576c59] dark:text-[#a6b7a8]">
                  Chủ đề: <strong>{topicLabel(selectedTopic)}</strong> · Hiện có {stats.onlineCount} người đang trực tuyến trong khu vườn.
                </p>
                <p className="text-[11px] text-[#6d7c6d] dark:text-[#93a695] max-w-md mx-auto pt-1">
                  Cuộc ghép đôi chỉ diễn ra giữa người thật đang mở Heali cùng lúc với bạn.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSubMode('lounge')}
                  className="px-4 py-2.5 rounded-xl bg-[#e6efe2] dark:bg-[#253628] hover:bg-[#dce7d6] dark:hover:bg-[#2e4332] text-[#273829] dark:text-[#edf2e8] text-xs font-semibold transition"
                >
                  Ghé Phòng trà chung trong lúc đợi
                </button>
                <button
                  type="button"
                  onClick={handleCancelSearch}
                  className="px-4 py-2.5 rounded-xl bg-[#f1efe5] dark:bg-[#232e25] hover:bg-[#e7e4d8] dark:hover:bg-[#2d3a30] border border-[#dcdad0] dark:border-[#324236] text-[#4b604d] dark:text-[#b4c4b6] text-xs font-semibold transition"
                >
                  Hủy tìm kiếm
                </button>
              </div>
            </div>
          )}

          {(matchState === 'matched' || matchState === 'partner_left') && (
            <div className="flex flex-col h-[520px]">
              {/* Room Top Bar */}
              <div className="px-5 py-3.5 bg-[#f1efe5] dark:bg-[#1f2921] border-b border-[#e2e0d4] dark:border-[#324236] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#46613e] text-white flex items-center justify-center text-sm font-bold">
                    {partnerAlias.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#243627] dark:text-[#f2f6ee]">{partnerAlias}</div>
                    <div className="text-[11px] text-[#5e7260] dark:text-[#a6b7a8]">
                      {matchState === 'matched'
                        ? `Đang kết nối · ${topicLabel(matchedTopic)}`
                        : 'Cuộc trò chuyện đã khép lại'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleFindPartner}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e6efe2] dark:bg-[#253628] hover:bg-[#d9e6d3] text-[#273829] dark:text-[#edf2e8] text-xs font-semibold transition"
                    title="Tìm người trò chuyện mới"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Đổi người</span>
                  </button>
                  {matchState === 'matched' && (
                    <>
                      <button
                        type="button"
                        onClick={handleReportPartner}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f6efe2] dark:bg-[#32291c] hover:bg-[#ece1cb] text-[#7a5d2e] dark:text-[#e5c27b] text-xs font-medium transition"
                        title="Báo cáo hành vi không an toàn"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Báo cáo</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleBlockPartner}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f5e7e2] dark:bg-[#38231e] hover:bg-[#efd8cf] text-[#9b4c39] dark:text-[#f0b4a5] text-xs font-medium transition"
                        title="Chặn và rời cuộc trò chuyện"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Chặn</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleLeaveRoom}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141b15] hover:bg-[#f7f5ed] dark:hover:bg-[#232f25] border border-[#d6d3c6] dark:border-[#324236] text-[#4b604d] dark:text-[#b4c4b6] text-xs font-medium transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Rời phòng</span>
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#faf7ef] dark:bg-[#172019]">
                <div className="text-center py-2">
                  <span className="inline-block px-3 py-1 rounded-xl bg-[#eef2e8] dark:bg-[#232f25] text-[11px] text-[#556b56] dark:text-[#a6b7a8]">
                    Hai bạn đã kết nối ẩn danh. Không gửi số điện thoại/mạng xã hội và bạn có thể dừng bất cứ lúc nào.
                  </span>
                </div>

                {periodicReminder && (
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[#eef3ea] dark:bg-[#223024] border border-[#c3d3bd] dark:border-[#3e5642] text-xs text-[#2d452a] dark:text-[#b6deb0]">
                    <span>{periodicReminder}</span>
                    <button
                      type="button"
                      onClick={() => setPeriodicReminder(null)}
                      className="p-1 hover:opacity-75"
                      aria-label="Đóng nhắc nhở"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {roomMessages.map((m) => {
                  const isMine = m.senderSocketId
                    ? m.senderSocketId === mySocketId
                    : m.senderId === myUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-[#6d7c6d] dark:text-[#9ab09c] mb-1 px-1">
                        {isMine ? 'Bạn' : m.senderAlias} · {formatClock(m.createdAt)}
                      </div>
                      <div
                        className={`max-w-[82%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                          isMine
                            ? 'bg-[#46613e] text-white rounded-br-sm'
                            : 'bg-[#efede2] dark:bg-[#232e25] border border-[#dedcd0] dark:border-[#324236] text-[#273829] dark:text-[#edf2e8] rounded-bl-sm'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}

                {partnerTyping && (
                  <div className="text-xs italic text-[#5e7260] dark:text-[#a6b7a8] px-2">
                    {partnerAlias} đang viết lời nhắn...
                  </div>
                )}

                {matchState === 'partner_left' && (
                  <div className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232e25] border border-[#dedcd0] dark:border-[#324236] text-center space-y-2.5 my-3">
                    <p className="text-xs text-[#4b604d] dark:text-[#b4c4b6] font-serif-healing italic">
                      Người bạn đồng hành vừa rời khỏi cuộc trò chuyện. Mong bạn vẫn giữ được sự nhẹ nhõm trong lòng.
                    </p>
                    <button
                      type="button"
                      onClick={handleFindPartner}
                      className="px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold transition"
                    >
                      Tìm cuộc trò chuyện mới
                    </button>
                  </div>
                )}

                <div ref={roomBottomRef} />
              </div>

              {/* Message Input Bar */}
              <div className="bg-[#f1efe5] dark:bg-[#1f2921] border-t border-[#e2e0d4] dark:border-[#324236] p-3.5 space-y-2.5">
                <SupportPromptCard text={inputText} compact />
                <form
                  onSubmit={handleSendRoomMessage}
                  className="flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => handleRoomInputChange(e.target.value)}
                    disabled={matchState !== 'matched'}
                    maxLength={1000}
                    placeholder={
                      matchState === 'matched'
                        ? 'Viết điều bạn muốn tâm sự...'
                        : 'Cuộc trò chuyện đã kết thúc'
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#141b15] border border-[#d6d3c6] dark:border-[#324236] focus:border-[#46613e] focus:outline-none text-sm text-[#273829] dark:text-[#edf2e8] placeholder:text-[#6f7e70]"
                  />
                  <button
                    type="submit"
                    disabled={matchState !== 'matched' || !inputText.trim()}
                    className="min-h-[42px] px-4 py-2.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-45 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Gửi</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-MODE 2: LIVE MULTI-USER SANCTUARY LOUNGE */}
      {subMode === 'lounge' && (
        <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm overflow-hidden flex flex-col h-[540px]">
          <div className="px-5 py-3.5 bg-[#f1efe5] dark:bg-[#1f2921] border-b border-[#e2e0d4] dark:border-[#324236] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#e6efe2] dark:bg-[#253628] border border-[#c8d6c1] dark:border-[#3e5642] flex items-center justify-center text-[#46613e] dark:text-[#98c18e]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#243627] dark:text-[#f2f6ee]">Phòng trà gặp gỡ chung</h3>
                <p className="text-[11px] text-[#5e7260] dark:text-[#a6b7a8]">
                  Không gian trò chuyện trực tiếp cùng mọi người đang ghé khu vườn
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {LOUNGE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setLoungeTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    loungeTag === tag
                      ? 'bg-[#46613e] text-white'
                      : 'bg-white dark:bg-[#141b15] border border-[#dcdad0] dark:border-[#324236] text-[#4b604d] dark:text-[#b4c4b6] hover:text-[#273829] dark:hover:text-[#edf2e8]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {loungeMessages.map((m) => {
              const isMine = m.senderSocketId
                ? m.senderSocketId === mySocketId
                : m.senderId === myUserId;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-[#5e7260] dark:text-[#a6b7a8] mb-1 px-1">
                    <span className="font-semibold text-[#46613e] dark:text-[#98c18e]">
                      {isMine ? 'Bạn' : m.senderAlias}
                    </span>
                    <span>· {m.topicTag}</span>
                    <span>· {formatClock(m.createdAt)}</span>
                    {!isMine && (
                      <button
                        type="button"
                        onClick={() =>
                          setReportTarget({
                            kind: 'lounge',
                            messageId: m.id,
                            alias: m.senderAlias,
                          })
                        }
                        className="ml-1 p-0.5 rounded hover:text-[#9b4b38] transition"
                        title="Báo cáo tin nhắn này"
                        aria-label={`Báo cáo tin nhắn từ ${m.senderAlias}`}
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] sm:max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      isMine
                        ? 'bg-[#46613e] text-white rounded-br-sm'
                        : 'bg-[#f1efe5] dark:bg-[#232e25] border border-[#dedcd0] dark:border-[#324236] text-[#273829] dark:text-[#edf2e8] rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={loungeBottomRef} />
          </div>

          <div className="bg-[#f1efe5] dark:bg-[#1f2921] border-t border-[#e2e0d4] dark:border-[#324236] p-3.5 space-y-2.5">
            <SupportPromptCard text={loungeInput} compact />
            <form
              onSubmit={handleSendLoungeMessage}
              className="flex items-center gap-2.5"
            >
              <input
                type="text"
                value={loungeInput}
                onChange={(e) => setLoungeInput(e.target.value)}
                disabled={connStatus !== 'connected' || !isCommunityOpen}
                maxLength={600}
                placeholder={
                  isCommunityOpen
                    ? 'Gửi lời chào hoặc tâm sự nhẹ nhàng tới phòng trà...'
                    : 'Phòng trà tạm đóng ngoài ca trực kiểm duyệt'
                }
                className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#141b15] border border-[#d6d3c6] dark:border-[#324236] focus:border-[#46613e] focus:outline-none text-sm text-[#273829] dark:text-[#edf2e8] placeholder:text-[#6f7e70]"
              />
              <button
                type="submit"
                disabled={connStatus !== 'connected' || !isCommunityOpen || !loungeInput.trim()}
                className="min-h-[42px] px-4 py-2.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-45 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </form>
          </div>
        </div>
      )}
      </>
      )}

      {/* Report Modal for 1:1 & Lounge */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/55 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitChatReport}
            className="w-full max-w-sm rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#9b4b38] dark:text-[#e9a392] font-bold text-sm">
                <Flag className="w-4 h-4" />
                <span>
                  {reportTarget.kind === 'lounge'
                    ? `Báo cáo tin nhắn của ${reportTarget.alias}`
                    : 'Báo cáo hành vi không an toàn'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="p-1 text-[#5e7260]"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[#4b604d] dark:text-[#b4c4b6] leading-relaxed">
              Nội dung báo cáo sẽ chuyển ngay vào hàng đợi rà soát an toàn để đội ngũ kiểm duyệt xử lý.
            </p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#141b15] border border-[#d6d3c6] dark:border-[#324236]"
            >
              <option value="Quấy rối / thiếu tôn trọng">Quấy rối, xúc phạm hoặc thiếu tôn trọng</option>
              <option value="Xin liên hệ cá nhân / gạ gẫm">Xin số điện thoại, mạng xã hội hoặc gạ gẫm</option>
              <option value="Yêu cầu chuyển tiền / lừa đảo">Yêu cầu chuyển tiền hoặc có dấu hiệu lừa đảo</option>
              <option value="Nội dung kích động hoặc nguy hại">Nội dung gây hoảng loạn / tự hại</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#243027] font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#9b4b38] hover:bg-[#823c2b] text-white font-semibold"
              >
                Gửi báo cáo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
