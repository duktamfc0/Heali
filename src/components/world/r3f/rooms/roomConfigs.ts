import type { ActiveRoomHotspot, RoomLocationId } from '../roomTypes';

export type ActiveInteriorRoomId = Exclude<RoomLocationId, 'outdoor'>;

export interface ObstacleCircle {
  x: number;
  z: number;
  radius: number;
}

export interface HotspotCircle {
  x: number;
  z: number;
  radius: number;
  hotspot: ActiveRoomHotspot;
}

export interface RoomLightSpec {
  ambientColor: string;
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  dirColor: string;
  dirIntensity: number;
  rimColor: string;
  rimIntensity: number;
  accent1Color: string;
  accent1Intensity: number;
  accent1Pos: [number, number, number];
  accent2Color: string;
  accent2Intensity: number;
  accent2Pos: [number, number, number];
}

export interface RoomSpatialConfig {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  spawnPos: [number, number, number];
  exitDoorPos: [number, number, number];
  cameraBaseHeight: number;
  cameraBaseDist: number;
  obstacles: ObstacleCircle[];
  hotspots: HotspotCircle[];
}

export const ROOM_LIGHT_SPECS: Record<ActiveInteriorRoomId, RoomLightSpec> = {
  journal: {
    ambientColor: '#fde8cc',
    ambientIntensity: 0.35,
    hemiSky: '#fff1d9',
    hemiGround: '#3d2a1d',
    hemiIntensity: 0.5,
    dirColor: '#fff5e4',
    dirIntensity: 0.9,
    rimColor: '#9dd9c8',
    rimIntensity: 0.36,
    accent1Color: '#fb923c',
    accent1Intensity: 1.65,
    accent1Pos: [-3.6, 1.45, -4.35],
    accent2Color: '#fde68a',
    accent2Intensity: 1.25,
    accent2Pos: [0.3, 2.0, 0.2],
  },
  letters: {
    ambientColor: '#fbd8c4',
    ambientIntensity: 0.35,
    hemiSky: '#ffe8d6',
    hemiGround: '#3b241c',
    hemiIntensity: 0.48,
    dirColor: '#fff1e2',
    dirIntensity: 0.88,
    rimColor: '#a7f3d0',
    rimIntensity: 0.34,
    accent1Color: '#f59e0b',
    accent1Intensity: 1.55,
    accent1Pos: [-3.55, 2.0, -0.75],
    accent2Color: '#fb7185',
    accent2Intensity: 1.4,
    accent2Pos: [3.65, 1.5, -1.15],
  },
  wishes: {
    ambientColor: '#d9f2e4',
    ambientIntensity: 0.35,
    hemiSky: '#ebfaef',
    hemiGround: '#24362a',
    hemiIntensity: 0.52,
    dirColor: '#f7fce8',
    dirIntensity: 0.9,
    rimColor: '#6ee7b7',
    rimIntensity: 0.38,
    accent1Color: '#fde68a',
    accent1Intensity: 1.65,
    accent1Pos: [-2.85, 3.2, -1.45],
    accent2Color: '#34d399',
    accent2Intensity: 1.3,
    accent2Pos: [4.55, 1.75, -0.55],
  },
  calm: {
    ambientColor: '#d1eef6',
    ambientIntensity: 0.35,
    hemiSky: '#e4f6fb',
    hemiGround: '#223138',
    hemiIntensity: 0.52,
    dirColor: '#eefafe',
    dirIntensity: 0.88,
    rimColor: '#a7f3d0',
    rimIntensity: 0.38,
    accent1Color: '#67e8f9',
    accent1Intensity: 1.6,
    accent1Pos: [0, 2.2, -0.95],
    accent2Color: '#fde68a',
    accent2Intensity: 1.2,
    accent2Pos: [4.55, 1.7, 0.55],
  },
  community: {
    ambientColor: '#f6dfc5',
    ambientIntensity: 0.36,
    hemiSky: '#fdf0df',
    hemiGround: '#382a1e',
    hemiIntensity: 0.5,
    dirColor: '#fff4e3',
    dirIntensity: 0.88,
    rimColor: '#a7f3d0',
    rimIntensity: 0.36,
    accent1Color: '#fbbf24',
    accent1Intensity: 1.55,
    accent1Pos: [-4.15, 2.4, -1.45],
    accent2Color: '#f59e0b',
    accent2Intensity: 1.35,
    accent2Pos: [3.15, 2.0, -0.55],
  },
  spiritual_room: {
    ambientColor: '#d9cff7',
    ambientIntensity: 0.34,
    hemiSky: '#ebe4fc',
    hemiGround: '#221c38',
    hemiIntensity: 0.46,
    dirColor: '#f3ebff',
    dirIntensity: 0.86,
    rimColor: '#67e8f9',
    rimIntensity: 0.4,
    accent1Color: '#c084fc',
    accent1Intensity: 1.7,
    accent1Pos: [0, 2.6, -2.45],
    accent2Color: '#fbbf24',
    accent2Intensity: 1.35,
    accent2Pos: [-4.25, 1.85, 0.35],
  },
  lake: {
    ambientColor: '#ccebe8',
    ambientIntensity: 0.36,
    hemiSky: '#e4f7f5',
    hemiGround: '#1b3136',
    hemiIntensity: 0.52,
    dirColor: '#f2fcf9',
    dirIntensity: 0.88,
    rimColor: '#fde68a',
    rimIntensity: 0.38,
    accent1Color: '#fbbf24',
    accent1Intensity: 1.6,
    accent1Pos: [-3.25, 2.1, -1.85],
    accent2Color: '#5eead4',
    accent2Intensity: 1.35,
    accent2Pos: [3.75, 2.0, -0.55],
  },
};

