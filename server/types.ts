export interface DbUserRow {
  id: string;
  token_hash: string;
  token_expires_at: string;
  nickname: string;
  avatar: string;
  status_message: string;
  pin_hash: string | null;
  recovery_code_hash: string | null;
  pin_failed_attempts: number;
  pin_locked_until: string | null;
  blocked_user_ids_json: string;
  reported_post_ids_json: string;
  is_banned: number;
  created_at: string;
}

export interface SafeUserDto {
  id: string;
  nickname: string;
  avatar: string;
  statusMessage: string;
  hasPin: boolean;
  pinUnlocked: boolean;
  hasRecoveryCode: boolean;
  blockedUserIds: string[];
  reportedPostIds: string[];
  isBanned: boolean;
  createdAt: string;
}

export interface AuthenticatedContext {
  user: SafeUserDto;
  rawToken: string;
  pinHash: string | null;
}
