import * as THREE from "three";

export const World = {

  /** @type {Object.<string, THREE.Mesh>} */
  turrets: {},

  /** @type {Object.<string, THREE.Mesh>} */
  playerBullets: {},

  /** @type {Object.<string, THREE.Mesh>} */
  enemyBullets: {}
};

export const AudioResources = {
  listener: new THREE.AudioListener(),

  /** @type {AudioBuffer} */
  blaster: undefined,
  /** @type {AudioBuffer} */
  background: undefined,
};

let audioMap = [
  'The last battle.mp3', 'background',
  'X-wing blaster.mp3', 'blaster'
]

let aloader = new THREE.AudioLoader()
for (let i = 0; i < audioMap.length; i += 2) {
  let filename = audioMap[i];
  let propriety = audioMap[i+1];

  aloader.load(filename, buffer => {
    AudioResources[propriety] = buffer;
  })
}