import * as THREE from 'three';

export interface AvatarOptions {
  robeColor?: number;
  auraColor?: number;
  accessory?: 'lantern' | 'flower' | 'none';
}

export class Avatar3D {
  public group: THREE.Group;
  public bodyGroup: THREE.Group;
  public leftLeg: THREE.Mesh;
  public rightLeg: THREE.Mesh;
  public leftArm: THREE.Mesh;
  public rightArm: THREE.Mesh;
  public headGroup: THREE.Group;
  public scarf?: THREE.Mesh;
  public staffLantern?: THREE.Group;

  public position: THREE.Vector3;
  public targetPosition: THREE.Vector3;
  public isMoving: boolean = false;
  public speed: number = 5.2; // movement speed units per sec
  public rotationTarget: number = 0;

  private walkCycle: number = 0;
  private robeMat: THREE.MeshStandardMaterial;

  constructor(options: AvatarOptions = {}) {
    this.group = new THREE.Group();
    this.position = this.group.position;
    this.targetPosition = new THREE.Vector3();

    const robeColorHex = options.robeColor ?? 0x9333ea; // default purple
    const auraColorHex = options.auraColor ?? 0xfbbf24; // gold

    // 1. Soft contact shadow on ground
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x070814,
      transparent: true,
      opacity: 0.45,
    });
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.group.add(shadow);

    // 2. Animated Body Group
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);

    // Robe material
    this.robeMat = new THREE.MeshStandardMaterial({
      color: robeColorHex,
      roughness: 0.8,
      metalness: 0.05,
    });

    // Body / Gown
    const gown = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.05, 16), this.robeMat);
    gown.position.y = 0.62;
    gown.castShadow = true;
    this.bodyGroup.add(gown);

    // Cloak cape back
    const capeMat = new THREE.MeshStandardMaterial({
      color: robeColorHex,
      roughness: 0.9,
    });
    const cape = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.42, 0.75, 12, 1, false, 0, Math.PI),
      capeMat
    );
    cape.position.set(0, 0.68, -0.06);
    cape.rotation.y = Math.PI / 2;
    this.bodyGroup.add(cape);

    // Legs (for walking stride animation)
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.9 });

    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.14, 0.18, 0);
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.14, 0.18, 0);
    this.group.add(this.rightLeg);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8);
    this.leftArm = new THREE.Mesh(armGeo, this.robeMat);
    this.leftArm.position.set(-0.35, 0.8, 0);
    this.bodyGroup.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, this.robeMat);
    this.rightArm.position.set(0.35, 0.8, 0);
    this.bodyGroup.add(this.rightArm);

    // 3. Head & Hood Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.25;

    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      this.robeMat
    );
    hood.castShadow = true;
    this.headGroup.add(hood);

    // Cute glowing eyes (Warm soothing gaze)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    leftEye.position.set(-0.08, 0.02, 0.24);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    rightEye.position.set(0.08, 0.02, 0.24);
    this.headGroup.add(leftEye);
    this.headGroup.add(rightEye);

    // Cozy Traveler Scarf around collar
    const scarfMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.8,
    });
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.06, 8, 16), scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = -0.15;
    this.headGroup.add(scarf);

    this.bodyGroup.add(this.headGroup);

    // 4. Lantern Staff
    if (options.accessory !== 'none') {
      const staffGroup = new THREE.Group();
      staffGroup.position.set(0.42, 0.65, 0.1);

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 1.35, 8),
        new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 })
      );
      staffGroup.add(pole);

      const lanternBox = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.12, 0),
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.2,
        })
      );
      lanternBox.position.y = 0.65;
      staffGroup.add(lanternBox);

      // Light on staff
      const staffLight = new THREE.PointLight(0xfef08a, 1.4, 4.5);
      staffLight.position.y = 0.68;
      staffGroup.add(staffLight);

      this.staffLantern = staffGroup;
      this.bodyGroup.add(staffGroup);
    }
  }

  public setRobeColor(colorHex: number) {
    this.robeMat.color.setHex(colorHex);
  }

  public update(delta: number, time: number) {
    // Rotation smoothing
    const diffRot = this.rotationTarget - this.group.rotation.y;
    // Normalize angle between -PI and PI
    const normDiff = Math.atan2(Math.sin(diffRot), Math.cos(diffRot));
    this.group.rotation.y += normDiff * Math.min(1, delta * 12);

    if (this.isMoving) {
      this.walkCycle += delta * 10;

      // Leg stride swing
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.55;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.55;

      // Arm counter-swing
      this.leftArm.rotation.x = -Math.sin(this.walkCycle) * 0.45;
      this.rightArm.rotation.x = Math.sin(this.walkCycle) * 0.35;

      // Gentle body bounce
      this.bodyGroup.position.y = Math.abs(Math.sin(this.walkCycle * 2)) * 0.05;
      this.bodyGroup.rotation.z = Math.sin(this.walkCycle) * 0.04;
    } else {
      // Idle breathing animation
      this.walkCycle = 0;
      this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, 0, 8, delta);
      this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, 0, 8, delta);
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, 0, 8, delta);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, 0, 8, delta);

      this.bodyGroup.position.y = Math.sin(time * 2.2) * 0.025;
      this.bodyGroup.rotation.z = 0;
      this.headGroup.rotation.y = Math.sin(time * 0.8) * 0.08;
    }
  }
}
