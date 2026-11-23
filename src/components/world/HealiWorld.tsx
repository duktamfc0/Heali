import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Avatar3D } from './Avatar3D';
import { WorldEnvironment, type WorldZone } from './WorldEnvironment';
import { WorldHUD } from './WorldHUD';
import { soundEngine } from '../../services/soundEngine';
import { MessageCircle, X } from 'lucide-react';

export interface HealiWorldProps {
  onSelectZone: (zoneId: WorldZone['id']) => void;
  onOpenFloatModal: () => void;
  onOpenWriteLetter: () => void;
}

// Math helpers pre-allocated at module scope to avoid Garbage Collection in render loop
const _vec3 = new THREE.Vector3();
const _targetCameraPos = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

interface SoulWhisper {
  name: string;
  avatarRole: string;
  quote: string;
  x: number;
  z: number;
}

const AMBIENT_SOULS: SoulWhisper[] = [
  {
    name: 'Tâm Hồn Lặng Lẽ',
    avatarRole: 'Người ngồi bên hồ',
    quote: 'Mỗi ngọn đèn hoa đăng trôi qua đều chở theo một nỗi đau đã sẵn sàng được buông xuống...',
    x: 2.2,
    z: -3.8,
  },
  {
    name: 'Bạn Lữ Hành Xa Xứ',
    avatarRole: 'Dưới cội cây ước nguyện',
    quote: 'Đừng vội thúc ép bản thân phải lành lặn ngay hôm nay. Cho phép mình được nghỉ chân một chút.',
    x: -6.8,
    z: 5.2,
  },
  {
    name: 'Người Gác Đêm',
    avatarRole: 'Bên hiên thư viện',
    quote: 'Những gì bạn chưa thể nói thành lời, nơi này sẽ luôn giữ hộ bạn trong thầm lặng.',
    x: 6.2,
    z: 1.2,
  },
];

