import * as THREE from 'three';
import './style.css';

const mount = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101d32);
scene.fog = new THREE.FogExp2(0x101b2c, 0.0034);
const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.1, 650);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x8dbbdf, 0x14202d, 1.65));
const moon = new THREE.DirectionalLight(0x9ccaff, 2.45);
moon.position.set(-80, 130, 45);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.left = -100; moon.shadow.camera.right = 100;
moon.shadow.camera.top = 100; moon.shadow.camera.bottom = -100;
moon.shadow.bias = -0.0005;
scene.add(moon);
const cityGlow = new THREE.PointLight(0x228dff, 110, 180, 2);
cityGlow.position.set(-30, 30, -30); scene.add(cityGlow);
const warmGlow = new THREE.PointLight(0xff6a45, 70, 120, 2);
warmGlow.position.set(72, 22, 38); scene.add(warmGlow);

const mat = (color, roughness = .78, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const groundMat = mat(0x101a24, .98);
const roadMat = mat(0x111b25, .92);
const sidewalkMat = mat(0x283441, .9);
const whiteLineMat = mat(0x9cabb4, .75, { emissive: 0x101820 });
const towerPalette = [0x303b4b,0x354352,0x303a49,0x3c4653,0x293848,0x3d414c,0x344656,0x394252];
const windowGeometry = new THREE.BoxGeometry(1, 1, .07);
const windowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.65, roughness: .34 });
const windows = new THREE.InstancedMesh(windowGeometry, windowMaterial, 12500);
windows.instanceMatrix.setUsage(THREE.StaticDrawUsage);
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
let windowCount = 0;
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const buildings = [];
const anchors = [];
const random = (() => { let seed = 79821; return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; })();

function addBox(parent, geometry, material, position, scale, cast = false, receive = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position); mesh.scale.set(...scale);
  mesh.castShadow = cast; mesh.receiveShadow = receive; parent.add(mesh); return mesh;
}
function addWindow(x, y, z, width, height, rotation = 0) {
  if (windowCount >= windows.count) return;
  tempObject.position.set(x, y, z); tempObject.rotation.set(0, rotation, 0); tempObject.scale.set(width, height, 1);
  tempObject.updateMatrix(); windows.setMatrixAt(windowCount, tempObject.matrix);
  const palette = [0xffc777,0x80dfff,0x9bd6ff,0xffdca2,0x608dc5];
  tempColor.setHex(palette[Math.floor(random() * palette.length)]);
  if (random() < .28) tempColor.setHex(0x28394b);
  windows.setColorAt(windowCount, tempColor); windowCount++;
}

// A deep blue city floor, lit avenues, sidewalks and hundreds of repeated lit windows.
addBox(scene, boxGeometry, groundMat, [0, -1.4, 0], [270, 1, 270]);
for (let i = -5; i <= 5; i++) {
  const lane = i * 26;
  addBox(scene, boxGeometry, roadMat, [lane, -.86, 0], [7.6, .08, 270]);
  addBox(scene, boxGeometry, roadMat, [0, -.86, lane], [270, .08, 7.6]);
  for (let d = -125; d < 130; d += 11) {
    addBox(scene, boxGeometry, whiteLineMat, [lane, -.80, d], [.11, .018, 3.2]);
    addBox(scene, boxGeometry, whiteLineMat, [d, -.80, lane], [3.2, .018, .11]);
  }
  addBox(scene, boxGeometry, sidewalkMat, [lane - 5, -.72, 0], [2, .28, 270]);
  addBox(scene, boxGeometry, sidewalkMat, [lane + 5, -.72, 0], [2, .28, 270]);
  addBox(scene, boxGeometry, sidewalkMat, [0, -.72, lane - 5], [270, .28, 2]);
  addBox(scene, boxGeometry, sidewalkMat, [0, -.72, lane + 5], [270, .28, 2]);
}

