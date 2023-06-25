import * as THREE from 'three';
import { MathUtils } from 'three';
import { CONFIG } from './utils.js';
import { createBullet, importAirplane, importTargets } from './meshGenerators.js';
import { createGroundPlane } from '../libs/util/util.js';
import { World } from './world.js';

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

    this.isMobile = /Mobile|iP(hone|od|ad)|Android/i.test(window.navigator.userAgent);

    /** o plano que interceptará o Raycaster */
    let raycastPlane = createGroundPlane(1000, 1000);
    raycastPlane.position.add(CONFIG.raycastPlaneOffset);
    raycastPlane.visible = CONFIG.debug;
    raycastPlane.material.transparent = true;
    raycastPlane.material.opacity = 0.2;
    raycastPlane.material.depthWrite = false;
    raycastPlane.renderOrder = 2;
    this.raycastPlane = raycastPlane;

    if (this.isMobile) {
      this.joystick = nipplejs.create();
      this.joystickVector = new THREE.Vector3();
      this.joystickForce = 0;
    }

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
    this.pointer = new THREE.Vector3();
    /** a diferença das coordenadas do target desde o ultimo frame */
    this.moveDelta = new THREE.Vector3();
    /** transformação de coordenadas no target independente do plano */
    this.offsettedTarget = new THREE.Vector3();

    // para calculos de rotação do objeto
    this.euler = new THREE.Euler(0, Math.PI, 0);
    this.quaternion = new THREE.Quaternion();

    /** determina se neste frame vai haver disparo */
    this.willShoot = false;

    /** vida da nave */
    this.health = 5;
    this.color = new THREE.Color();

    scene.add(this.object, this.target);

    /**
     * Guarda o objeto de raycast para que não seja preciso instanciar uma nova `Array`
     * a cada chamada de `Raycaster.intersectObject`
     * @type {THREE.Intersection[]} */
    this.raycastIntersections = [];

    if (this.isMobile) {
      this.joystick.on('move', (_, e) => this.__joystickCallback(e));
    } else {
      window.addEventListener('pointermove', e => this.__pointermoveCallback(e));
      window.addEventListener('click', e => this.__clickCallback(e));
    }
  }

  __joystickCallback(e) {
    this.joystickForce = e.force;
    this.joystickVector.set(e.vector.x, e.vector.y);
  }

  /** Chamado toda vez em que o mouse é movido
   * @param {MouseEvent} e */
  __pointermoveCallback(e) {
    this.pointer.x = MathUtils.mapLinear(e.clientX, 0, window.innerWidth, -1, 1)
    this.pointer.y = -MathUtils.mapLinear(e.clientY, 0, window.innerHeight, -1, 1)
  }

  /** @param {MouseEvent} e */
  __clickCallback(e) {
    if (CONFIG.simulationOn) {
      this.willShoot = true;

      // TODO
      // Criar um request a cada disparo é muito bizarro

      // Cria um contexto de áudio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Carrega o arquivo de áudio do efeito sonoro
      const audioURL = 'X-wing blaster.mp3';
      const request = new XMLHttpRequest();
      request.open('GET', audioURL, true);
      request.responseType = 'arraybuffer';

      request.onload = function () {
        // Decodifica o arquivo de áudio
        audioContext.decodeAudioData(request.response, function (buffer) {
          // Cria um nó de áudio para o efeito sonoro
          const disparoNave = audioContext.createBufferSource();
          disparoNave.buffer = buffer;

          // Conecta o nó de áudio ao destino de áudio (saída)
          disparoNave.connect(audioContext.destination);

          // Toca o efeito sonoro
          disparoNave.start(0);

        });
      };

      request.send();
    }
    if (!CONFIG.simulationOn && !CONFIG.debug) {
      CONFIG.simulationOn = true;
      document.body.style.cursor = 'none';
    }
  }

  /** @param {number} dt deltaTime */
  update(dt) {

    let point = CONFIG.raycastPlaneOffset.clone();

    if (!this.isMobile) {

      // setup do raycaster a partir da camera
      this.raycastIntersections.length = 0;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      this.raycaster.intersectObject(this.raycastPlane, false, this.raycastIntersections);

      // interseção do raycaster, caso não exista, retorne
      let ray = this.raycastIntersections[0];
      if (!ray) return;
      point = ray.point;

    } else /* isMobile */ {
      point.x += this.joystickVector.x * this.joystickForce * 20;
      point.y += this.joystickVector.y * this.joystickForce * 20;

      // obtendo as coordenadas de tela projetando a posição do target na tela
      // raycast "reverso"
      this.pointer.copy(this.target.position).project(this.camera)
    }

    // delta da posição desde o último frame
    this.moveDelta.subVectors(point, this.target.position);

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
    this.offsettedTarget.copy(point);
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

    // Criação do projétil
    if (this.willShoot) {
      this.willShoot = false;

      let bullet = createBullet(this.object.position)
      bullet.lookAt(this.direction.clone().add(bullet.position));

      this.scene.add(bullet)
      World.playerBullets[bullet.uuid] = bullet;
    }

    // vida da nave pela cor
    this.color.g = this.health / 5;
    this.color.b = this.health / 5;
    this.object.traverse(obj => {
      if (obj.isMesh) {
        obj.material.color.copy(this.color);
      }
    })
  }
}
