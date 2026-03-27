// --- Title Background (Three.js 3D) ---
const _tbCvs = document.getElementById('title-bg-canvas');
let _tbRunning = true;

// Renderer
const _tbRdr = new THREE.WebGLRenderer({ canvas: _tbCvs, antialias: true });
_tbRdr.setSize(window.innerWidth, window.innerHeight);
_tbRdr.setPixelRatio(Math.min(window.devicePixelRatio, 2));
_tbRdr.setClearColor(0x050510, 1);

// Scene & Camera
const _tbScene = new THREE.Scene();
_tbScene.fog = new THREE.FogExp2(0x050510, 0.012);
const _tbCam = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
_tbCam.position.set(0, 12, 40);
_tbCam.lookAt(0, 5, 0);

// Post-processing (Bloom)
const _tbComposer = new THREE.EffectComposer(_tbRdr);
_tbComposer.addPass(new THREE.RenderPass(_tbScene, _tbCam));
_tbComposer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.8, 0.6, 0.15));

// Lighting
_tbScene.add(new THREE.AmbientLight(0xffffff, 0.2));
const _tbHemi = new THREE.HemisphereLight(0x0f0520, 0xd946ef, 0.4);
_tbScene.add(_tbHemi);

// Resize
window.addEventListener('resize', () => {
    if (!_tbRunning) return;
    _tbCam.aspect = window.innerWidth / window.innerHeight;
    _tbCam.updateProjectionMatrix();
    _tbRdr.setSize(window.innerWidth, window.innerHeight);
    _tbComposer.setSize(window.innerWidth, window.innerHeight);
});

// --- Floating 3D Shapes ---
const _tbGeos = [
    new THREE.OctahedronGeometry(1.5, 0),
    new THREE.TorusGeometry(1.2, 0.3, 8, 16),
    new THREE.IcosahedronGeometry(1.5, 0),
    new THREE.TetrahedronGeometry(1.5, 0),
    new THREE.DodecahedronGeometry(1.2, 0),
];
const _tbColors = [0xd946ef, 0x22d3ee, 0xa855f7, 0xd946ef, 0x22d3ee];
const _tbShapes = [];

for (let i = 0; i < 30; i++) {
    const geoIdx = Math.floor(Math.random() * _tbGeos.length);
    const color = _tbColors[geoIdx];
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.2 + Math.random() * 0.25 });
    const mesh = new THREE.Mesh(_tbGeos[geoIdx], mat);
    const scale = 0.5 + Math.random() * 1.5;
    mesh.scale.setScalar(scale);
    mesh.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 30 + 3,
        (Math.random() - 0.5) * 100
    );
    _tbScene.add(mesh);
    _tbShapes.push({
        mesh,
        rX: (Math.random() - 0.5) * 0.5,
        rY: (Math.random() - 0.5) * 0.5,
        rZ: (Math.random() - 0.5) * 0.3,
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 0.5) * 0.015,
    });
}

// --- 3D City Silhouette ---
const _tbBldgMat = new THREE.MeshStandardMaterial({ color: 0x08081a, emissive: 0x08081a, emissiveIntensity: 0.05, roughness: 0.9, metalness: 0.3 });
const _tbBldgEdgeMat = new THREE.LineBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.15 });
const _tbBldgTopMat = new THREE.LineBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.4 });

for (let i = 0; i < 40; i++) {
    const w = 2 + Math.random() * 4;
    const h = 5 + Math.random() * 20;
    const d = 2 + Math.random() * 4;
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, _tbBldgMat);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), _tbBldgEdgeMat);
    mesh.add(edge);
    const x = (i - 20) * 3.5 + (Math.random() - 0.5) * 2;
    mesh.position.set(x, h / 2, -20 + Math.random() * 10);
    _tbScene.add(mesh);
}
// Far layer
for (let i = 0; i < 30; i++) {
    const w = 3 + Math.random() * 5;
    const h = 3 + Math.random() * 12;
    const d = 3 + Math.random() * 5;
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, _tbBldgMat);
    const x = (i - 15) * 5 + (Math.random() - 0.5) * 3;
    mesh.position.set(x, h / 2, -35 + Math.random() * 5);
    _tbScene.add(mesh);
}

// --- Floor grid ---
const _tbFloorMat = new THREE.MeshBasicMaterial({ color: 0xd946ef, wireframe: true, transparent: true, opacity: 0.04 });
const _tbFloor = new THREE.Mesh(new THREE.PlaneGeometry(200, 100, 40, 20), _tbFloorMat);
_tbFloor.rotation.x = -Math.PI / 2;
_tbFloor.position.set(0, 0, -20);
_tbScene.add(_tbFloor);

// --- Animate ---
let _tbTime = 0;
function _tbAnimate() {
    if (!_tbRunning) return;
    requestAnimationFrame(_tbAnimate);
    _tbTime += 0.016;

    // Rotate shapes
    for (const s of _tbShapes) {
        s.mesh.rotation.x += s.rX * 0.016;
        s.mesh.rotation.y += s.rY * 0.016;
        s.mesh.rotation.z += s.rZ * 0.016;
        s.mesh.position.x += s.vx;
        s.mesh.position.y += s.vy;
        // Wrap
        if (s.mesh.position.x > 45) s.mesh.position.x = -45;
        if (s.mesh.position.x < -45) s.mesh.position.x = 45;
        if (s.mesh.position.y > 35) s.mesh.position.y = 3;
        if (s.mesh.position.y < 2) s.mesh.position.y = 35;
    }

    // Slow camera sway
    _tbCam.position.x = Math.sin(_tbTime * 0.15) * 3;
    _tbCam.position.y = 12 + Math.sin(_tbTime * 0.1) * 1.5;
    _tbCam.lookAt(0, 5, 0);

    _tbComposer.render();
}
_tbAnimate();

function stopTitleBg() {
    _tbRunning = false;
    _tbCvs.style.display = 'none';
}

function showTitleBg() {
    _tbCvs.style.display = 'block';
    if (!_tbRunning) {
        _tbRunning = true;
        _tbAnimate();
    }
}
