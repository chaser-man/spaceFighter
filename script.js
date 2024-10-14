// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Detect mobile devices
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Set scale factor and size multiplier to 1 for all devices
let scaleFactor = 1;
let sizeMultiplier = 0.5;

// Set canvas dimensions without scaling
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Adjust CSS to maintain physical size
canvas.style.width = window.innerWidth + 'px';
canvas.style.height = window.innerHeight + 'px';

// No need to scale the context since scaleFactor is 1
// ctx.scale(scaleFactor, scaleFactor);

// Define max difficulty score
const maxDifficultyScore = 35;

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  // ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
  player.y = canvas.height - 100 * sizeMultiplier;
});

// Player properties
const player = {
  x: canvas.width / 2,
  y: canvas.height - 100 * sizeMultiplier, // Changed from -70 to -100 and adjusted for sizeMultiplier
  width: 40 * sizeMultiplier,
  height: 60 * sizeMultiplier,
  speed: 7,
  dx: 0,
  moving: false
};

// Game state
let score = 0;
let gameOver = false;
let obstacles = [];
let stars = [];
const maxObstacles = 5;

class Obstacle {
  constructor(x, y, size, speed, rotationSpeed) {
    this.x = x;
    this.y = y;
    this.size = size; // Size adjusted by sizeMultiplier in spawnObstacle()
    this.speed = speed;
    this.rotation = 0;
    this.rotationSpeed = rotationSpeed;
    this.vertices = this.createAsteroidShape();
    this.craters = this.createCraters();
    this.spots = this.createSpots();
  }

  createAsteroidShape() {
    const points = [];
    const numVertices = Math.floor(Math.random() * 5) + 7; // Between 7 and 11 vertices
    for (let i = 0; i < numVertices; i++) {
      const angle = (i / numVertices) * Math.PI * 2;
      const radius = (this.size / 2) * (0.7 + Math.random() * 0.6); // Vary radius for irregular shape
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
      });
    }
    return points;
  }

  createCraters() {
    const craters = [];
    const numCraters = Math.floor(Math.random() * 3) + 2; // 2 to 4 craters
    for (let i = 0; i < numCraters; i++) {
      const craterX = (Math.random() - 0.5) * this.size * 0.6;
      const craterY = (Math.random() - 0.5) * this.size * 0.6;
      const craterRadius = this.size * 0.1 * (0.5 + Math.random() * 0.5);
      craters.push({ x: craterX, y: craterY, radius: craterRadius });
    }
    return craters;
  }

  createSpots() {
    const spots = [];
    const numSpots = Math.floor(Math.random() * 5) + 5; // 5 to 9 spots
    for (let i = 0; i < numSpots; i++) {
      const spotX = (Math.random() - 0.5) * this.size * 0.8;
      const spotY = (Math.random() - 0.5) * this.size * 0.8;
      const spotRadius = this.size * 0.02 * (0.5 + Math.random() * 0.5);
      spots.push({ x: spotX, y: spotY, radius: spotRadius });
    }
    return spots;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
    ctx.rotate(this.rotation);

    // Create gradient for asteroid to simulate light source
    const gradient = ctx.createRadialGradient(
      -this.size * 0.2, -this.size * 0.2, this.size * 0.2,
      0, 0, this.size
    );
    gradient.addColorStop(0, '#6e6e6e'); // Lighter area
    gradient.addColorStop(0.5, '#5a5a5a');
    gradient.addColorStop(1, '#3e3e3e'); // Darker area

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let point of this.vertices) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw craters
    for (let crater of this.craters) {
      ctx.beginPath();
      ctx.arc(crater.x, crater.y, crater.radius, 0, Math.PI * 2);
      const craterGradient = ctx.createRadialGradient(
        crater.x - crater.radius * 0.3, crater.y - crater.radius * 0.3, crater.radius * 0.1,
        crater.x, crater.y, crater.radius
      );
      craterGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      craterGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = craterGradient;
      ctx.fill();
    }

    // Add surface spots
    for (let spot of this.spots) {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fill();
    }

    ctx.strokeStyle = '#2C2C2C';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  update() {
    this.y += this.speed;
    this.rotation += this.rotationSpeed;
  }
}

class Star {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2;
    this.speed = Math.random() * 0.5 + 0.5;
    this.twinkle = Math.random() * 5 + 5;
  }

  update() {
    this.y += this.speed;
    if (this.y > canvas.height) {
      this.y = 0;
      this.x = Math.random() * canvas.width;
    }
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = Math.abs(Math.sin(Date.now() / 1000 * this.twinkle));
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

function createStars() {
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push(new Star());
  }
}

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
    ctx.arc(player.x, player.y + player.height * pos, (player.width / 6), 0, Math.PI * 2);
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
  const flameHeight = (30 + Math.random() * 20) * sizeMultiplier;
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

