import * as THREE from 'three';
import { MathUtils } from 'three';
import { CONFIG, sprintProps } from './utils.js';
import { createBullet, importAirplane, importTargets } from './meshGenerators.js';
import { createGroundPlane } from '../libs/util/util.js';

export class PlaneController {

  p = document.querySelector('#coords');
  raycaster = new THREE.Raycaster();

  /**
   * @param {THREE.Scene} scene A Scene atual
   * @param {THREE.Object3D} obj O objeto a ser movido
   * @param {THREE.Camera} camera A camera usado em raycasting
   * @param {THREE.Object3D} target O objeto que será a mira
   */
  constructor(scene, camera) {

    /** o plano que interceptará o Raycaster */
    let raycastPlane = createGroundPlane(1000, 1000);
    raycastPlane.position.add(CONFIG.raycastPlaneOffset);
    raycastPlane.visible = CONFIG.debug;
    raycastPlane.material.transparent = true;
    raycastPlane.material.opacity = 0.2;
    this.raycastPlane = raycastPlane;

    // a cena atual e sua camera
    this.scene = scene;
    this.camera = camera;

    /** o objeto que terá sua posição controlada */
    this.object = importAirplane(scene);
    this.object.position.x = camera.position.x;
    this.object.position.y = camera.position.z;
    this.object.position.z = -(CONFIG.raycastPlaneOffset.z + CONFIG.airplaneOffset);

    /** a mira, que é o ray interceptado no plano */
    this.target = importTargets(scene);

    /** posições inicias da camera */
    this.cameraInitialPos = camera.position.clone();
    this.cameraInitialRotation = camera.quaternion.clone();

    /** o valor onde a camera.position será interpolada */
    this.cameraPositionTarget = new THREE.Vector3();

    /** o valor onde a object.position será interpolada */
    this.objectPositionTarget = new THREE.Vector3();

    /** vetor unitario da direção objeto/target */
    this.direction = new THREE.Vector3();

    /** posição atual do ponteiro em coordenadas de tela normalizadas */
    this.pointer = new THREE.Vector2();
    /** a diferença das coordenadas do target desde o ultimo frame */
    this.moveDelta = new THREE.Vector3();
    /** transformação de coordenadas no target independente do plano */
    this.offsettedTarget = new THREE.Vector3();

    // para calculos de rotação do objeto
    this.euler = new THREE.Euler(0, Math.PI, 0);
    this.quaternion = new THREE.Quaternion();

    /** guarda todos os projeteis na cena
     * @type {Object.<string, THREE.Mesh>} */
    this.bullets = {};

    /** determina se neste frame vai haver disparo */
    this.willShoot = false;

    scene.add(raycastPlane, this.object, this.target);

    /**
     * Guarda o objeto de raycast para que não seja preciso instanciar uma nova `Array`
     * a cada chamada de `Raycaster.intersectObject`
     * @type {THREE.Intersection[]} */
    this.raycastIntersections = [];

    window.addEventListener('pointermove', e => this.__pointermoveCallback(e));
    window.addEventListener('click', e => this.__clickCallback(e));
  }

  /** Chamado toda vez em que o mouse é movido
   * @param {MouseEvent} e */
  __pointermoveCallback(e) {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  /** @param {MouseEvent} e */
  __clickCallback(e) {
    if (CONFIG.simulationOn)
      this.willShoot = true;
    
    if (!CONFIG.simulationOn && !CONFIG.debug) {
      CONFIG.simulationOn = true;
      document.body.style.cursor = 'none';
    }
  }

  /** @param {number} dt deltaTime */
  update(dt) {

    if (!CONFIG.simulationOn)
      console.log("fuckness")

    // setup do raycaster a partir da camera
    this.raycastIntersections.length = 0;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.raycaster.intersectObject(this.raycastPlane, false, this.raycastIntersections);

    // interseção do raycaster, caso não exista, retorne
    let ray = this.raycastIntersections[0];
    if (!ray) return;

    // delta da posição desde o último frame
    this.moveDelta.subVectors(ray.point, this.target.position);

    // quando não estiver em debug, a camera se movimenta levemente em
    // direção as coordenas de tela do mouse
    if (!CONFIG.debug) {
      this.cameraPositionTarget.copy(this.cameraInitialPos)
      this.cameraPositionTarget.x += this.pointer.x * 25;
      this.cameraPositionTarget.y += this.pointer.y * 25;

      // translação da camera
      this.camera.position.lerp(this.cameraPositionTarget, dt * 20);

      // ao sair do modo debug, a rotação da camera pode ter sido modificada
      this.camera.quaternion.slerp(this.cameraInitialRotation, dt * 10);
    }

    // Posição do target a ser interpolada, sem alterar o valor no raycast
    this.offsettedTarget.copy(ray.point);
    this.offsettedTarget.z = CONFIG.raycastPlaneOffset.z + CONFIG.targetOffset.z;

    // translação do alvo para o ponto de interseção
    this.target.position.lerp(this.offsettedTarget, dt * 10);
    this.target.position.x = MathUtils.clamp(this.target.position.x, -60, 60);
    this.target.position.y = MathUtils.clamp(this.target.position.y, -30, 30);

    // translação e rotação do objeto e alvo,
    // sendo que o objeto está a CONFIG.airplaneOffset unidades atrás do alvo
    this.objectPositionTarget.copy(this.target.position);
    this.objectPositionTarget.z = this.target.position.z + CONFIG.airplaneOffset;
    this.object.position.lerp(this.objectPositionTarget, dt)

    // o vetor unitario da direção objeto/target
    this.direction
      .subVectors(this.target.position, this.object.position)
      .normalize();

    // o objeto sempre apontará para o alvo
    this.object.lookAt(this.target.position);

    // rotação do filho em torno do eixo Z
    this.euler.z = MathUtils.clamp(-this.moveDelta.x * Math.PI / 45, -Math.PI / 6, Math.PI / 6)
    this.quaternion.setFromEuler(this.euler);
    this.object.children[0]?.quaternion.slerp(this.quaternion, dt * 20);

    // apontar as miras para o objeto
    this.target.lookAt(this.object.position);

    // Atualização das posiçoes dos projeteis
    for (let [key, bullet] of Object.entries(this.bullets)) {

      // avança o projétil
      bullet.translateZ(CONFIG.bulletSpeed * dt);

      // se o projetil estiver fora da AABB, é remova da cena
      if (!CONFIG.bulletBoundingBox.containsPoint(bullet.position)) {
        this.scene.remove(bullet);
        delete this.bullets[key]
      }
    }

    // Criação do projétil
    if (this.willShoot) {
      this.willShoot = false;

      let bullet = createBullet(this.object.position)
      bullet.lookAt(this.direction.clone().add(bullet.position));

      this.scene.add(bullet)
      this.bullets[bullet.uuid] = bullet;
    }

    if (CONFIG.debug)
      this.p.innerText =
        sprintProps(this.object, ["position"]) +
        sprintProps(this.target, ["position"])
  }
}