const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Player properties
const player = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  width: 30,
  height: 30,
  speed: 7,
  dx: 0
};

// Obstacle properties
class Obstacle {
  constructor(x, y, width, height, speed) {
    this.x = x;
    this.y = y; // Start below the canvas
    this.width = width;
    this.height = height;
    this.speed = speed;
  }

  // Draw obstacle
  draw() {
    ctx.fillStyle = '#f00';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // Update obstacle position
  update() {
    this.y -= this.speed;
  }
}

// Obstacle array
let obstacles = [];
let obstacleFrequency = 1500; // milliseconds
let obstacleInterval = setInterval(spawnObstacle, obstacleFrequency);

// Spawn obstacles
function spawnObstacle() {
  const obstacleWidth = Math.random() * (100 - 20) + 20;
  const obstacleHeight = 20;
  const x = Math.random() * (canvas.width - obstacleWidth);
  const y = canvas.height + obstacleHeight;
  const speed = Math.random() * (4 - 2) + 2 + score * 0.05;

  obstacles.push(new Obstacle(x, y, obstacleWidth, obstacleHeight, speed));
}

// Adjust difficulty
function adjustDifficulty() {
  clearInterval(obstacleInterval);
  obstacleFrequency = Math.max(500, 1500 - score * 10);
  obstacleInterval = setInterval(spawnObstacle, obstacleFrequency);
}

// Score
let score = 0;
let gameOver = false;

// Sounds
// const collisionSound = new Audio('collision.mp3');
// const scoreSound = new Audio('score.mp3');

// Background stars
let stars = [];

function createStars() {
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2,
      speed: Math.random() * 0.5 + 0.5
    });
  }
}

function updateStars() {
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });
}

function drawStars() {
  ctx.fillStyle = '#fff';
  stars.forEach(star => {
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
}

// Initialize stars
createStars();

// Draw player
function drawPlayer() {
  ctx.fillStyle = '#0f0';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Update player position
function updatePlayer() {
  player.x += player.dx;

  // Prevent player from going off-screen
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;
}

// Update score display
function updateScore() {
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, 10, 30);
}

// Game over handler
function gameOverHandler() {
  // collisionSound.play();
  alert('Game Over! Your score: ' + score);
  location.reload();
}

// Game loop
function gameLoop() {
  if (gameOver) {
    gameOverHandler();
    return;
  }

  // Clear the canvas
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update and draw stars
  updateStars();
  drawStars();

  // Update and draw player
  updatePlayer();
  drawPlayer();

  // Update and draw obstacles
  obstacles.forEach((obstacle, index) => {
    obstacle.update();
    obstacle.draw();

    // Remove obstacles that are off-screen
    if (obstacle.y + obstacle.height < 0) {
      obstacles.splice(index, 1);
    }

    // Check for collision
    if (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < obstacle.y + obstacle.height &&
      player.y + player.height > obstacle.y
    ) {
      gameOver = true;
    }
  });

  // Update score
  updateScore();

  requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();

// Increase score every second
setInterval(() => {
  if (!gameOver) {
    score++;
    // scoreSound.play();
    adjustDifficulty();
  }
}, 1000);

// Handle keyboard input
function keyDown(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    player.dx = player.speed;
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    player.dx = -player.speed;
  }
}

function keyUp(e) {
  if (
    e.key === 'ArrowRight' ||
    e.key === 'd' ||
    e.key === 'ArrowLeft' ||
    e.key === 'a'
  ) {
    player.dx = 0;
  }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// Touch controls
let touchX = null;

function handleTouchStart(e) {
  const touch = e.touches[0];
  touchX = touch.clientX;
}

function handleTouchMove(e) {
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchX;
  touchX = touch.clientX;
  player.x += deltaX;

  // Prevent default scrolling behavior
  e.preventDefault();
}

function handleTouchEnd(e) {
  touchX = null;
}

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);
