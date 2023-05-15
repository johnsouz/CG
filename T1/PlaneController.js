import * as THREE from 'three';
import { MathUtils } from 'three';
import { CONFIG, sprintProps } from './utils.js';
import { importAirplane } from './meshGenerators.js';
import { createGroundPlane } from '../libs/util/util.js';

export class PlaneController {

  p = document.querySelector('#coords');

  /**
   * @param {THREE.Scene} scene A Scene atual
   * @param {THREE.Object3D} obj O objeto a ser movido
   * @param {THREE.Camera} camera A camera usado em raycasting
   * @param {THREE.Object3D} target O objeto que será a mira
   */
  constructor(scene, camera) {

    let raycastPlane = createGroundPlane(1000, 1000);
    raycastPlane.position.add(CONFIG.raycastPlaneOffset);
    raycastPlane.visible = CONFIG.debug;
    raycastPlane.material.transparent = true;
    raycastPlane.material.opacity = 0.2;

    this.scene = scene;
    this.object = importAirplane(scene);
    this.camera = camera;
    this.target = new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshBasicMaterial({ color: 'purple' }));
    this.raycastPlane = raycastPlane;

    scene.add(raycastPlane, this.object, this.target);

    this.cameraInitialPos = camera.position.clone();
    this.cameraInitialRotation = camera.quaternion.clone();
    this.cameraTarget = new THREE.Vector3();
    this.objectPosition = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.moveDelta = new THREE.Vector3();
    this.offsettedTarget = new THREE.Vector3();

    this.euler = new THREE.Euler(0, Math.PI, 0);
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

    // setup do raycaster a partir da camera
    this.raycastIntersections.length = 0;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.raycaster.intersectObject(this.raycastPlane, false, this.raycastIntersections);

    // interseção do raycaster, caso não exista, é a posição do target
    let ray = this.raycastIntersections[0] || { point: this.target.position };

    // delta da posição desde o último frame
    this.moveDelta.subVectors(ray.point, this.object.position);

    // quando não estiver em debug, a camera se movimenta levemente em
    // direção as coordenas de tela do mouse
    if (!CONFIG.debug) {
      this.cameraTarget.copy(this.cameraInitialPos)
      this.cameraTarget.x += this.pointer.x * 25;
      this.cameraTarget.y += this.pointer.y * 25;

      // translação da camera
      this.camera.position.lerp(this.cameraTarget, dt * 20);

      // ao sair do modo debug, a rotação da camera pode ter sido modificada
      this.camera.quaternion.slerp(this.cameraInitialRotation, dt * 10);
    }

    // Posição do target a ser interpolada, sem alterar o valor no raycast
    this.offsettedTarget
      .copy(ray.point)
      .add(CONFIG.targetOffset);
    
    // translação do alvo para o ponto de interseção
    this.target.position.lerp(this.offsettedTarget, dt * 10);
    this.target.position.x = MathUtils.clamp(this.target.position.x, -60, 60);
    this.target.position.y = MathUtils.clamp(this.target.position.y, -30, 30);

    // translação e rotação do objeto e alvo,
    // sendo que o objeto está a CONFIG.airplaneOffset unidades atrás do alvo
    this.objectPosition.copy(this.target.position);
    this.objectPosition.z += CONFIG.airplaneOffset;
    this.object.position.lerp(this.objectPosition, dt * 2)

    // o vetor unitario da direção objeto/target
    this.direction
      .subVectors(this.target.position, this.object.position)
      .normalize();

    // o objeto sempre apontará para o alvo
    this.object.lookAt(this.target.position);

    // rotação do filho em torno do eixo Z
    this.euler.z = MathUtils.clamp(-this.moveDelta.x * Math.PI / 45, -Math.PI / 6, Math.PI / 6)
    this.quaternion.setFromEuler(this.euler);
    this.object.children[0].quaternion.slerp(this.quaternion, dt * 20);

    if (CONFIG.debug)
      this.p.innerText =
        sprintProps(this.object, ["position"]) +
        sprintProps(this, ["euler", "quaternion", "moveDelta", "pointer"]) +
        sprintProps(ray, ["point"], "ray.point");
  }
}