export const HealiWorld: React.FC<HealiWorldProps> = ({
  onSelectZone,
  onOpenFloatModal,
  onOpenWriteLetter,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // UI State
  const [currentZone, setCurrentZone] = useState<WorldZone | null>(null);
  const [allZones, setAllZones] = useState<WorldZone[]>([]);
  const [robeColor, setRobeColor] = useState<number>(0x9333ea);
  const [cameraMode, setCameraMode] = useState<'follow' | 'isometric' | 'cinematic'>('follow');
  const [isZenMode, setIsZenMode] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [activeWhisper, setActiveWhisper] = useState<SoulWhisper | null>(null);

  // World internal instances & refs
  const avatarRef = useRef<Avatar3D | null>(null);
  const worldEnvRef = useRef<WorldEnvironment | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const clickTargetRef = useRef<THREE.Vector3 | null>(null);
  const clickMarkerMeshRef = useRef<THREE.Mesh | null>(null);
  const joystickVectorRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const keyboardKeysRef = useRef<{ [key: string]: boolean }>({});
  const animFrameIdRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());

  // Handle interacting with a zone
  const handleInteractZone = useCallback(
    (zone: WorldZone) => {
      if (zone.id === 'lake') {
        onOpenFloatModal();
      } else if (zone.id === 'letters') {
        onOpenWriteLetter();
      } else {
        onSelectZone(zone.id);
      }
    },
    [onOpenFloatModal, onOpenWriteLetter, onSelectZone]
  );

  // Fast Travel Teleport
  const handleTeleportToZone = useCallback((zoneId: WorldZone['id']) => {
    if (!avatarRef.current || !worldEnvRef.current) return;
    const targetZone = worldEnvRef.current.zones.find((z) => z.id === zoneId);
    if (targetZone) {
      avatarRef.current.position.set(
        targetZone.position.x + (Math.random() * 0.4 - 0.2),
        0,
        targetZone.position.z + 1.2
      );
      clickTargetRef.current = null;
      if (clickMarkerMeshRef.current) clickMarkerMeshRef.current.visible = false;
      setCurrentZone(targetZone);
    }
  }, []);

  // Update Robe Color
  const handleUpdateRobeColor = useCallback((color: number) => {
    setRobeColor(color);
    if (avatarRef.current) {
      avatarRef.current.setRobeColor(color);
    }
  }, []);

  // Toggle Sound
  const handleToggleSound = useCallback(() => {
    setSoundMuted((prev) => {
      const next = !prev;
      if (next) {
        soundEngine.setVolume('master', 0);
      } else {
        soundEngine.setVolume('master', 0.7);
        if (!soundEngine.getIsPlaying()) {
          soundEngine.start();
        }
      }
      return next;
    });
  }, []);

  // Initialize Three.js scene and loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0b18);
    scene.fog = new THREE.FogExp2(0x0e0f24, 0.022);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 580;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 160);
    cameraRef.current = camera;
    camera.position.set(0, 5, 8);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(width, height);
    container.replaceChildren(renderer.domElement);

    // 4. RoomEnvironment for PBR sheen
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x4338ca, 0x1e1b4b, 0.9);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const moonLight = new THREE.DirectionalLight(0xdbeafe, 1.4);
    moonLight.position.set(22, 28, -45);
    moonLight.castShadow = !isSoftwareGl;
    if (moonLight.castShadow) {
      moonLight.shadow.mapSize.width = 1024;
      moonLight.shadow.mapSize.height = 1024;
      moonLight.shadow.camera.near = 1.0;
      moonLight.shadow.camera.far = 100;
      moonLight.shadow.camera.left = -26;
      moonLight.shadow.camera.right = 26;
      moonLight.shadow.camera.top = 26;
      moonLight.shadow.camera.bottom = -26;
      moonLight.shadow.bias = -0.0004;
    }
    scene.add(moonLight);

    // Warm Lake Pier Lantern Light
    const pierLight = new THREE.PointLight(0xfef08a, 2.0, 14);
    pierLight.position.set(0, 2.5, -4);
    scene.add(pierLight);

    // 6. Instantiate 3D Environment
    const worldEnv = new WorldEnvironment(scene, isSoftwareGl);
    worldEnvRef.current = worldEnv;
    setAllZones(worldEnv.zones);

    // 7. Instantiate Main Player Avatar
    const avatar = new Avatar3D({
      robeColor: robeColor,
      auraColor: 0xfbbf24,
      accessory: 'lantern',
    });
    // Start at comfortable central crossroad facing the lake
    avatar.position.set(0, 0, 1.5);
    scene.add(avatar.group);
    avatarRef.current = avatar;

    // 8. Add Click-to-Move Ripple Ring Marker
    const ringGeo = new THREE.RingGeometry(0.25, 0.45, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const clickMarker = new THREE.Mesh(ringGeo, ringMat);
    clickMarker.rotation.x = -Math.PI / 2;
    clickMarker.position.y = 0.04;
    clickMarker.visible = false;
    scene.add(clickMarker);
    clickMarkerMeshRef.current = clickMarker;

    // 9. Ambient Soul Wanderers
    const soulGroups: THREE.Group[] = [];
    AMBIENT_SOULS.forEach((soul) => {
      const soulAvatar = new Avatar3D({
        robeColor: 0x4f46e5,
        auraColor: 0x67e8f9,
        accessory: 'none',
      });
      soulAvatar.position.set(soul.x, 0, soul.z);
      soulAvatar.rotationTarget = Math.random() * Math.PI * 2;
      soulAvatar.group.userData = { isSoul: true, soulData: soul };
      scene.add(soulAvatar.group);
      soulGroups.push(soulAvatar.group);
    });

    // 10. Input Handlers: Keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardKeysRef.current[e.key.toLowerCase()] = true;
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        // Trigger interaction with active nearby zone
        if (currentZone) {
          e.preventDefault();
          handleInteractZone(currentZone);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyboardKeysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 11. Input Handlers: Pointer Click to Move & Raycasting
    const handlePointerDown = (e: PointerEvent) => {
      if (!renderer.domElement) return;
      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_pointer, camera);

      // Check click on ambient souls first
      const soulIntersects = _raycaster.intersectObjects(soulGroups, true);
      if (soulIntersects.length > 0) {
        let hitObject: THREE.Object3D | null = soulIntersects[0].object;
        while (hitObject && !hitObject.userData?.isSoul && hitObject.parent) {
          hitObject = hitObject.parent;
        }
        if (hitObject?.userData?.soulData) {
          setActiveWhisper(hitObject.userData.soulData);
          return;
        }
      }

      // Check click on ground terrain
      const intersects = _raycaster.intersectObjects(scene.children, true);
      for (const hit of intersects) {
        // Avoid clicking sky or water center
        if (hit.point.y >= -0.2 && hit.point.y <= 1.5) {
          const resolved = worldEnv.resolveCollision(hit.point.x, hit.point.z);
          clickTargetRef.current = new THREE.Vector3(resolved.x, 0, resolved.z);
          clickMarker.position.set(resolved.x, 0.04, resolved.z);
          clickMarker.visible = true;
          break;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 12. Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || 580;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // 13. Software WebGL Pacing Helper
    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          animFrameIdRef.current = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          animFrameIdRef.current = window.setTimeout(cb, 60);
        }
      };
      animFrameIdRef.current = window.setTimeout(poll, 5);
    }

    // 14. Main Animation Loop
    let nearestZoneTracker: WorldZone | null = null;

    const renderLoop = () => {
      const delta = Math.min(0.08, clockRef.current.getDelta());
      const time = clockRef.current.getElapsedTime();

      // Update world environment animations (lanterns bobbing, fireflies)
      worldEnv.update(time);

      // Animate click marker ripple
      if (clickMarker.visible) {
        const markerScale = 1 + Math.sin(time * 6) * 0.15;
        clickMarker.scale.set(markerScale, markerScale, markerScale);
      }

      // Process Player Movement
      const keys = keyboardKeysRef.current;
      const joy = joystickVectorRef.current;

      _moveDir.set(0, 0, 0);

      // Keyboard input
      if (keys['w'] || keys['arrowup']) _moveDir.z -= 1;
      if (keys['s'] || keys['arrowdown']) _moveDir.z += 1;
      if (keys['a'] || keys['arrowleft']) _moveDir.x -= 1;
      if (keys['d'] || keys['arrowright']) _moveDir.x += 1;

      // Joystick input overrides/combines
      if (Math.abs(joy.dx) > 0.05 || Math.abs(joy.dy) > 0.05) {
        _moveDir.x += joy.dx;
        _moveDir.z += joy.dy;
        // Joystick interrupts click-to-move
        clickTargetRef.current = null;
        if (clickMarker.visible) clickMarker.visible = false;
      }

      if (_moveDir.lengthSq() > 0.001) {
        // Player is actively using manual movement
        clickTargetRef.current = null;
        if (clickMarker.visible) clickMarker.visible = false;

        _moveDir.normalize();
        const targetAngle = Math.atan2(_moveDir.x, _moveDir.z);
        avatar.rotationTarget = targetAngle;
        avatar.isMoving = true;

        const nextX = avatar.position.x + _moveDir.x * avatar.speed * delta;
        const nextZ = avatar.position.z + _moveDir.z * avatar.speed * delta;
        const resolved = worldEnv.resolveCollision(nextX, nextZ);

        avatar.position.x = resolved.x;
        avatar.position.z = resolved.z;
      } else if (clickTargetRef.current) {
        // Player is walking toward clicked destination
        const dx = clickTargetRef.current.x - avatar.position.x;
        const dz = clickTargetRef.current.z - avatar.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.25) {
          avatar.isMoving = true;
          const targetAngle = Math.atan2(dx, dz);
          avatar.rotationTarget = targetAngle;

          const moveStep = Math.min(dist, avatar.speed * delta);
          const nextX = avatar.position.x + (dx / dist) * moveStep;
          const nextZ = avatar.position.z + (dz / dist) * moveStep;
          const resolved = worldEnv.resolveCollision(nextX, nextZ);

          avatar.position.x = resolved.x;
          avatar.position.z = resolved.z;
        } else {
          // Arrived
          avatar.isMoving = false;
          clickTargetRef.current = null;
          clickMarker.visible = false;
        }
      } else {
        avatar.isMoving = false;
      }

      avatar.update(delta, time);

      // Camera Following & Modes
      if (cameraMode === 'follow') {
        _targetCameraPos.set(
          avatar.position.x,
          avatar.position.y + 4.2,
          avatar.position.z + 6.8
        );
        camera.position.lerp(_targetCameraPos, delta * 4.5);
        _vec3.set(avatar.position.x, avatar.position.y + 1.2, avatar.position.z);
        camera.lookAt(_vec3);
      } else if (cameraMode === 'isometric') {
        _targetCameraPos.set(
          avatar.position.x + 8.5,
          avatar.position.y + 12.0,
          avatar.position.z + 10.5
        );
        camera.position.lerp(_targetCameraPos, delta * 3.5);
        _vec3.set(avatar.position.x, avatar.position.y + 0.8, avatar.position.z);
        camera.lookAt(_vec3);
      } else {
        // Cinematic slow circular glide
        _targetCameraPos.set(
          Math.sin(time * 0.12) * 14,
          7.5,
          Math.cos(time * 0.12) * 14
        );
        camera.position.lerp(_targetCameraPos, delta * 2.0);
        _vec3.set(0, 1.2, 0);
        camera.lookAt(_vec3);
      }

      // Check Proximity to All Zones
      let detectedZone: WorldZone | null = null;
      let minZoneDist = Infinity;

      for (const zone of worldEnv.zones) {
        const dx = avatar.position.x - zone.position.x;
        const dz = avatar.position.z - zone.position.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < zone.radius && d < minZoneDist) {
          detectedZone = zone;
          minZoneDist = d;
        }
      }

      if (detectedZone?.id !== nearestZoneTracker?.id) {
        nearestZoneTracker = detectedZone;
        setCurrentZone(detectedZone);
      }

      // Render frame
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(renderLoop);
      } else {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
      }
    };

    renderLoop();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      }
      cancelAnimationFrame(animFrameIdRef.current);
      clearTimeout(animFrameIdRef.current);
      renderer.dispose();
      scene.clear();
    };
  }, [cameraMode, handleInteractZone, robeColor]);

  // Handle mobile joystick input from WorldHUD
  const handleJoystickMove = (dx: number, dy: number) => {
    joystickVectorRef.current = { dx, dy };
  };

  const handleJoystickEnd = () => {
    joystickVectorRef.current = { dx: 0, dy: 0 };
  };

  return (
    <div className="relative w-full h-[580px] sm:h-[680px] rounded-3xl overflow-hidden shadow-2xl border border-purple-500/30 bg-[#070815] select-none touch-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* World Interactive HUD Overlay */}
      <WorldHUD
        currentZone={currentZone}
        allZones={allZones}
        onInteractZone={handleInteractZone}
        onTeleportToZone={handleTeleportToZone}
        robeColor={robeColor}
        onUpdateRobeColor={handleUpdateRobeColor}
        cameraMode={cameraMode}
        onChangeCameraMode={setCameraMode}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode(!isZenMode)}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
        onJoystickMove={handleJoystickMove}
        onJoystickEnd={handleJoystickEnd}
      />

      {/* Ambient Soul Whisper Dialogue Box */}
      {activeWhisper && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md animate-fade-in">
          <div className="p-4 rounded-2xl bg-[#12132e]/95 border border-purple-400/50 shadow-2xl backdrop-blur-xl text-white space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-purple-800/40">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-cyan-300" />
                <span className="text-xs font-bold text-amber-200">
                  {activeWhisper.name}
                </span>
                <span className="text-[10px] text-purple-300/60">
                  • {activeWhisper.avatarRole}
                </span>
              </div>
              <button
                onClick={() => setActiveWhisper(null)}
                className="p-1 text-purple-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-purple-100 italic leading-relaxed font-serif-healing">
              "{activeWhisper.quote}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
