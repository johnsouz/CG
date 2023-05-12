import * as THREE from 'three';
import { MathUtils } from 'three';
import { CONFIG, sprintProps } from './utils.js';

export class PlaneController {

  p = document.querySelector('#coords');

  /**
   * @param {THREE.Object3D} obj O objeto a ser movido
   * @param {THREE.Camera} camera A camera usado em raycasting
   * @param {THREE.Object3D} target O objeto que será a mira
   * @param {THREE.Object3D} plane Plano que recebe o raio
   */
  constructor(obj, camera, target, plane) {
    this.obj = obj;
    this.camera = camera;
    this.target = target;
    this.plane = plane;

    this.cameraInitialPos = camera.position.clone();
    this.cameraInitialRotation = camera.quaternion.clone();
    this.cameraTarget = new THREE.Vector3();

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
  }

  /**
   * @param {number} dt deltaTime
  */
  update(dt) {
    this.raycastIntersections.length = 0;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.raycaster.intersectObject(this.plane, false, this.raycastIntersections);

    let ray = this.raycastIntersections[0] || { point: this.obj.position };
    this.moveDelta.subVectors(ray.point, this.obj.position);

    this.euler.x = MathUtils.clamp(this.moveDelta.y * Math.PI / 90, -Math.PI / 8, Math.PI / 8)
    this.euler.y = -MathUtils.clamp(this.moveDelta.x * Math.PI / 90, -Math.PI / 8, Math.PI / 8)
    this.euler.z = -MathUtils.clamp(this.moveDelta.x * Math.PI / 45, -Math.PI / 6, Math.PI / 6)
    this.quaternion.setFromEuler(this.euler);

    // quando não estiver em debug, a camera se movimenta levemente em
    // direção as coordenas de tela do mouse
    if (!CONFIG.debug) {
      this.cameraTarget.copy(this.cameraInitialPos)
      this.cameraTarget.x += this.pointer.x * 50;
      this.cameraTarget.y += this.pointer.y * 25;

      // translação da camera
      this.camera.position.lerp(this.cameraTarget, dt * 20);

      // ao sair do modo debug, a rotação da camera pode ter sido modificada
      this.camera.quaternion.slerp(this.cameraInitialRotation, dt * 10);
    }

    // translação e rotação do objeto
    this.obj.position.lerp(ray.point, dt * 5)
    this.obj.quaternion.slerp(this.quaternion, dt * 10);
    
    this.target.position.copy(this.obj.position);
    this.target.quaternion.copy(this.obj.quaternion);

    if (CONFIG.debug)
      this.p.innerText =
        sprintProps(this.obj, ["position"]) +
        sprintProps(this, ["euler", "quaternion", "moveDelta", "pointer"]) +
        sprintProps(ray, ["point"], "ray.point");
  }
}