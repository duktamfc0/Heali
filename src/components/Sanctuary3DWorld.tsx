import React from 'react';
import { R3FScene } from './world/r3f/R3FScene';
import type { WorldZone } from './world/WorldEnvironment';
import type { WeatherMode } from './world/DynamicWeatherOverlay';
import type { RoomActionId, RoomLocationId, VietnameseRegionId } from './world/r3f/roomTypes';

interface Sanctuary3DWorldProps {
  weatherMode?: WeatherMode;
  onChangeWeatherMode?: (mode: WeatherMode) => void;
  requestedRoom?: { room: RoomLocationId; seq: number } | null;
  requestedRegion?: { region: VietnameseRegionId; seq: number } | null;
  fullViewport?: boolean;
  isAudioBarVisible?: boolean;
  isDrawerOpen?: boolean;
  onLocationChange?: (location: RoomLocationId) => void;
  onInteriorChange?: (isInside: boolean) => void;
  onOpenFloatModal: () => void;
  onOpenAllFeatures?: () => void;
  onTriggerRoomAction: (action: RoomActionId) => void;
  onSelectZone: (
    zone:
      | 'lake'
      | 'community'
      | 'journal'
      | 'letters'
      | 'wishes'
      | 'rain_room'
      | 'stranger_chat'
      | 'spiritual_room'
  ) => void;
}

export const Sanctuary3DWorld: React.FC<Sanctuary3DWorldProps> = ({
  weatherMode = 'petals',
  onChangeWeatherMode,
  requestedRoom,
  requestedRegion,
  fullViewport = false,
  isAudioBarVisible = true,
  isDrawerOpen = false,
  onLocationChange,
  onInteriorChange,
  onOpenFloatModal,
  onOpenAllFeatures,
  onTriggerRoomAction,
  onSelectZone,
}) => {
  const handleSelectZone = (zoneId: WorldZone['id']) => {
    if (zoneId === 'listening_alcove') {
      onTriggerRoomAction('open_stranger_chat');
    } else if (zoneId === 'personal_garden') {
      onTriggerRoomAction('open_mood_checkin');
    } else {
      onSelectZone(zoneId);
    }
  };

  return (
    <section className="relative">
      <R3FScene
        weatherMode={weatherMode}
        onChangeWeatherMode={onChangeWeatherMode}
        requestedRoom={requestedRoom}
        requestedRegion={requestedRegion}
        fullViewport={fullViewport}
        isAudioBarVisible={isAudioBarVisible}
        isDrawerOpen={isDrawerOpen}
        onLocationChange={onLocationChange}
        onInteriorChange={onInteriorChange}
        onSelectZone={handleSelectZone}
        onTriggerAction={onTriggerRoomAction}
        onOpenFloatModal={onOpenFloatModal}
        onOpenAllFeatures={onOpenAllFeatures}
      />
    </section>
  );
};
