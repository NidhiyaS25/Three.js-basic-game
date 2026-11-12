import * as THREE from 'three';

// 1. Scene, Camera, and Renderer Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 2. Ground
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshBasicMaterial({
  color: 0xf00fff,
  side: THREE.DoubleSide,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -1, 0);
scene.add(ground);

// 3. Player
const playerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 20);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0, 6);
scene.add(player);

// 4. Collectible Coins (Spheres)
function createCoin(x, z) {
  const geo = new THREE.SphereGeometry(0.5, 20, 20);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const coin = new THREE.Mesh(geo, mat);
  coin.position.set(x, 0, z);
  scene.add(coin);
  return { mesh: coin, box: new THREE.Box3() };
}

const coins = [
  createCoin(-4, -1.5),
  createCoin(0, 0),
  createCoin(2.5, 2.3),
];

// 5. Enemies (Red Boxes)
function createEnemy(x, z) {
  const geo = new THREE.BoxGeometry();
  const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const enemy = new THREE.Mesh(geo, mat);
  enemy.position.set(x, 0, z);
  scene.add(enemy);
  return { mesh: enemy, box: new THREE.Box3() };
}

const enemies = [
  createEnemy(-3.5, 2.5),
  createEnemy(0.9, -4),
  createEnemy(2.5, -2.5),
];

// 6. Camera Position
camera.position.set(0, 7, 12);
camera.lookAt(0, 0, 0);

// 7. DOM Elements & Game State
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const endScreen = document.getElementById('endScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const healthText = document.getElementById('health');
const scoreText = document.getElementById('score');
const finalScoreText = document.getElementById('finalScore');

const playerBox = new THREE.Box3();
let playerHealth = 50;
let playerScore = 0;
let isGameRunning = false;
let damageCooldown = false;

// 8. Controls
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

function movePlayer() {
  const speed = 0.12;
  const limit = 9.5; // Keep player on the 20x20 platform

  if ((keys['ArrowUp'] || keys['w'] || keys['W']) && player.position.z > -limit) {
    player.position.z -= speed;
  }
  if ((keys['ArrowDown'] || keys['s'] || keys['S']) && player.position.z < limit) {
    player.position.z += speed;
  }
  if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && player.position.x > -limit) {
    player.position.x -= speed;
  }
  if ((keys['ArrowRight'] || keys['d'] || keys['D']) && player.position.x < limit) {
    player.position.x += speed;
  }
}

// 9. Game Flow Functions
function updateUI() {
  healthText.innerText = `Health: ${playerHealth}`;
  scoreText.innerText = `Score: ${playerScore}`;
}

function startGame() {
  playerHealth = 50;
  playerScore = 0;
  isGameRunning = true;
  damageCooldown = false;

  player.position.set(0, 0, 6);
  updateUI();

  startScreen.hidden = true;
  endScreen.hidden = true;
  gameScreen.hidden = false;
}

function endGame() {
  isGameRunning = false;
  finalScoreText.innerText = `Final Score: ${playerScore}`;
  gameScreen.hidden = true;
  endScreen.hidden = false;
}

function handleDamage() {
  if (damageCooldown) return;

  playerHealth -= 10;
  updateUI();

  if (playerHealth <= 0) {
    endGame();
    return;
  }

  damageCooldown = true;
  setTimeout(() => {
    damageCooldown = false;
  }, 600);
}

function relocateCoin(coinObj) {
  const randomX = (Math.random() - 0.5) * 16;
  const randomZ = (Math.random() - 0.5) * 16;
  coinObj.mesh.position.set(randomX, 0, randomZ);
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// 10. Main Animation Loop
function animate(time) {
  // Rotate coins continuously
  coins.forEach((coinObj) => {
    coinObj.mesh.rotation.y = time / 1000;
  });

  if (isGameRunning) {
    movePlayer();
    playerBox.setFromObject(player);

    // Check Coin Collisions
    coins.forEach((coinObj) => {
      coinObj.box.setFromObject(coinObj.mesh);
      if (playerBox.intersectsBox(coinObj.box)) {
        playerScore += 10;
        updateUI();
        relocateCoin(coinObj);
      }
    });

    // Check Enemy Collisions
    enemies.forEach((enemyObj) => {
      enemyObj.box.setFromObject(enemyObj.mesh);
      if (playerBox.intersectsBox(enemyObj.box)) {
        handleDamage();
      }
    });
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
