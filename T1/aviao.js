import * as THREE from 'three';
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  onWindowResize,
  createGroundPlaneXZ
} from "../libs/util/util.js";

import { Sky } from '../assets/shaders/Sky.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

const DEBUF_INFO = false;
import { createGround, createAirplane } from 'meshGenerator.js';

let scene = new THREE.Scene();    // Create main scene
scene.fog = new THREE.Fog(0xffffff, 800, 1000)

let renderer = initRenderer();    // Init a basic renderer
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

let camera = initCamera(new THREE.Vector3(0, 0, 50)); // Init camera in this position
let light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

// https://threejs.org/examples/webgl_shaders_sky.html
let sky = new Sky();
sky.scale.setScalar(1000);
scene.add(sky);
sky.material.uniforms['sunPosition'].value.setFromSphericalCoords(1, 0.4 * Math.PI, 0);

scene.add(new THREE.AxesHelper(50))

class PlaneController {

  p = document.querySelector('#coords');

  /**
   * @param {Element} viewport 
   * @param {THREE.Mesh} plane 
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
new OrbitControls(camera, renderer.domElement);


let randInt = (min, max) =>
  Math.random() * (max - min) + min;

class ZTranslater {
  constructor(from, to = 0) {
    this.from = from;
    this.to = to;
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(10, 10),
      new THREE.MeshPhysicalMaterial({
        color: 'red',
        opacity: 0.6,
        transparent: true
      }))
    this.mesh.position
      .set(randInt(-200, 200), -25, randInt(to, from))
  }

  update() {
    let pos = this.mesh.position;
    pos.z += 5;
    if (pos.z >= this.to) {
      pos.z = this.from;
      pos.x = randInt(-200, 200);
    }
  }
}

/** @type {ZTranslater[]} */
let arveres = []
let numArveres = 50;
for (let i = 0; i <= numArveres; ++i)
  arveres.push(new ZTranslater(-randInt(900, 1000)));

scene.add(createGround(), ...arveres.map(a => a.mesh));

render();
function render() {
  requestAnimationFrame(render);
  arveres.forEach(arvere => arvere.update());
  renderer.render(scene, camera) // Render scene
}