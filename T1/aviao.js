import * as THREE from 'three';
import { MathUtils } from 'three';

import {
  initRenderer,
  initCamera,
  initDefaultDirectionalLighting,
  onWindowResize,
  initDefaultBasicLight,
} from "../libs/util/util.js";

import { Sky } from '../assets/shaders/Sky.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { createGround, createAirplane, createTree } from './meshGenerators.js';

let rand = (min, max) =>
  Math.random() * (max - min) + min;

const CONFIG = {
  debug: true,
  cameraPos: new THREE.Vector3(0, 0, 50),
  lerpFactor: 0.2,

  treePosFrom: -1000,
  treePosTo: 100,
  treeVerticalOffset: -40,

  fogFadeFar: -950,
  fogFadeNear: -800,

  speed: 2,

  treeCount: 300,
  treeDistribution: 300,
  treeScaleMin: 0.6,
  treeScaleMax: 1.5,

  planeCount: 10,
  planeWidth: 1000,
  planeHeight: 100,
  planeVerticalOffset: -50,
};

class PlaneController {

  p = document.querySelector('#coords');

  /**
   * @param {Element} viewport Um objeto da DOM que captura o movimento do mouse
   * @param {THREE.Object3D} plane O objeto a ser movido
   */
  constructor(plane, viewport) {
    this.plane = plane;
    this.viewport = viewport;
    this.origin = new THREE.Vector3(viewport.clientWidth / 2, viewport.clientHeight / 2);
    this.mousePos = new THREE.Vector3();
    this.mouseDelta = new THREE.Vector3();
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

    if (CONFIG.debug)
      this.p.textContent =
        `origin = [${this.origin.x}, ${this.origin.y}]\n` +
        `mouseDelta = [${this.mouseDelta.x}, ${this.mouseDelta.y}, ${this.mouseDelta.z}]\n` +
        `mouseDeltaAbs = [${this.mouseDeltaAbs.x.toFixed(3)}, ${this.mouseDeltaAbs.y.toFixed(3)}]\n`;
  }

  /** @param {MouseEvent} e */
  __resizeCallback(e) {
    this.origin
      .set(this.viewport.clientWidth / 2, this.viewport.clientHeight / 2);
  }

  /**
   * @param {number} dt deltaTime
   */
  update(dt) {
    this.plane.position.lerp(this.mouseDelta.clone().divideScalar(20), CONFIG.lerpFactor);

    this.plane.rotation
      .z = MathUtils.lerp(this.plane.rotation.y, MathUtils.DEG2RAD * 270 * this.mouseDeltaAbs.x, CONFIG.lerpFactor);
  }
}

class ZTranslater {
  /**
   * @param {number} from Posição inicial do objeto (No eixo Z)
   * @param {number} to Posição final do objeto (No eixo Z)
   * @param {number} speed Número de unidades somada a coordenada Z a cada chamada de {@link ZTranslater.update}
   * @param {THREE.Mesh | undefined} mesh O objeto a ser movido. Se `undefined`, utiliza-se {@link createTree} como mesh
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
      this.mesh.position.set(
        rand(-CONFIG.treeDistribution, CONFIG.treeDistribution),
        CONFIG.treeVerticalOffset,
        rand(to, from)
      );
      
      this.mesh.rotation.y = Math.PI * Math.random();
      this.mesh.scale.setScalar(rand(CONFIG.treeScaleMin, CONFIG.treeScaleMax));
    }
  }

  /** 
   * - Avança {@link ZTranslater.speed } unidades no eixo Z
   * - Contem a coordenada entre {@link ZTranslater.from } e {@link ZTranslater.to }
   *   - Caso ultrapasse {@link ZTranslater.to } volte a {@link ZTranslater.from }
   */
  update() {
    let pos = this.mesh.position;

    pos.z += this.speed;
    if (pos.z >= this.to)
      pos.z = this.from;

    let opacity = MathUtils.mapLinear(pos.z, CONFIG.fogFadeFar, CONFIG.fogFadeNear, 0, 1)
    this.mesh.traverse(obj => {
      if (obj.isMesh || obj.isLine)
        obj.material.opacity = opacity;
    });
  }
}

// **********************

// Create main scene
let scene = new THREE.Scene();

// Init a basic renderer
let renderer = initRenderer();
let camera = initCamera(CONFIG.cameraPos); // Init camera in this position
let light = initDefaultDirectionalLighting(scene); // Create a basic light to illuminate the scene

// https://threejs.org/examples/webgl_shaders_sky.html
let sky = new Sky();
sky.scale.setScalar(1000);
scene.add(sky);
sky.material.uniforms['sunPosition'].value.setFromSphericalCoords(1, 0.4 * Math.PI, 0);

// Listen window size changes
window.addEventListener('resize', () => {
  onWindowResize(camera, renderer)
}, false);

let plane = createAirplane();
scene.add(plane);

let planeController = new PlaneController(plane, renderer.domElement);
if (CONFIG.debug)
  new OrbitControls(camera, renderer.domElement);

/** Coleção dos objetos que se movem (planos e árvores)
 * @type {ZTranslater[]} */
let translaters = []

for (let i = 0; i <= CONFIG.planeCount; ++i) {
  let ground = new ZTranslater(
    -CONFIG.planeCount * CONFIG.planeHeight,
    CONFIG.planeHeight,
    CONFIG.speed,
    createGround(CONFIG.planeWidth, CONFIG.planeHeight, CONFIG.planeVerticalOffset)
  );
  
  // posição inicial depende da ordem de inserção
  ground.mesh.position.z -= CONFIG.planeHeight * i;
  
  translaters.push(ground);
}

for (let i = 0; i <= CONFIG.treeCount; ++i)
  translaters.push(new ZTranslater(CONFIG.treePosFrom, CONFIG.treePosTo, CONFIG.speed));

scene.add(...translaters.map(a => a.mesh));

function render() {
  requestAnimationFrame(render);
  let dt = clock.getDelta();
  translaters.forEach(obj => obj.update(dt));
  planeController.update(dt)

  renderer.render(scene, camera) // Render scene
}

let clock = new THREE.Clock();
render();