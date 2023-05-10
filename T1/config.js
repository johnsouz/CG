import { Vector3 } from "three";

export const CONFIG = {
  debug: true,
  cameraPos: new Vector3(0, 0, 50),

  treePosFrom: -1000,
  treePosTo: 100,
  treeVerticalOffset: -40,

  fogFadeFar: -950,
  fogFadeNear: -800,

  speed: 500,

  treeCount: 300,
  treeDistribution: 300,
  treeScaleMin: 1.8,
  treeScaleMax: 2,

  planeCount: 10,
  planeWidth: 1000,
  planeHeight: 100,
  planeVerticalOffset: -50,
};

export let vectorToString = (vec) => {
  let ret = []

  for (let prop of ['x', 'y', 'z', 'w']) {
    if (prop in vec) {
      ret.push(vec[prop].toFixed(2));
    }
  }

  return '[' + ret.join(', ') + ']';
}

/**
 * @param {any} obj 
 * @param {string[]} props 
 * @param {string?} label
 */
export let sprintProps = (obj, props, label) => {
  let ret = [];

  for (let prop of props)
    ret.push((label ?? prop).padEnd(12, ' ') + vectorToString(obj[prop]) + '\n');

  return ret.join('')
}