const buildingMaterialCache = towerPalette.map(c => mat(c, .72, { metalness: .12 }));
for (let ix = -4; ix <= 4; ix++) for (let iz = -4; iz <= 4; iz++) {
  if (random() < .13) continue;
  const x = ix * 26 + (random() - .5) * 2.2;
  const z = iz * 26 + (random() - .5) * 2.2;
  const w = 12 + random() * 7, d = 12 + random() * 7;
  const floors = 8 + Math.floor(random() * 18);
  const h = floors * (2.5 + random() * .28) + 2;
  const base = random() * 1.2;
  const body = new THREE.Mesh(boxGeometry, buildingMaterialCache[Math.floor(random() * buildingMaterialCache.length)]);
  body.position.set(x, base + h / 2, z); body.scale.set(w, h, d); body.castShadow = true; body.receiveShadow = true; scene.add(body);
  buildings.push({ x, z, w, d, h: h + base });
  // Recessed-looking vertical bays and warm horizontal floor bands.
  const colsFront = Math.floor(w / 2.05), rows = Math.floor(h / 2.45);
  for (let row = 0; row < rows; row++) for (let col = 0; col < colsFront; col++) {
    if (random() < .17) continue;
    const wx = x - w / 2 + 1.35 + col * ((w - 2.1) / Math.max(colsFront - 1, 1));
    const wy = base + 1.55 + row * 2.42;
    const wz = z - d / 2 - .045;
    addWindow(wx, wy, wz, .78, 1.15, 0);
    if (random() < .8) addWindow(wx, wy, z + d / 2 + .045, .78, 1.15, Math.PI);
  }
  const colsSide = Math.floor(d / 2.1);
  for (let row = 0; row < rows; row++) for (let col = 0; col < colsSide; col++) {
    if (random() < .23) continue;
    const wz = z - d / 2 + 1.3 + col * ((d - 2.1) / Math.max(colsSide - 1, 1));
    const wy = base + 1.55 + row * 2.42;
    addWindow(x + w / 2 + .045, wy, wz, .78, 1.15, Math.PI / 2);
    if (random() < .72) addWindow(x - w / 2 - .045, wy, wz, .78, 1.15, -Math.PI / 2);
  }
  const roof = mat(0x273342, .88);
  addBox(scene, boxGeometry, roof, [x, base + h + .55, z], [w * .89, 1.1, d * .89], false);
  // Rooftop plant room, antenna and a red aircraft-warning beacon.
  if (random() > .25) {
    const rw = w * (.28 + random() * .18), rd = d * (.3 + random() * .18);
    addBox(scene, boxGeometry, buildingMaterialCache[Math.floor(random() * buildingMaterialCache.length)], [x + w * .18, base + h + 2.2, z - d * .1], [rw, 2.6, rd], true);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.035, .09, 3.8, 6), mat(0x8293a5, .4, { metalness: .5 }));
    antenna.position.set(x - w * .27, base + h + 2.4, z + d * .18); scene.add(antenna);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff5264 }));
    beacon.position.set(x - w * .27, base + h + 4.35, z + d * .18); scene.add(beacon);
  }
  // Safe grapple points on corners and roof edges.
  anchors.push(new THREE.Vector3(x - w * .42, base + h + 2, z - d * .42));
  anchors.push(new THREE.Vector3(x + w * .38, base + h + 2, z - d * .38));
  anchors.push(new THREE.Vector3(x - w * .35, base + h + 2, z + d * .38));
  // A few cyan rooftop accents make the skyline legible at night.
  if (random() > .62) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(w * .35, .22, .15), new THREE.MeshBasicMaterial({ color: 0x49dfff }));
    sign.position.set(x, base + h * .72, z - d / 2 - .08); scene.add(sign);
  }
}
windows.count = windowCount;
windows.instanceMatrix.needsUpdate = true;
if (windows.instanceColor) windows.instanceColor.needsUpdate = true;
scene.add(windows);

// Distant silhouette to make the playable neighborhood feel like a larger Manhattan.
const farMat = mat(0x26374a, .95);
for (let i = 0; i < 50; i++) {
  const a = i / 50 * Math.PI * 2, radius = 145 + random() * 28;
  const w = 9 + random() * 12, h = 25 + random() * 66;
  addBox(scene, boxGeometry, farMat, [Math.cos(a) * radius, h / 2, Math.sin(a) * radius], [w, h, w], false);
}

// Street lamps mark the avenues with pools of cool light.
const lampMat = new THREE.MeshStandardMaterial({ color: 0xcaf2ff, emissive: 0x65cfff, emissiveIntensity: 3 });
for (let x = -104; x <= 104; x += 52) for (let z = -104; z <= 104; z += 52) {
  if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.055, .09, 5, 6), mat(0x465564, .55, { metalness: .45 }));
  pole.position.set(x + 5.2, 1.8, z + 5.2); scene.add(pole);
  addBox(scene, boxGeometry, lampMat, [x + 5.2, 4.4, z + 5.2], [.9, .12, .32], false);
}
