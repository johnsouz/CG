import * as THREE from 'three';
import { MathUtils } from 'three';
import { createTree } from './meshGenerators.js';
import { CONFIG } from './utils.js';

export class ZTranslater {
  /**
   * @deprecated
   * @param {number} from Posição inicial do objeto (No eixo Z)
   * @param {number} to Posição final do objeto (No eixo Z)
   * @param {number} speed Número de unidades somada a coordenada Z a cada chamada de {@link ZTranslater.update}
   * @param {?THREE.Mesh} mesh O objeto a ser movido. Se `undefined`, utiliza-se {@link createTree} como mesh
   */
  constructor(from, to = 0, speed = 1, mesh) {
    this.from = from;
    this.to = to;
    this.speed = speed;

    if (mesh instanceof THREE.Mesh) {
      this.mesh = mesh;
    } else {
      this.mesh = createTree();
      this.mesh.material.transparent = true;

      // inicializa as posições, escalas e rotações com valores aleatorios dentro do dominio
      this.mesh.position.set(
        MathUtils.randInt(-CONFIG.treeDistribution, CONFIG.treeDistribution),
        CONFIG.treeVerticalOffset,
        MathUtils.randInt(to, from)
      );

      this.mesh.rotation.y = Math.PI * Math.random();
      this.mesh.scale.setScalar(MathUtils.randInt(CONFIG.treeScaleMin, CONFIG.treeScaleMax));
    }
  }

  /**
   * - Avança {@link ZTranslater.speed } unidades no eixo Z
   * - Contem a coordenada entre {@link ZTranslater.from } e {@link ZTranslater.to }
   *   - Caso ultrapasse {@link ZTranslater.to } volte a {@link ZTranslater.from }
   */
  update(dt) {
    let pos = this.mesh.position;

    pos.z += this.speed * dt;
    if (pos.z >= this.to)
      pos.z += (this.from - this.to);

    let opacity = MathUtils.mapLinear(pos.z, CONFIG.fogFadeFar, CONFIG.fogFadeNear, 0, 1);
    this.mesh.traverse(obj => {
      if (obj.isMesh || obj.isLine)
        obj.material.opacity = opacity;
    });
  }
}

export class Translater {
  /**
   * 
   * @param {THREE.Vector3} direction 
   * @param {THREE.Object3D} object 
   * @param {number} speed
   * @param {number} distance
   * @param {?function(this: Translater): void} customUpdate
   * @param {?THREE.Vector3} startPoint 
   */
  constructor(direction, object, speed, distance, customUpdate, startPoint) {
    this.direction = direction.normalize();
    this.object = object;
    this.speed = speed;
    this.distance = distance;
    this.customUpdate = customUpdate;
    this.startPoint = startPoint ?? object.position.clone();
  }

  // vetor para realização de operações com vetores
  #deltaPos = new THREE.Vector3();
  update(dt) {
    // deltaPos <- a distancia em que o objeto se move em 1 frame
    this.#deltaPos
      .copy(this.direction)
      .multiplyScalar(this.speed * dt);

    this.object.position
      .add(this.#deltaPos)

    // deltaPos <- a distancia entre `startPoint` e `object.position`
    this.#deltaPos
      .subVectors(this.object.position, this.startPoint)

    // se a distancia entre o `startPoint` e `object` for maior que `distance`
    // o objeto volta para `startPoint`
    let traveled = this.#deltaPos.length();
    if (traveled > this.distance) {
      this.object.position
        .copy(this.direction)
        .multiplyScalar(traveled - this.distance)
        .add(this.startPoint);
    }

    if (this.customUpdate)
      this.customUpdate(this);
  }
}

/** @param {Translater} t */
export let opacityFog = (t) => {
  let opacity = MathUtils.mapLinear(t.object.position.z, CONFIG.fogFadeFar, CONFIG.fogFadeNear, 0, 1);
  t.object.traverse(obj => {
    if (obj.isMesh || obj.isLine)
      obj.material.opacity = opacity;
  });
}