export type RoomLocationId =
  | 'outdoor'
  | 'journal'
  | 'letters'
  | 'wishes'
  | 'calm'
  | 'community'
  | 'spiritual_room'
  | 'lake';

export type VietnameseRegionId = 'mien_que' | 'mien_nui' | 'mien_bien' | 'yen_binh';

export type RoomActionId =
  | 'open_journal'
  | 'open_mood_checkin'
  | 'open_letters'
  | 'open_wishes'
  | 'open_calm_breathe'
  | 'open_calm_audio'
  | 'open_calm_grounding'
  | 'open_calm_compassion'
  | 'open_calm_reframe'
  | 'open_confessions'
  | 'open_stranger_chat'
  | 'open_spiritual_tarot'
  | 'open_spiritual_tuvi'
  | 'open_spiritual_chairs'
  | 'open_float_lantern'
  | 'open_send_gift'
  | 'open_daily_card'
  | 'open_ex_urge'
  | 'open_seven_nights'
  | 'open_difficult_dates'
  | 'open_ai_mirror'
  | 'open_lake_2d'
  | 'open_privacy'
  | 'open_quarterly_report';

export interface ActiveRoomHotspot {
  action: RoomActionId;
  label: string;
  hint: string;
}

export interface RoomMeta {
  id: Exclude<RoomLocationId, 'outdoor'>;
  name: string;
  subtitle: string;
  primaryAction: RoomActionId;
  primaryLabel: string;
  exitDoorstep: { x: number; z: number };
  bgHex: string;
  fogHex: string;
}

export const ROOM_METADATA: Record<Exclude<RoomLocationId, 'outdoor'>, RoomMeta> = {
  journal: {
    id: 'journal',
    name: 'Nhà Nhật Ký',
    subtitle: 'Ánh lửa lò sưởi ấm áp · Sổ tay mã hóa & tinh thể tâm trạng',
    primaryAction: 'open_journal',
    primaryLabel: 'Mở Sổ Nhật Ký',
    exitDoorstep: { x: 0, z: 0.8 },
    bgHex: '#1f1712',
    fogHex: '#2d221b',
  },
  letters: {
    id: 'letters',
    name: 'Bưu Điện Ký Ức',
    subtitle: 'Gỗ thông trầm ấm · Thư chưa gửi & Lư hoá tro đồng cổ',
    primaryAction: 'open_letters',
    primaryLabel: 'Viết / Hoá Thư Chưa Gửi',
    exitDoorstep: { x: 37.2, z: 11.4 },
    bgHex: '#261b18',
    fogHex: '#352621',
  },
  wishes: {
    id: 'wishes',
    name: 'Đền Cây Ước Nguyện',
    subtitle: 'Dải lụa ước lành dưới cội cổ thụ & Bệ tinh thể ngọc bích',
    primaryAction: 'open_wishes',
    primaryLabel: 'Treo Dải Ước Nguyện',
    exitDoorstep: { x: -24.8, z: 24.2 },
    bgHex: '#18241d',
    fogHex: '#223329',
  },
  calm: {
    id: 'calm',
    name: 'Căn Phòng Mưa & Hơi Thở',
    subtitle: 'Nhà kính mưa dịu · Quả cầu thở 4-7-8 & Chuông gió lưu ly',
    primaryAction: 'open_calm_breathe',
    primaryLabel: 'Thở 4-7-8 Cùng Quả Cầu',
    exitDoorstep: { x: 24.0, z: 30.2 },
    bgHex: '#182226',
    fogHex: '#213036',
  },
  community: {
    id: 'community',
    name: 'Trà Thất Tâm Tình',
    subtitle: 'Tường giấy tâm sự & Bàn trà gỗ ấm áp gặp gỡ 1:1',
    primaryAction: 'open_confessions',
    primaryLabel: 'Đọc Tâm Tình Ẩn Danh',
    exitDoorstep: { x: -29.2, z: -1.4 },
    bgHex: '#241c17',
    fogHex: '#332720',
  },
  spiritual_room: {
    id: 'spiritual_room',
    name: 'Phòng Tâm Linh',
    subtitle: 'Bàn trải bài Tarot · Hỗn Thiên Nghi Tử Vi & Ghế Cố Vấn',
    primaryAction: 'open_spiritual_tarot',
    primaryLabel: 'Trải Bài Tarot',
    exitDoorstep: { x: -16.0, z: -30.2 },
    bgHex: '#181526',
    fogHex: '#231f38',
  },
  lake: {
    id: 'lake',
    name: 'Bến Thuyền Hồ Hoa Đăng',
    subtitle: 'Thủy đình bên mặt hồ ngọc bích · Giỏ hoa đăng phát sáng',
    primaryAction: 'open_float_lantern',
    primaryLabel: 'Thả Đèn Hoa Đăng',
    exitDoorstep: { x: 0, z: 22.8 },
    bgHex: '#152126',
    fogHex: '#1e3036',
  },
};

export const liveSceneActivity = {
  isOutdoor: true,
};

