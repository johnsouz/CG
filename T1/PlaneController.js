import * as THREE from 'three';
import { MathUtils } from 'three';
import { CONFIG } from './config.js';

export class PlaneController {

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
