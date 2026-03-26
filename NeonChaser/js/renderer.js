// --- Three.js Scene Setup ---
const canvas = document.getElementById('game-canvas');
const rdr = new THREE.WebGLRenderer({ canvas, antialias: true });
rdr.setSize(window.innerWidth, window.innerHeight);
rdr.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050510, 0.015);

const cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 400);
cam.position.set(0, 8, 15); cam.lookAt(0, 0, -20); scene.add(cam);

// --- Shockwave Shader ---
const ShockShader = {
    uniforms: {
        tDiffuse: { value: null },
        asp: { value: window.innerWidth / window.innerHeight },
        c: { value: [new THREE.Vector2(-1, -1), new THREE.Vector2(-1, -1), new THREE.Vector2(-1, -1)] },
        t: { value: [0.0, 0.0, 0.0] },
        a: { value: [0, 0, 0] }
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
        uniform sampler2D tDiffuse; uniform float asp; uniform vec2 c[3]; uniform float t[3]; uniform int a[3]; varying vec2 vUv;
        void main() {
            vec2 uv = vUv; vec2 off = vec2(0.0);
            for(int i = 0; i < 3; i++) {
                if(a[i] == 1) {
                    vec2 d = vUv - c[i]; d.x *= asp; float dist = length(d);
                    if (dist > 0.001) {
                        float wave = smoothstep(0.0, 1.0, max(0.0, 1.0 - abs(dist - t[i] * 2.5) / 0.15));
                        off += (d / dist) * wave * max(0.0, 1.0 - (t[i] / 0.6)) * 0.06 / vec2(asp, 1.0);
                    }
                }
            }
            gl_FragColor = texture2D(tDiffuse, clamp(uv - off, 0.0, 1.0));
        }`
};

// --- Post-Processing ---
const rPass = new THREE.RenderPass(scene, cam);
const sPass = new THREE.ShaderPass(ShockShader);
const bPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 2.0, 0.5, 0.1);
const composer = new THREE.EffectComposer(rdr);
composer.addPass(rPass); composer.addPass(sPass); composer.addPass(bPass);

// --- Lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 0.3), new THREE.HemisphereLight(0x0f172a, 0xec4899, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10); scene.add(dirLight);

// --- Floor Shader ---
const floorMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, crv: { value: 0 } },
    vertexShader: `
        uniform float crv; varying vec2 vUv; varying vec3 vPos;
        void main() { vUv = uv; vec3 p = position; p.x += crv * p.z * p.z; vPos = p; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `
        uniform float time; varying vec2 vUv; varying vec3 vPos;
        void main() {
            vec2 uv = vUv * vec2(30.0, 120.0); uv.y -= time * 4.0; vec2 g = abs(fract(uv - 0.5) - 0.5);
            float glow = max(smoothstep(0.06, 0.0, g.x), smoothstep(0.06, 0.0, g.y));
            float road = smoothstep(16.5, 16.0, abs((vUv.x - 0.5) * 300.0));
            vec3 baseCol = mix(vec3(0.0, 0.1, 0.3), vec3(0.0, 0.4, 0.8), road);
            gl_FragColor = vec4(baseCol * glow * 0.5 * smoothstep(-350.0, -20.0, vPos.z), 1.0);
        }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
});
const floorGeo = new THREE.PlaneGeometry(300, 600, 30, 100);
floorGeo.rotateX(-PI / 2).translate(0, 0, -200);
scene.add(new THREE.Mesh(floorGeo, floorMat));

// --- Materials ---
const MkMat = (c, e, i, r = 0.3, m = 0.5) =>
    new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: i, roughness: r, metalness: m });

const matTire = MkMat(0x111111, 0, 0, 0.9, 0.1);
const matPlayerBody = MkMat(0x38bdf8, 0x0284c7, 0.6);
const matPlayerNeon = MkMat(0x00ffff, 0x00ffff, 2.0);
const matEnemyBreak = MkMat(0x064e3b, 0x022c22, 0.5);
const matEnemyNeonB = MkMat(0x10b981, 0x059669, 1.0);
const matEnemyUnbreak = MkMat(0xbe123c, 0x9f1239, 0.8);
const matEnemyNeonU = MkMat(0xff0055, 0xe11d48, 2.0);
const matEnemyKnock = MkMat(0x94a3b8, 0x334155, 0.5, 0.5, 0.5);
const matEnemyNeonK = MkMat(0x1e293b, 0x1e293b, 1.0);
const matZigzagBody = MkMat(0xd97706, 0x92400e, 0.6);
const matZigzagNeon = MkMat(0xfbbf24, 0xfbbf24, 2.0);
const matDash = MkMat(0x00ffff, 0x00ffff, 2.0);
const matHeart = MkMat(0xfca5a5, 0xff0055, 2.0);
const matJump = MkMat(0x34d399, 0x059669, 1.0);
const matPil = MkMat(0x8b5cf6, 0xa855f7, 1.5);
const matBullet = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
const geoBullet = new THREE.SphereGeometry(0.2, 6, 6);

// --- Geometries ---
const _applyGeo = (g, func) => { func(g); return g; };

const geoTire = _applyGeo(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 12), g => g.rotateZ(PI / 2));
const geoRim = _applyGeo(new THREE.CylinderGeometry(0.45, 0.45, 0.32, 12), g => g.rotateZ(PI / 2));
const geoBody = _applyGeo(new THREE.ConeGeometry(0.4, 3.5, 3), g => g.rotateX(-PI / 2).rotateZ(PI / 2));
const geoRBody = _applyGeo(new THREE.ConeGeometry(0.8, 3.5, 5), g => g.rotateX(-PI / 2));
const geoROrb = new THREE.SphereGeometry(0.3, 8, 8);

const shapeDash = new THREE.Shape();
[[0, 2], [2, -2], [1, -2], [0, 0], [-1, -2], [-2, -2], [0, 2]].forEach((p, i) => i ? shapeDash.lineTo(p[0], p[1]) : shapeDash.moveTo(p[0], p[1]));
const geoDash = _applyGeo(new THREE.ExtrudeGeometry(shapeDash, { depth: 0.2, bevelEnabled: false }), g => g.rotateX(-PI / 2).translate(0, 0.1, 0).scale(1.5, 1.5, 1.5));

const shapeHeart = new THREE.Shape();
shapeHeart.moveTo(0, 1.5); shapeHeart.bezierCurveTo(2, 3.5, 4, 1.5, 0, -3); shapeHeart.bezierCurveTo(-4, 1.5, -2, 3.5, 0, 1.5);
const geoHeart = _applyGeo(new THREE.ExtrudeGeometry(shapeHeart, { depth: 0.5, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.2, bevelThickness: 0.2 }), g => g.translate(0, 0, -0.25).scale(0.5, 0.5, 0.5));

const geoJump = new THREE.BoxGeometry(4, 0.5, 4);

const geoWarn = _applyGeo(new THREE.PlaneGeometry(16, 300, 1, 50), g => g.rotateX(-PI / 2).translate(0, 0, -150));
const matWarnBase = new THREE.ShaderMaterial({
    uniforms: { crv: { value: 0 }, op: { value: 0.3 } },
    vertexShader: `uniform float crv; varying vec2 vUv; void main(){vUv=uv; vec3 p=position; p.x+=crv*p.z*p.z; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader: `uniform float op; varying vec2 vUv; void main(){ float edge = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x); gl_FragColor = vec4(1.0, 0.0, 0.0, op * edge); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
});

// --- Mesh Factories ---
function createBike(bodyMat, neonMat) {
    const grp = new THREE.Group();
    const makeTire = z => {
        const g = new THREE.Group();
        // Wireframe only — edge lines for tire shape
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(geoTire), neonMat);
        g.add(e); g.position.set(0, 0.55, z); return g;
    };
    const fTire = makeTire(-1.3), rTire = makeTire(1.3);
    const nl = new THREE.LineSegments(new THREE.EdgesGeometry(geoBody), neonMat);
    nl.position.set(0, 0.9, 0);
    grp.add(fTire, rTire, nl);
    grp.userData = {
        tires: [fTire, rTire],
        changeMat: (b, n) => { nl.material = n; fTire.children[0].material = n; rTire.children[0].material = n; }
    };
    return grp;
}

function createRocket(bodyMat, neonMat) {
    const grp = new THREE.Group();
    const bd = new THREE.Mesh(geoRBody, bodyMat);
    const nl = new THREE.LineSegments(new THREE.EdgesGeometry(geoRBody), neonMat);
    grp.add(bd, nl);
    const orbs = new THREE.Group(); const oMats = [];
    for (let i = 0; i < 3; i++) {
        const orb = new THREE.Mesh(geoROrb, neonMat);
        const a = (i / 3) * PI * 2; orb.position.set(Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0);
        orbs.add(orb); oMats.push(orb);
    }
    grp.add(orbs);
    grp.userData = { orbs, changeMat: (b, n) => { bd.material = b; nl.material = n; oMats.forEach(o => o.material = n); } };
    return grp;
}

// --- Zigzag Enemy Mesh ---
const geoZBar1 = new THREE.BoxGeometry(0.3, 0.3, 3.0);
const geoZBar2 = new THREE.BoxGeometry(3.0, 0.3, 0.3);
const geoZCore = new THREE.SphereGeometry(0.4, 8, 8);

function createZigzagMesh(bodyMat, neonMat) {
    const grp = new THREE.Group();
    const bar1 = new THREE.Mesh(geoZBar1, bodyMat);
    const bar2 = new THREE.Mesh(geoZBar2, bodyMat);
    const core = new THREE.Mesh(geoZCore, neonMat);
    const edge1 = new THREE.LineSegments(new THREE.EdgesGeometry(geoZBar1), neonMat);
    const edge2 = new THREE.LineSegments(new THREE.EdgesGeometry(geoZBar2), neonMat);
    const edgeC = new THREE.LineSegments(new THREE.EdgesGeometry(geoZCore), neonMat);
    bar1.position.y = 1; bar2.position.y = 1; core.position.y = 1;
    edge1.position.y = 1; edge2.position.y = 1; edgeC.position.y = 1;
    grp.add(bar1, bar2, core, edge1, edge2, edgeC);
    grp.userData = {
        changeMat: (b, n) => {
            bar1.material = b; bar2.material = b; core.material = n;
            edge1.material = n; edge2.material = n; edgeC.material = n;
        }
    };
    return grp;
}

// --- Enemy Type Meshes ---
const geoDrone = new THREE.IcosahedronGeometry(0.6, 0);
const geoShard = new THREE.OctahedronGeometry(1.0, 0);
const geoSentRing = new THREE.TorusGeometry(0.9, 0.25, 8, 16);
const geoSentCore = new THREE.SphereGeometry(0.4, 8, 8);

function createDroneMesh(bodyMat, neonMat) {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(geoDrone, bodyMat);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geoDrone), neonMat);
    body.position.y = 1; edge.position.y = 1;
    grp.add(body, edge);
    grp.userData = {
        changeMat: (b, n) => { body.material = b; edge.material = n; }
    };
    return grp;
}

function createShardMesh(bodyMat, neonMat) {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(geoShard, bodyMat);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geoShard), neonMat);
    body.position.y = 1; edge.position.y = 1;
    grp.add(body, edge);
    grp.userData = {
        changeMat: (b, n) => { body.material = b; edge.material = n; }
    };
    return grp;
}

function createSentinelMesh(bodyMat, neonMat) {
    const grp = new THREE.Group();
    const ring = new THREE.Mesh(geoSentRing, bodyMat);
    const ringEdge = new THREE.LineSegments(new THREE.EdgesGeometry(geoSentRing), neonMat);
    const core = new THREE.Mesh(geoSentCore, neonMat);
    const coreEdge = new THREE.LineSegments(new THREE.EdgesGeometry(geoSentCore), neonMat);
    ring.position.y = 1.5; ringEdge.position.y = 1.5;
    core.position.y = 1.5; coreEdge.position.y = 1.5;
    grp.add(ring, ringEdge, core, coreEdge);
    grp.userData = {
        changeMat: (b, n) => { ring.material = b; ringEdge.material = n; core.material = n; coreEdge.material = n; }
    };
    return grp;
}

// --- Trail Particle Pool ---
const TRAIL_POOL_SIZE = 100;
const _trailGeos = {
    sphere: new THREE.SphereGeometry(0.1, 4, 4),
    cube:   new THREE.BoxGeometry(0.15, 0.15, 0.15),
    plane:  new THREE.PlaneGeometry(0.25, 0.25),
    ring:   new THREE.TorusGeometry(0.1, 0.03, 4, 6),
};
const trailPool = [];
let _trailCfg = { size: 1, life: 0.5, count: 1, spread: 0.3, animated: false };

function initTrailPool(trailDef) {
    trailPool.forEach(p => scene.remove(p.mesh));
    trailPool.length = 0;
    if (!trailDef || !trailDef.color) { _trailCfg = { size: 1, life: 0.5, count: 1, spread: 0.3, animated: false }; return; }
    _trailCfg = { size: trailDef.size || 1, life: trailDef.life || 0.5, count: trailDef.count || 1, spread: trailDef.spread || 0.3, animated: !!trailDef.animated };
    const geo = _trailGeos[trailDef.geoType] || _trailGeos.sphere;
    const mat = new THREE.MeshBasicMaterial({ color: trailDef.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
        const mesh = new THREE.Mesh(geo, mat.clone());
        mesh.visible = false;
        scene.add(mesh);
        trailPool.push({ mesh, life: 0, maxLife: _trailCfg.life });
    }
}

// --- Player ---
const playerMesh = createBike(matPlayerBody, matPlayerNeon);
playerMesh.scale.setScalar(1.5); scene.add(playerMesh);
const playerBox = new THREE.Box3();

// --- Road Pillars ---
const geoPil = new THREE.BoxGeometry(0.5, 3, 0.5);
for (let i = 0; i < 40; i++) {
    const l = new THREE.Mesh(geoPil, matPil), r = new THREE.Mesh(geoPil, matPil), z = 10 - i * 5.5;
    scene.add(l, r); game.road.push({ L: l, R: r, z });
}

// --- Background Objects ---
const pGeos = [new THREE.OctahedronGeometry(2, 0), new THREE.TorusGeometry(1.5, 0.3, 8, 16), new THREE.IcosahedronGeometry(2, 0)];
const pMats = [0x38bdf8, 0xf43f5e, 0xa855f7].map(c => new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: 0.4 }));
for (let i = 0; i < 50; i++) {
    const p = new THREE.Mesh(pGeos[floor(R() * pGeos.length)], pMats[floor(R() * pMats.length)]);
    p.position.set(R_Sign() * 60, R() * 40 + 5, R_Sign() * 150 - 50);
    p.userData = { rX: R_Sign(), rY: R_Sign(), rZ: R_Sign() };
    scene.add(p); game.pts.push(p);
}

// --- Preview Renderer (Customize Screen) ---
let _pvRdr = null, _pvScene = null, _pvCam = null, _pvBike = null, _pvRunning = false, _pvRafId = null;

function _initPreview() {
    const c = el('preview-canvas');
    if (!c || _pvRdr) return;
    _pvRdr = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: false });
    _pvRdr.setClearColor(0x0a0a14, 1);
    _pvRdr.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    _pvRdr.setSize(c.clientWidth, c.clientHeight);

    _pvScene = new THREE.Scene();
    _pvCam = new THREE.PerspectiveCamera(50, c.clientWidth / c.clientHeight, 0.1, 100);
    _pvCam.position.set(3, 4, 5);
    _pvCam.lookAt(0, 1, 0);

    _pvScene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(5, 10, 5);
    _pvScene.add(dl);
}

function _createPreviewBike() {
    if (_pvBike) _pvScene.remove(_pvBike);
    const eq = getEquipped();
    const col = getColorDef(eq.colorId);
    const bodyMat = MkMat(col.body, col.emit, 0.6);
    const neonMat = MkMat(col.neon, col.nEmit, 2.0);
    _pvBike = createBike(bodyMat, neonMat);
    _pvBike.scale.setScalar(1.5);

    // Apply tire customization
    const tireDef = getTireDef(eq.tireId);
    const tGeo = tireDef.geo();
    _pvBike.userData.tires.forEach(tg => {
        tg.children[0].geometry = new THREE.EdgesGeometry(tGeo);
    });

    // Apply body customization
    const bodyDef = getBodyDef(eq.bodyId);
    const bl = _pvBike.children[2];
    if (bl) bl.geometry = new THREE.EdgesGeometry(bodyDef.geo());

    _pvScene.add(_pvBike);
}

function updatePreviewBike(colorId, tireId, bodyId) {
    if (!_pvBike || !_pvScene) return;
    const col = getColorDef(colorId);
    const bodyMat = MkMat(col.body, col.emit, 0.6);
    const neonMat = MkMat(col.neon, col.nEmit, 2.0);
    _pvBike.userData.changeMat(bodyMat, neonMat);

    const tireDef = getTireDef(tireId);
    const tGeo = tireDef.geo();
    _pvBike.userData.tires.forEach(tg => {
        tg.children[0].geometry = new THREE.EdgesGeometry(tGeo);
    });

    const bodyDef = getBodyDef(bodyId);
    const bl = _pvBike.children[2];
    if (bl) bl.geometry = new THREE.EdgesGeometry(bodyDef.geo());
}

function animatePreview() {
    if (!_pvRunning) return;
    _pvRafId = requestAnimationFrame(animatePreview);
    if (_pvBike) _pvBike.rotation.y += 0.012;
    _pvRdr.render(_pvScene, _pvCam);
}

function showPreview() {
    _initPreview();
    _createPreviewBike();
    _pvRunning = true;
    animatePreview();
}

function hidePreview() {
    _pvRunning = false;
    if (_pvRafId) { cancelAnimationFrame(_pvRafId); _pvRafId = null; }
}