function updatePlayer() {
  player.x += player.dx;

  const finWidth = player.width * 0.4;

  const leftBoundary = player.x - player.width / 2 - finWidth;
  const rightBoundary = player.x + player.width / 2 + finWidth;

  if (leftBoundary < 0) {
    player.x = player.width / 2 + finWidth;
  }
  if (rightBoundary > canvas.width) {
    player.x = canvas.width - player.width / 2 - finWidth;
  }
}

function spawnObstacles() {
  if (gameOver) return;

  const cappedScore = Math.min(score, maxDifficultyScore);

  const numObstacles = Math.min(1 + Math.floor(cappedScore / 10), maxObstacles);

  for (let i = 0; i < numObstacles; i++) {
    spawnObstacle(cappedScore);
  }

  const spawnDelay = Math.max(300, 1000 - cappedScore * 20);

  setTimeout(spawnObstacles, spawnDelay);
}

function spawnObstacle(cappedScore) {
  const size = (Math.random() * (50 - 30) + 30) * sizeMultiplier;
  const x = Math.random() * (canvas.width - size);
  const y = -size;

  const speed = Math.random() * (4 - 2) + 2 + cappedScore * 0.1;

  const rotationSpeed = (Math.random() * 0.05 - 0.025) * (1 + cappedScore / 50);

  obstacles.push(new Obstacle(x, y, size, speed, rotationSpeed));
}

function detectCollision(player, obstacle) {
  const obstacleBox = {
    x: obstacle.x,
    y: obstacle.y,
    width: obstacle.size,
    height: obstacle.size
  };

  const playerHitboxes = [
    {
      x: player.x - player.width / 2,
      y: player.y,
      width: player.width,
      height: player.height
    },
    {
      x: player.x - player.width / 2 - player.width * 0.4,
      y: player.y + player.height * 0.7,
      width: player.width * 0.4,
      height: player.height * 0.3
    },
    {
      x: player.x + player.width / 2,
      y: player.y + player.height * 0.7,
      width: player.width * 0.4,
      height: player.height * 0.3
    }
  ];

  for (let hitbox of playerHitboxes) {
    if (
      hitbox.x < obstacleBox.x + obstacleBox.width &&
      hitbox.x + hitbox.width > obstacleBox.x &&
      hitbox.y < obstacleBox.y + obstacleBox.height &&
      hitbox.y + hitbox.height > obstacleBox.y
    ) {
      return true;
    }
  }
  return false;
}

function gameLoop() {
  if (gameOver) return;

  // Fill the background with black
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach(star => {
    star.update();
    star.draw();
  });

  updatePlayer();
  drawPlayer();

  obstacles = obstacles.filter(obstacle => {
    obstacle.update();
    obstacle.draw();

    if (obstacle.y - obstacle.size > canvas.height) {
      return false;
    }

    if (detectCollision(player, obstacle)) {
      gameOver = true;
      showGameOver();
      return false;
    }

    return true;
  });

  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, 10, 30);

  requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    player.dx = player.speed;
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    player.dx = -player.speed;
  }
}

function handleKeyUp(e) {
  if (
    e.key === 'ArrowRight' ||
    e.key === 'd' ||
    e.key === 'ArrowLeft' ||
    e.key === 'a'
  ) {
    player.dx = 0;
  }
}

// Add event listeners for mobile control buttons
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

if (isMobileDevice()) {
  leftButton.addEventListener('touchstart', () => { player.dx = -player.speed; });
  leftButton.addEventListener('touchend', () => { player.dx = 0; });
  rightButton.addEventListener('touchstart', () => { player.dx = player.speed; });
  rightButton.addEventListener('touchend', () => { player.dx = 0; });

  leftButton.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  rightButton.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}

function showGameOver() {
  const gameOverDiv = document.createElement('div');
  gameOverDiv.style.position = 'absolute';
  gameOverDiv.style.top = '50%';
  gameOverDiv.style.left = '50%';
  gameOverDiv.style.transform = 'translate(-50%, -50%)';
  gameOverDiv.style.backgroundColor = 'white';
  gameOverDiv.style.padding = '20px';
  gameOverDiv.style.borderRadius = '10px';
  gameOverDiv.style.textAlign = 'center';
  gameOverDiv.style.color = 'black';

  gameOverDiv.innerHTML = `
    <h2 style="font-size: 24px; margin-bottom: 10px;">Game Over</h2>
    <p style="font-size: 18px; margin-bottom: 20px;">Your score: ${score}</p>
    <button id="playAgain" style="
      padding: 10px 20px;
      font-size: 16px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
    ">Play Again</button>
  `;

  document.body.appendChild(gameOverDiv);

  const playAgainButton = document.getElementById('playAgain');
  playAgainButton.addEventListener('click', () => {
    location.reload();
  });
}

function startGame() {
  createStars();
  spawnObstacles();

  const scoreInterval = setInterval(() => {
    if (!gameOver) {
      score++;
    } else {
      clearInterval(scoreInterval);
    }
  }, 1000);

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  gameLoop();
}

startGame();
