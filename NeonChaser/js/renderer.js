import { game, PI, R, R_Sign, floor as mFloor } from './state.js';
import { CFG } from './config.js';

// --- Scene & Renderer ---
const canvas = document.getElementById('game-canvas');
export const rdr = new THREE.WebGLRenderer({ canvas, antialias: true });
rdr.setSize(window.innerWidth, window.innerHeight);
rdr.setPixelRatio(Math.min(window.devicePixelRatio, 2));

export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050510, 0.015);

export const cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 400);
cam.position.set(0, 8, 15);
cam.lookAt(0, 0, -20);
scene.add(cam);

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
export const sPass = new THREE.ShaderPass(ShockShader);
const bPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 2.0, 0.5, 0.1);
export const composer = new THREE.EffectComposer(rdr);
composer.addPass(rPass);
composer.addPass(sPass);
composer.addPass(bPass);

// --- Lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 0.3), new THREE.HemisphereLight(0x0f172a, 0xec4899, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// --- Floor Shader ---
export const floorMat = new THREE.ShaderMaterial({
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
export const MkMat = (c, e, i, r = 0.3, m = 0.5) =>
    new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: i, roughness: r, metalness: m });

export const matTire = MkMat(0x111111, 0, 0, 0.9, 0.1);
export const matPlayerBody = MkMat(0x38bdf8, 0x0284c7, 0.6);
export const matPlayerNeon = MkMat(0x00ffff, 0x00ffff, 2.0);
export const matEnemyBreak = MkMat(0x064e3b, 0x022c22, 0.5);
export const matEnemyNeonB = MkMat(0x10b981, 0x059669, 1.0);
export const matEnemyUnbreak = MkMat(0xbe123c, 0x9f1239, 0.8);
export const matEnemyNeonU = MkMat(0xff0055, 0xe11d48, 2.0);
export const matEnemyKnock = MkMat(0x94a3b8, 0x334155, 0.5, 0.5, 0.5);
export const matEnemyNeonK = MkMat(0x1e293b, 0x1e293b, 1.0);
export const matDash = MkMat(0x00ffff, 0x00ffff, 2.0);
export const matHeart = MkMat(0xfca5a5, 0xff0055, 2.0);
const matJump = MkMat(0x34d399, 0x059669, 1.0);
const matPil = MkMat(0x8b5cf6, 0xa855f7, 1.5);

// --- Geometries ---
const applyGeo = (g, func) => { func(g); return g; };

export const geoTire = applyGeo(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 12), g => g.rotateZ(PI / 2));
export const geoRim = applyGeo(new THREE.CylinderGeometry(0.45, 0.45, 0.32, 12), g => g.rotateZ(PI / 2));
export const geoBody = applyGeo(new THREE.ConeGeometry(0.4, 3.5, 3), g => g.rotateX(-PI / 2).rotateZ(PI / 2));
export const geoRBody = applyGeo(new THREE.ConeGeometry(0.8, 3.5, 5), g => g.rotateX(-PI / 2));
export const geoROrb = new THREE.SphereGeometry(0.3, 8, 8);

const shapeDash = new THREE.Shape();
[[0, 2], [2, -2], [1, -2], [0, 0], [-1, -2], [-2, -2], [0, 2]].forEach((p, i) => i ? shapeDash.lineTo(p[0], p[1]) : shapeDash.moveTo(p[0], p[1]));
export const geoDash = applyGeo(new THREE.ExtrudeGeometry(shapeDash, { depth: 0.2, bevelEnabled: false }), g => g.rotateX(-PI / 2).translate(0, 0.1, 0).scale(1.5, 1.5, 1.5));

const shapeHeart = new THREE.Shape();
shapeHeart.moveTo(0, 1.5);
shapeHeart.bezierCurveTo(2, 3.5, 4, 1.5, 0, -3);
shapeHeart.bezierCurveTo(-4, 1.5, -2, 3.5, 0, 1.5);
export const geoHeart = applyGeo(new THREE.ExtrudeGeometry(shapeHeart, { depth: 0.5, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.2, bevelThickness: 0.2 }), g => g.translate(0, 0, -0.25).scale(0.5, 0.5, 0.5));