export const ROOM_SPATIAL_CONFIGS: Record<ActiveInteriorRoomId, RoomSpatialConfig> = {
  journal: {
    bounds: { minX: -7.5, maxX: 7.6, minZ: -5.1, maxZ: 5.25 },
    spawnPos: [0, 0, 1.9],
    exitDoorPos: [0, 0.03, 5.25],
    cameraBaseHeight: 4.3,
    cameraBaseDist: 7.0,
    obstacles: [
      { x: -3.6, z: -4.55, radius: 1.4 }, // Hearth Fireplace
      { x: -7.65, z: -0.1, radius: 0.95 }, // Left Wall Bookcases
      { x: 0, z: 0.2, radius: 1.25 }, // Writing Desk
      { x: 1.75, z: 0.45, radius: 0.85 }, // Reading Armchair
      { x: 4.85, z: -2.85, radius: 0.85 }, // Emerald Mood Crystal Pedestal
      { x: 5.45, z: 1.05, radius: 1.45 }, // Right Lounge Sofa & Tea Table
      { x: 6.85, z: -4.45, radius: 0.8 }, // Corner Botanical Plant
      { x: -5.4, z: 2.9, radius: 0.85 }, // Left Corner Armchair & Globe
    ],
    hotspots: [
      {
        x: 0,
        z: 0.2,
        radius: 2.05,
        hotspot: {
          action: 'open_journal',
          label: 'Mở Cuốn Sổ Nhật Ký',
          hint: 'Viết ra những điều riêng tư trên trang giấy ấm ánh nến',
        },
      },
      {
        x: 4.85,
        z: -2.85,
        radius: 1.85,
        hotspot: {
          action: 'open_mood_checkin',
          label: 'Chạm Tinh Thể Tâm Trạng',
          hint: 'Gọi tên cảm xúc hôm nay & xem hành trình của bạn',
        },
      },
    ],
  },
  letters: {
    bounds: { minX: -7.6, maxX: 7.6, minZ: -5.1, maxZ: 5.25 },
    spawnPos: [0, 0, 1.9],
    exitDoorPos: [0, 0.03, 5.25],
    cameraBaseHeight: 4.3,
    cameraBaseDist: 7.0,
    obstacles: [
      { x: -3.55, z: -0.75, radius: 1.25 }, // Cedar Postal Writing Desk
      { x: 3.65, z: -1.15, radius: 1.15 }, // Tripod Bronze Ash Brazier
      { x: -6.5, z: -4.1, radius: 0.85 }, // Corner Plant & Pigeonhole Rack
      { x: 6.75, z: -3.8, radius: 0.78 }, // Red Pillar Postbox
      { x: 5.85, z: 1.85, radius: 1.15 }, // Vintage Leather Mail Bench
      { x: 2.95, z: -4.45, radius: 0.65 }, // Nautical Brass Telescope
    ],
    hotspots: [
      {
        x: -3.55,
        z: -0.75,
        radius: 2.0,
        hotspot: {
          action: 'open_letters',
          label: 'Bàn Viết & Niêm Phong Thư',
          hint: 'Viết lá thư chưa gửi hoặc hẹn ngày mở lại',
        },
      },
      {
        x: 3.65,
        z: -1.15,
        radius: 1.9,
        hotspot: {
          action: 'open_letters',
          label: 'Lư Hoá Thư Đồng Cổ',
          hint: 'Hoá tro lá thư cũ để buông nhẹ nỗi lòng',
        },
      },
    ],
  },
  wishes: {
    bounds: { minX: -7.8, maxX: 7.8, minZ: -5.2, maxZ: 5.35 },
    spawnPos: [0, 0, 2.0],
    exitDoorPos: [0, 0.03, 5.35],
    cameraBaseHeight: 4.4,
    cameraBaseDist: 7.3,
    obstacles: [
      { x: -2.85, z: -1.45, radius: 1.65 }, // Monumental Ancient Wish Tree
      { x: 4.55, z: -0.55, radius: 1.0 }, // Jade Mood Crystal Altar
      { x: 0.65, z: -4.55, radius: 1.15 }, // Inner Moon Pond Edge
      { x: 6.45, z: -4.05, radius: 0.85 }, // Stone Tōrō Lantern & Tsukubai
    ],
    hotspots: [
      {
        x: -2.85,
        z: -1.45,
        radius: 2.55,
        hotspot: {
          action: 'open_wishes',
          label: 'Cội Cổ Thụ Ước Nguyện',
          hint: 'Treo một dải lụa ước lành & cam kết dịu dàng',
        },
      },
      {
        x: 4.55,
        z: -0.55,
        radius: 1.9,
        hotspot: {
          action: 'open_mood_checkin',
          label: 'Bệ Tinh Thể Cảm Xúc',
          hint: 'Gọi tên tâm trạng hôm nay của bạn',
        },
      },
    ],
  },
  calm: {
    bounds: { minX: -7.6, maxX: 7.6, minZ: -5.1, maxZ: 5.25 },
    spawnPos: [0, 0, 1.9],
    exitDoorPos: [0, 0.03, 5.25],
    cameraBaseHeight: 4.3,
    cameraBaseDist: 7.1,
    obstacles: [
      { x: 0, z: -0.95, radius: 1.15 }, // 4-7-8 Crystal Orb Dais
      { x: -4.55, z: 0.45, radius: 1.05 }, // Wind Chimes & Acoustic Gramophone
      { x: 4.55, z: 0.55, radius: 1.25 }, // Zen Sand Garden & Grounding Cushions
      { x: -6.5, z: -3.7, radius: 0.85 }, // Conservatory Planters
      { x: 6.5, z: -3.7, radius: 0.85 }, // Conservatory Planters
    ],
    hotspots: [
      {
        x: 0,
        z: -0.95,
        radius: 2.05,
        hotspot: {
          action: 'open_calm_breathe',
          label: 'Quả Cầu Thở Lưu Ly 4-7-8',
          hint: 'Điều hòa nhịp thở chậm 4-7-8 để dịu lại ngay',
        },
      },
      {
        x: -4.55,
        z: 0.45,
        radius: 1.95,
        hotspot: {
          action: 'open_calm_audio',
          label: 'Chuông Gió & Tiếng Mưa',
          hint: 'Nghe thanh âm mưa rơi, suối chảy & thiền nhẹ',
        },
      },
      {
        x: 4.55,
        z: 0.55,
        radius: 2.05,
        hotspot: {
          action: 'open_calm_grounding',
          label: 'Vườn Cát Thiền & Gối Neo Cảm Giác',
          hint: 'Bài tập 5-4-3-2-1 quay về thực tại an toàn',
        },
      },
    ],
  },
  community: {
    bounds: { minX: -7.7, maxX: 7.7, minZ: -5.1, maxZ: 5.25 },
    spawnPos: [0, 0, 1.9],
    exitDoorPos: [0, 0.03, 5.25],
    cameraBaseHeight: 4.3,
    cameraBaseDist: 7.1,
    obstacles: [
      { x: -4.15, z: -1.45, radius: 1.3 }, // Tường Giấy Tâm Tình Rack
      { x: 3.15, z: -0.55, radius: 1.4 }, // Chabudai Tea Table & Zabuton Cushions
      { x: -6.65, z: 2.15, radius: 0.8 }, // Bamboo Planter
      { x: 6.65, z: -3.7, radius: 0.8 }, // Corner Lantern & Bamboo
    ],
    hotspots: [
      {
        x: -4.15,
        z: -1.45,
        radius: 2.05,
        hotspot: {
          action: 'open_confessions',
          label: 'Tường Giấy Tâm Tình',
          hint: 'Đọc & gửi những bộc bạch ẩn danh dịu dàng',
        },
      },
      {
        x: 3.15,
        z: -0.55,
        radius: 2.15,
        hotspot: {
          action: 'open_stranger_chat',
          label: 'Bàn Trà Gặp Gỡ 1:1',
          hint: 'Trò chuyện ẩn danh cùng một người bạn đồng điệu',
        },
      },
    ],
  },
  spiritual_room: {
    bounds: { minX: -7.9, maxX: 7.9, minZ: -5.25, maxZ: 5.4 },
    spawnPos: [0, 0, 2.0],
    exitDoorPos: [0, 0.03, 5.4],
    cameraBaseHeight: 4.45,
    cameraBaseDist: 7.4,
    obstacles: [
      { x: 0, z: -2.45, radius: 1.3 }, // Armillary Sphere Dais
      { x: -4.25, z: 0.35, radius: 1.15 }, // Emerald Velvet Tarot Table
      { x: 4.25, z: 0.45, radius: 1.2 }, // Advisor Counsel Nook
      { x: -6.75, z: -4.2, radius: 0.9 }, // Mystic Bookcase
      { x: 6.75, z: -4.2, radius: 0.9 }, // Mystic Bookcase
    ],
    hotspots: [
      {
        x: -4.25,
        z: 0.35,
        radius: 2.0,
        hotspot: {
          action: 'open_spiritual_tarot',
          label: 'Bàn Trải Bài Tarot 78 Lá',
          hint: 'Rút bài Tarot soi chiếu nội tâm nhẹ nhàng',
        },
      },
      {
        x: 0,
        z: -2.45,
        radius: 2.05,
        hotspot: {
          action: 'open_spiritual_tuvi',
          label: 'Hỗn Thiên Nghi Tử Vi & Số Học',
          hint: 'Khám phá bản đồ Tử Vi & Thần Số Học của bạn',
        },
      },
      {
        x: 4.25,
        z: 0.45,
        radius: 2.0,
        hotspot: {
          action: 'open_spiritual_chairs',
          label: 'Ghế Cố Vấn Tâm Giao 1:1',
          hint: 'Đặt lịch hoặc trò chuyện cùng người dẫn đường',
        },
      },
    ],
  },
  lake: {
    bounds: { minX: -7.6, maxX: 7.6, minZ: -5.1, maxZ: 5.4 },
    spawnPos: [0, 0, 2.0],
    exitDoorPos: [0, 0.03, 5.4],
    cameraBaseHeight: 4.4,
    cameraBaseDist: 7.3,
    obstacles: [
      { x: -3.25, z: -1.85, radius: 1.1 }, // Glowing Lotus Lantern Basket
      { x: 3.75, z: -0.55, radius: 1.2 }, // Gift-Lantern Wrapping Desk
      { x: 5.3, z: 1.15, radius: 0.85 }, // Lakeside Armchair
    ],
    hotspots: [
      {
        x: -3.25,
        z: -1.85,
        radius: 2.1,
        hotspot: {
          action: 'open_float_lantern',
          label: 'Giỏ Hoa Đăng Bên Bến Nước',
          hint: 'Viết lời nguyện ước & thả đèn hoa đăng lên mặt hồ',
        },
      },
      {
        x: 3.75,
        z: -0.55,
        radius: 2.05,
        hotspot: {
          action: 'open_send_gift',
          label: 'Bàn Gửi Đèn Tặng Người Thương',
          hint: 'Gói một chiếc đèn hoa đăng gửi lời chúc qua liên kết riêng',
        },
      },
    ],
  },
};
