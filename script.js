// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Keep the player at the bottom after resizing
  player.y = canvas.height - player.height - 10;
});

// Player properties
const player = {
  x: canvas.width / 2,
  y: canvas.height - 70, // Adjusted to accommodate the new player height
  width: 40,
  height: 60,
  speed: 7,
  dx: 0
};

// Maximum number of obstacles that can be spawned at once
const maxObstacles = 5;

// Obstacle class
class Obstacle {
  constructor(x, y, size, speed) {
    this.x = x;
    this.y = y; // Start at or above the top of the canvas
    this.size = size;
    this.speed = speed;
    this.vertices = this.createAsteroidShape();
  }

  // Create an irregular shape for the asteroid
  createAsteroidShape() {
    const points = [];
    const numVertices = Math.floor(Math.random() * 5) + 5; // Between 5 and 10 vertices
    for (let i = 0; i < numVertices; i++) {
      const angle = (i / numVertices) * Math.PI * 2;
      const radius = this.size / 2 + Math.random() * this.size / 2;
      points.push({
        x: this.x + this.size / 2 + radius * Math.cos(angle),
        y: this.y + this.size / 2 + radius * Math.sin(angle)
      });
    }
    return points;
  }

  // Draw asteroid
  draw() {
    ctx.save();
    ctx.fillStyle = '#888'; // Gray color for asteroid
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let point of this.vertices) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Update asteroid position
  update() {
    this.y += this.speed; // Move downwards
    // Update vertices positions
    this.vertices.forEach(point => {
      point.y += this.speed;
    });
  }
}

// Obstacle array
let obstacles = [];

// Score and game state
let score = 0;
let gameOver = false;

// Background stars
let stars = [];

// Create stars for the background
function createStars() {
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2,
      speed: Math.random() * 0.5 + 0.5,
      twinkle: Math.random() * 5 + 5
    });
  }
}

// Update and draw stars
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
    ctx.globalAlpha = Math.abs(Math.sin(Date.now() / 1000 * star.twinkle));
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
  ctx.globalAlpha = 1; // Reset alpha
}

// Spawn obstacles with variable delay and quantity
function spawnObstacleWithDelay() {
  if (gameOver) return; // Stop spawning if the game is over

  // Calculate the number of obstacles to spawn based on score
  const numObstacles = Math.min(1 + Math.floor(score / 10), maxObstacles);

  // Spawn multiple obstacles
  for (let i = 0; i < numObstacles; i++) {
    spawnObstacle();
  }

  // Calculate the next obstacle delay based on score
  const delay = Math.max(300, 1000 - score * 20);

  // Schedule the next obstacle spawn
  setTimeout(spawnObstacleWithDelay, delay);
}

// Spawn a single obstacle
function spawnObstacle() {
  const size = Math.random() * (50 - 30) + 30; // Asteroid size between 30 and 50
  const x = Math.random() * (canvas.width - size);
  const y = -size; // Start above the canvas

  // Increase obstacle speed more aggressively as score increases
  const speed = Math.random() * (4 - 2) + 2 + score * 0.1;

  obstacles.push(new Obstacle(x, y, size, speed));
}

