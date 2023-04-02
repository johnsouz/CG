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

import { OBJLoader } from '../build/jsm/loaders/OBJLoader.js';
import { MTLLoader } from '../build/jsm/loaders/MTLLoader.js';
import { Sky } from '../assets/shaders/Sky.js';

let scene = new THREE.Scene();    // Create main scene
let renderer = initRenderer();    // Init a basic renderer
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

let camera = initCamera(new THREE.Vector3(0, 0, 30)); // Init camera in this position
let light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

// https://threejs.org/examples/webgl_shaders_sky.html
let sky = new Sky();
sky.scale.setScalar(100);
scene.add(sky);
sky.material.uniforms['sunPosition'].value.setFromSphericalCoords(1, 0.4 * Math.PI, 0);


class PlaneController {

  p = document.querySelector('#coords');

  /**
   * @param {Element} viewport 
   * @param {THREE.Mesh} plane 
   */
  constructor(viewport, plane) {
    this.viewport = viewport;
    this.plane = plane;
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

    this.p.textContent = `
    Origin = [${this.origin.x}, ${this.origin.y}]
    DeltaPx = [${this.mouseDelta.x}, ${this.mouseDelta.y}]
    DeltaAbs = [${this.mouseDeltaAbs.x.toFixed(3)}, ${this.mouseDeltaAbs.y.toFixed(3)}]`;

    this.plane.matrix
      .identity();
    this.plane.position
      .copy(this.mouseDelta)
      .divideScalar(35);
    this.plane.rotation
      .set(0, 0, Math.PI / 8 * this.mouseDelta.x / this.origin.x);
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

let planeHolder = new THREE.Object3D();
scene.add(planeHolder);

let loaded = false;

let mtll = new MTLLoader();
mtll.load('airplane/14082_WWII_Plane_Japan_Kawasaki_Ki-61_v1_L2.mtl', mat => {

  let objl = new OBJLoader();
  objl.setMaterials(mat);

  objl.load('airplane/14082_WWII_Plane_Japan_Kawasaki_Ki-61_v1_L2.obj',
    /** @param {THREE.Object3D} obj */
    obj => {
      obj.rotateX(-Math.PI / 2)
        .rotateZ(Math.PI / 2)
        .scale.setScalar(6);

      planeHolder.add(obj);
      loaded = true;
    }, onerror = console.error);
});


let controller = new PlaneController(renderer.domElement, planeHolder);

render();
function render() {
  requestAnimationFrame(render);
  if (loaded)
    renderer.render(scene, camera) // Render scene
}