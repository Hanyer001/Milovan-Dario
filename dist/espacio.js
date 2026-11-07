import * as THREE from 'three';

const HOME_Z = 9.6;
const FOV = 42;
const VIEW_HEIGHT = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * HOME_Z;
const CARD_LAYOUT = [
  { x: -0.23, y: 0.06, width: 0.55, height: 0.58 },
  { x: 0.26, y: 0.22, width: 0.44, height: 0.46 },
  { x: 0.20, y: -0.28, width: 0.47, height: 0.43 }
];
const TRAJECTORIES = [
  { x: -1.14, y: -0.10, z: -2.2, rx: 0.31, ry: -0.86, rz: -0.28, endX: 0.06, endY: -0.14, endZ: -0.12 },
  { x: 1.10, y: 0.28, z: -1.8, rx: -0.25, ry: 0.82, rz: 0.29, endX: -0.12, endY: 0.19, endZ: -0.18 },
  { x: 0.15, y: -1.07, z: -2.1, rx: 0.80, ry: -0.37, rz: -0.22, endX: 0.15, endY: -0.18, endZ: -0.07 }
];

const panelVertex = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const panelFragment = `
  varying vec2 vUv;
  uniform float uOpacity;
  uniform vec3 uAccent;
  uniform vec3 uEdge;

  void main() {
    vec2 uv = vUv;
    vec2 edge = min(uv, 1.0 - uv);
    float border = 1.0 - smoothstep(0.002, 0.009, min(edge.x, edge.y));
    float beam = exp(-4.0 * length(uv - vec2(0.18, 0.91)));
    float corner = (1.0 - smoothstep(0.11, 0.13, max(edge.x, edge.y)))
      * (1.0 - smoothstep(0.008, 0.014, min(edge.x, edge.y)));
    vec3 color = mix(vec3(0.008, 0.025, 0.065), uAccent * 0.34, beam);
    color = mix(color, uAccent, border * 0.58);
    color = mix(color, mix(uAccent, uEdge, step(0.54, uv.x)), corner * 0.9);

    gl_FragColor = vec4(color, uOpacity * 0.96);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createSpace(layer, crestSource) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'high-performance' });
  if (!context) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  layer.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 70);
  camera.position.z = HOME_Z;
  const key = new THREE.DirectionalLight('#fff0dc', 3.0);
  key.position.set(4, 7, 6);
  const fill = new THREE.DirectionalLight('#76adff', 1.1);
  fill.position.set(-6, -1, 5);
  scene.add(new THREE.AmbientLight('#ccdfff', 1.15), key, fill);

  const crestMaterial = new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, depthWrite: false, toneMapped: false
  });
  const crest = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), crestMaterial);
  crest.position.z = -1.45;
  crest.visible = false;
  scene.add(crest);

  const accent = new THREE.Color('#8bcaff');
  const red = new THREE.Color('#e0262c');
  const blue = new THREE.Color('#00529f');
  const cards = TRAJECTORIES.map((_, index) => {
    const material = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 }, uAccent: { value: accent }, uEdge: { value: index === 2 ? red : blue } },
      vertexShader: panelVertex,
      fragmentShader: panelFragment,
      transparent: true,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    mesh.renderOrder = index === 2 ? 5 : 3 - index;
    scene.add(mesh);
    return mesh;
  });

  const state = { crest: 0, cards: cards.map(() => ({ progress: 0 })) };
  const stage = layer.parentElement;
  let dirty = true;
  let lost = false;
  let width = 0;
  let height = 0;
  let textureReady = false;
  let compact = false;
  let reduced = false;
  const invalidate = () => { dirty = true; };
  const measure = () => {
    width = layer.clientWidth;
    height = layer.clientHeight;
    if (!width || !height) return;
    compact = width < 920 && width / height < 1.65;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6, 2400 / width));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  };

  new THREE.TextureLoader().load(crestSource, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    crestMaterial.map = texture;
    crestMaterial.needsUpdate = true;
    textureReady = true;
    invalidate();
  }, undefined, () => {
    stage.classList.add('crest-unavailable');
  });

  function renderIfNeeded() {
    if (!dirty || lost || !width || !height || document.hidden) return;
    dirty = false;
    const viewHeight = VIEW_HEIGHT;
    const viewWidth = viewHeight * camera.aspect;

    crest.visible = textureReady && state.crest > 0.001;
    if (crest.visible) {
      const size = Math.min(viewWidth * 1.5, viewHeight * 2.1);
      crest.position.set(viewWidth * (compact ? 0 : 0.11), compact ? viewHeight * 0.06 : -size * 0.25, -1.45);
      crest.scale.set(size, size, 1);
      crestMaterial.opacity = state.crest;
    }

    const areaWidth = viewWidth * (compact ? 0.9 : 0.61);
    const areaHeight = viewHeight * (compact ? 0.63 : 0.85);
    const areaX = viewWidth * (compact ? 0 : 0.17);
    const areaY = viewHeight * (compact ? -0.16 : 0.015);

    cards.forEach((card, index) => {
      const progress = state.cards[index].progress;
      card.visible = progress > 0.001;
      if (!card.visible) return;

      const start = TRAJECTORIES[index];
      const pose = CARD_LAYOUT[index];
      const travel = reduced ? 0 : 1 - progress;
      card.position.set(areaX + areaWidth * (pose.x + start.x * travel),
        areaY + areaHeight * (pose.y + start.y * travel), index * 0.20 + start.z * travel);
      card.rotation.set(start.endX + start.rx * travel, start.endY + start.ry * travel, start.endZ + start.rz * travel);
      card.scale.set(areaWidth * pose.width, areaHeight * pose.height, 1);
      card.material.uniforms.uOpacity.value = Math.min(1, progress * 1.3);
    });

    renderer.render(scene, camera);
  }

  const resize = new ResizeObserver(measure);
  resize.observe(layer);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    stage.classList.remove('has-webgl');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    stage.classList.add('has-webgl');
    invalidate();
  });
  document.addEventListener('visibilitychange', invalidate);
  measure();
  return { camera, state, invalidate, renderIfNeeded, setReduced(value) { reduced = value; invalidate(); } };
}