// Draw the player as a rocket ship
function drawPlayer() {
  ctx.save();

  // Main body
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.bezierCurveTo(
    player.x - player.width / 2, player.y + player.height * 0.3,
    player.x - player.width / 2, player.y + player.height * 0.7,
    player.x, player.y + player.height
  );
  ctx.bezierCurveTo(
    player.x + player.width / 2, player.y + player.height * 0.7,
    player.x + player.width / 2, player.y + player.height * 0.3,
    player.x, player.y
  );

  const gradient = ctx.createLinearGradient(player.x - player.width / 2, player.y, player.x + player.width / 2, player.y);
  gradient.addColorStop(0, '#4a4a4a');
  gradient.addColorStop(0.5, '#ffffff');
  gradient.addColorStop(1, '#4a4a4a');

  ctx.fillStyle = gradient;
  ctx.fill();

  // Windows
  const windowPositions = [0.2, 0.5, 0.8];
  windowPositions.forEach(pos => {
    ctx.beginPath();
    ctx.arc(player.x, player.y + player.height * pos, player.width / 6, 0, Math.PI * 2);
    const windowGradient = ctx.createRadialGradient(
      player.x, player.y + player.height * pos, 0,
      player.x, player.y + player.height * pos, player.width / 6
    );
    windowGradient.addColorStop(0, '#a7d8ff');
    windowGradient.addColorStop(1, '#004080');
    ctx.fillStyle = windowGradient;
    ctx.fill();
  });

  // Fins
  const finWidth = player.width * 0.4;
  const finHeight = player.height * 0.3;

  // Left fin
  ctx.beginPath();
  ctx.moveTo(player.x - player.width / 2, player.y + player.height * 0.7);
  ctx.lineTo(player.x - player.width / 2 - finWidth, player.y + player.height);
  ctx.lineTo(player.x - player.width / 2, player.y + player.height);
  ctx.closePath();
  ctx.fillStyle = '#ff4000';
  ctx.fill();

  // Right fin
  ctx.beginPath();
  ctx.moveTo(player.x + player.width / 2, player.y + player.height * 0.7);
  ctx.lineTo(player.x + player.width / 2 + finWidth, player.y + player.height);
  ctx.lineTo(player.x + player.width / 2, player.y + player.height);
  ctx.closePath();
  ctx.fillStyle = '#ff4000';
  ctx.fill();

  // Flames
  const flameHeight = 30 + Math.random() * 20;
  const flameWidth = player.width * 0.6;

  const flameGradient = ctx.createLinearGradient(
    player.x, player.y + player.height,
    player.x, player.y + player.height + flameHeight
  );
  flameGradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
  flameGradient.addColorStop(0.5, 'rgba(255, 120, 0, 1)');
  flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

  ctx.beginPath();
  ctx.moveTo(player.x - flameWidth / 2, player.y + player.height);
  ctx.quadraticCurveTo(
    player.x, player.y + player.height + flameHeight * 1.2,
    player.x + flameWidth / 2, player.y + player.height
  );
  ctx.fillStyle = flameGradient;
  ctx.fill();

  ctx.restore();
}

// Update player position
function updatePlayer() {
  player.x += player.dx;

  const finWidth = player.width * 0.4;

  // Prevent player from going off-screen
  const leftBoundary = player.x - player.width / 2 - finWidth;
  const rightBoundary = player.x + player.width / 2 + finWidth;

  if (leftBoundary < 0) {
    player.x = player.width / 2 + finWidth;
  }
  if (rightBoundary > canvas.width) {
    player.x = canvas.width - player.width / 2 - finWidth;
  }
}

// Update and draw obstacles
function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.update();
    obstacle.draw();

    // Remove obstacles that are off-screen
    if (obstacle.y - obstacle.size > canvas.height) {
      obstacles.splice(i, 1);
      continue;
    }

    // Check for collision with player
    if (detectCollision(player, obstacle)) {
      gameOver = true;
      break;
    }
  }
}

// Collision detection functions
function detectCollision(player, obstacle) {
  // Get obstacle bounding box
  const obstacleBox = {
    x: obstacle.x,
    y: obstacle.y,
    width: obstacle.size,
    height: obstacle.size
  };

  // Get player hitboxes
  const playerHitboxes = getPlayerHitboxes();

  // Check for collision with each hitbox
  for (let hitbox of playerHitboxes) {
    if (rectIntersect(hitbox, obstacleBox)) {
      return true; // Collision detected
    }
  }
  return false; // No collision
}

function getPlayerHitboxes() {
  const finWidth = player.width * 0.4;
  const finHeight = player.height * 0.3;

  // Main body hitbox
  const mainBodyHitbox = {
    x: player.x - player.width / 2,
    y: player.y,
    width: player.width,
    height: player.height
  };

  // Left fin hitbox
  const leftFinHitbox = {
    x: player.x - player.width / 2 - finWidth,
    y: player.y + player.height * 0.7,
    width: finWidth,
    height: finHeight
  };

  // Right fin hitbox
  const rightFinHitbox = {
    x: player.x + player.width / 2,
    y: player.y + player.height * 0.7,
    width: finWidth,
    height: finHeight
  };

  return [mainBodyHitbox, leftFinHitbox, rightFinHitbox];
}

function rectIntersect(rect1, rect2) {
  return !(
    rect1.x > rect2.x + rect2.width ||
    rect1.x + rect1.width < rect2.x ||
    rect1.y > rect2.y + rect2.height ||
    rect1.y + rect1.height < rect2.y
  );
}

// Update the score display
function updateScore() {
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, 10, 30);
}

// Game over handler
function gameOverHandler() {
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background stars
  updateStars();
  drawStars();

  // Update and draw player
  updatePlayer();
  drawPlayer();

  // Update and draw obstacles
  updateObstacles();

  // Update score display
  updateScore();

  requestAnimationFrame(gameLoop);
}

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

// Start the game
function startGame() {
  createStars();

  // Start spawning obstacles
  spawnObstacleWithDelay();

  // Increase score every second
  setInterval(() => {
    if (!gameOver) {
      score++;
    }
  }, 1000);

  gameLoop();
}

startGame();
