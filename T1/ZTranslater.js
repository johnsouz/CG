import * as THREE from 'three';
import { MathUtils } from 'three';
import { createTree } from './meshGenerators.js';
import { CONFIG } from './config.js';

let rand = (min, max) =>
  Math.random() * (max - min) + min;

export class ZTranslater {
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
      this.mesh = createTree();
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

    let opacity = MathUtils.mapLinear(pos.z, CONFIG.fogFadeFar, CONFIG.fogFadeNear, 0, 1);
    this.mesh.traverse(obj => {
      if (obj.isMesh || obj.isLine)
        obj.material.opacity = opacity;
    });
  }
}
