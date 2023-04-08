import * as THREE from 'three';
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  onWindowResize,
  createGroundPlaneWired,
} from "../libs/util/util.js";

import { Sky } from '../assets/shaders/Sky.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

const DEBUF_INFO = true;
import { createGround, createAirplane, createTree } from './meshGenerators.js';

// Create main scene
let scene = new THREE.Scene();

// Init a basic renderer
let renderer = initRenderer();
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

let camera = initCamera(new THREE.Vector3(0, 0, 50)); // Init camera in this position
camera.lookAt(0, 0, -250);
let light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

// https://threejs.org/examples/webgl_shaders_sky.html
let sky = new Sky();
sky.scale.setScalar(1000);
scene.add(sky);
sky.material.uniforms['sunPosition'].value.setFromSphericalCoords(1, 0.4 * Math.PI, 0);

// scene.add(new THREE.AxesHelper(50))

class PlaneController {

  p = document.querySelector('#coords');

  /**
   * @param {Element} viewport 
   * @param {THREE.Object3D} plane 
   */
  constructor(plane, viewport) {
    this.plane = plane;
    this.viewport = viewport;
    this.origin = new THREE.Vector3(viewport.clientWidth / 2, viewport.clientHeight / 2);
    this.mousePos = new THREE.Vector3();
    this.mouseDelta = new THREE.Vector3();
    this.__upNormal = new THREE.Vector3(0, 1, 0);
    this.mouseDeltaAbs = new THREE.Vector3();

    window.addEventListener('mousemove', e => this.__mousemoveCallback(e));
    window.addEventListener('resize', e => this.__resizeCallback(e));
  }

  /** @param {MouseEvent} e */
  __mousemoveCallback(e) {
    this.mousePos
      .set(e.x, e.y);

    this.mouseDelta
      .subVectors(this.mousePos, this.origin)
      .y *= -1;

    this.mouseDeltaAbs
      .set(this.mouseDelta.x / this.origin.x, this.mouseDelta.y / this.origin.y);

    if (DEBUF_INFO)
      this.p.textContent = `Origin = [${this.origin.x}, ${this.origin.y}]
DeltaPx = [${this.mouseDelta.x}, ${this.mouseDelta.y}]
DeltaAbs = [${this.mouseDeltaAbs.x.toFixed(3)}, ${this.mouseDeltaAbs.y.toFixed(3)}]`;

    this.plane.position
      .copy(this.mouseDelta)
      .divideScalar(20);
    this.plane.rotation
      .y = Math.PI / 8 * this.mouseDelta.x / this.origin.x
  }

  /** @param {MouseEvent} e */
  __resizeCallback(e) {
    this.origin
      .set(this.viewport.clientWidth / 2, this.viewport.clientHeight / 2);
  }

  dispose() {
    window.removeEventListener('mousemove', this.__mousemoveCallback);
    window.removeEventListener('resize', this.__resizeCallback);
  }
}

// Listen window size changes
window.addEventListener('resize', () => {
  onWindowResize(camera, renderer)
}, false);

let plane = createAirplane();
scene.add(plane);

new PlaneController(plane, renderer.domElement);
if (DEBUF_INFO)
  new OrbitControls(camera, renderer.domElement);

let randInt = (min, max) =>
  Math.random() * (max - min) + min;

function lerp(x0, y0, x1, y1, x) {
  if (x <= x0)
    return y0;
  else if (x >= x1)
    return y1;
  else
    return (y1 - y0) / (x1 - x0) * (x - x0) + y0;
}

class ZTranslater {
  /**
   * @param {number} from Posição inicial do objeto (No eixo Z)
   * @param {number} to Posição final do objeto (No eixo Z)
   * @param {number} speed Número de unidades somada a coordenada Z a cada chamada de {@link ZTranslater.update}
   * @param {THREE.Mesh | undefined} mesh O objeto a ser movido. Se `undefined`, utiliza-se {@link createTree} como objeto
   */
  constructor(from, to = 0, speed = 1, mesh) {
    this.from = from;
    this.to = to;
    this.speed = speed;

    if (mesh instanceof THREE.Mesh) {
      this.mesh = mesh;
    } else {
      this.mesh = createTree()
      this.mesh.material.transparent = true;

      // inicializa as posições, escalas e rotações com valores aleatorios dentro do dominio
      this.mesh.position
        .set(randInt(-250, 250), -40, randInt(to, from));
      this.mesh.rotation.y = Math.PI * Math.random();
      this.mesh.scale.setScalar(randInt(6, 10) / 10);
    }
  }

  /** 
   * - Avança {@link ZTranslater.speed } unidades no eixo Z
   * - Contem a coordenada entre {@link ZTranslater.from } e {@link ZTranslater.to }
   * - Caso ultrapasse {@link ZTranslater.to } volte a {@link ZTranslater.from } */
  update() {
    let pos = this.mesh.position;

    pos.z += this.speed;
    if (pos.z >= this.to)
      pos.z = this.from;
    
    let opacity = lerp(-950, 0, -800, 1, pos.z);
    this.mesh.traverse(obj => {
      if (obj.isMesh || obj.isLine)
        obj.material.opacity = opacity;
    });   
  }
}

/** Coleção dos objetos que se movem (planos e avião)
 * @type {ZTranslater[]}
 */
let translaters = []

let numGroundPlanes = 10;
for (let i = 0; i <= numGroundPlanes; ++i) {
  let ground = new ZTranslater(-numGroundPlanes*100, 100, 1, createGround(100, 100))
  ground.mesh.position.z -= 100 * i;
  translaters.push(ground);
}

let numArveres = 300;
for (let i = 0; i <= numArveres; ++i)
  translaters.push(new ZTranslater(-1000, 100, 1));

scene.add(...translaters.map(a => a.mesh));

render();
function render() {
  requestAnimationFrame(render);
  translaters.forEach(obj => obj.update());
  renderer.render(scene, camera) // Render scene
}