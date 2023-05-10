import * as THREE from 'three';
import { MathUtils } from 'three';
import { CONFIG, sprintProps } from './config.js';

export class PlaneController {

  p = document.querySelector('#coords');

  /**
   * @param {THREE.Object3D} obj O objeto a ser movido
   * @param {THREE.Camera} camera A camera usado em raycasting
   * @param {THREE.Object3D} plane Plano que recebe o raio
   */
  constructor(obj, camera, plane) {
    this.obj = obj;
    this.camera = camera;
    this.plane = plane;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.moveDelta = new THREE.Vector3();

    this.euler = new THREE.Euler();
    this.quaternion = new THREE.Quaternion();

    /** @type {THREE.Intersection[]} */
    this.raycastIntersections = [];

    window.addEventListener('pointermove', e => this.__pointermoveCallback(e));
  }

  /** @param {MouseEvent} e */
  __pointermoveCallback(e) {

    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycastIntersections.length = 0;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.raycaster.intersectObject(this.plane, false, this.raycastIntersections);
  }

  /**
   * @param {number} dt deltaTime
   */
  update(dt) {
    let ray = this.raycastIntersections[0] || { point: this.obj.position };
    this.moveDelta.subVectors(ray.point, this.obj.position);

    this.euler.x = MathUtils.clamp(this.moveDelta.y * Math.PI / 90, -Math.PI / 8, Math.PI / 8)
    this.euler.y = -MathUtils.clamp(this.moveDelta.x * Math.PI / 90, -Math.PI / 8, Math.PI / 8)
    this.euler.z = -MathUtils.clamp(this.moveDelta.x * Math.PI / 45, -Math.PI / 6, Math.PI / 6)
    this.quaternion.setFromEuler(this.euler);

    this.obj.position.lerp(ray.point, dt * 10)
    this.obj.quaternion.slerp(this.quaternion, 10 * dt);

    if (CONFIG.debug)
      this.p.innerText =
        sprintProps(this.obj, ["position"]) +
        sprintProps(this, [ "euler", "quaternion", "moveDelta", "pointer"]) + 
        sprintProps(ray, ["point"], "ray.point");
  }
}