export const geoJump = new THREE.BoxGeometry(4, 0.5, 4);

export const geoWarn = applyGeo(new THREE.PlaneGeometry(16, 300, 1, 50), g => g.rotateX(-PI / 2).translate(0, 0, -150));
export const matWarnBase = new THREE.ShaderMaterial({
    uniforms: { crv: { value: 0 }, op: { value: 0.3 } },
    vertexShader: `uniform float crv; varying vec2 vUv; void main(){vUv=uv; vec3 p=position; p.x+=crv*p.z*p.z; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader: `uniform float op; varying vec2 vUv; void main(){ float edge = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x); gl_FragColor = vec4(1.0, 0.0, 0.0, op * edge); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
});

// --- Mesh Factories ---
export function createBike(bodyMat, neonMat) {
    const grp = new THREE.Group();
    const makeTire = z => {
        const g = new THREE.Group();
        const t = new THREE.Mesh(geoTire, matTire);
        const r = new THREE.Mesh(geoRim, neonMat);
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(geoTire), neonMat);
        g.add(t, r, e);
        g.position.set(0, 0.55, z);
        return g;
    };
    const fTire = makeTire(-1.3), rTire = makeTire(1.3);
    const nl = new THREE.LineSegments(new THREE.EdgesGeometry(geoBody), neonMat);
    nl.position.set(0, 0.9, 0);
    grp.add(fTire, rTire, nl);
    grp.userData = {
        tires: [fTire, rTire],
        changeMat: (b, n) => { nl.material = n; fTire.children[1].material = n; fTire.children[2].material = n; rTire.children[1].material = n; rTire.children[2].material = n; }
    };
    return grp;
}

export function createRocket(bodyMat, neonMat) {
    const grp = new THREE.Group();
    const bd = new THREE.Mesh(geoRBody, bodyMat);
    const nl = new THREE.LineSegments(new THREE.EdgesGeometry(geoRBody), neonMat);
    grp.add(bd, nl);
    const orbs = new THREE.Group();
    const oMats = [];
    for (let i = 0; i < 3; i++) {
        const orb = new THREE.Mesh(geoROrb, neonMat);
        const a = (i / 3) * PI * 2;
        orb.position.set(Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0);
        orbs.add(orb);
        oMats.push(orb);
    }
    grp.add(orbs);
    grp.userData = { orbs, changeMat: (b, n) => { bd.material = b; nl.material = n; oMats.forEach(o => o.material = n); } };
    return grp;
}

// --- Player ---
export const playerMesh = createBike(matPlayerBody, matPlayerNeon);
playerMesh.scale.setScalar(1.5);
scene.add(playerMesh);
export const playerBox = new THREE.Box3();

// --- Road Pillars ---
const geoPil = new THREE.BoxGeometry(0.5, 3, 0.5);
for (let i = 0; i < 40; i++) {
    const l = new THREE.Mesh(geoPil, matPil);
    const r = new THREE.Mesh(geoPil, matPil);
    const z = 10 - i * 5.5;
    scene.add(l, r);
    game.road.push({ L: l, R: r, z });
}

// --- Background Objects ---
const pGeos = [new THREE.OctahedronGeometry(2, 0), new THREE.TorusGeometry(1.5, 0.3, 8, 16), new THREE.IcosahedronGeometry(2, 0)];
const pMats = [0x38bdf8, 0xf43f5e, 0xa855f7].map(c => new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: 0.4 }));
for (let i = 0; i < 50; i++) {
    const p = new THREE.Mesh(pGeos[mFloor(R() * pGeos.length)], pMats[mFloor(R() * pMats.length)]);
    p.position.set(R_Sign() * 60, R() * 40 + 5, R_Sign() * 150 - 50);
    p.userData = { rX: R_Sign(), rY: R_Sign(), rZ: R_Sign() };
    scene.add(p);
    game.pts.push(p);
}
