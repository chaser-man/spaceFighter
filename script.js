// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Debug mode flag
const debug = false; // Set to true to show hitboxes, false to hide them

// Detect mobile devices
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Set scale factor and size multiplier
let scaleFactor = 1;
let sizeMultiplier = 1;

if (isMobileDevice()) {
  sizeMultiplier = 0.5; // Reduce the size of the rocket on mobile devices
}

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Define max difficulty score
const maxDifficultyScore = 35;

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  player.y = canvas.height - 100 * sizeMultiplier;
});

// Player properties
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2, // Start in center
  width: 40 * sizeMultiplier,
  height: 60 * sizeMultiplier,
  speed: 7,
  dx: 0,
  dy: 0, // Add vertical movement
  moving: false,

  // Function to return the hitboxes
  getHitboxes() {
    // Main body rhombus
    const topX = this.x;
    const topY = this.y;
    const bottomX = this.x;
    const bottomY = this.y + this.height;
    const leftX = this.x - this.width / 2;
    const leftY = this.y + this.height * 0.5;
    const rightX = this.x + this.width / 2;
    const rightY = this.y + this.height * 0.5;

    const rhombus = [
      { x: topX, y: topY },
      { x: leftX, y: leftY },
      { x: bottomX, y: bottomY },
      { x: rightX, y: rightY }
    ];

    // Left fin (triangle)
    const leftFin = [
      { x: this.x - this.width * 0.4, y: this.y + this.height * 0.65 },
      { x: this.x - this.width * 0.4 - this.width * 0.3, y: this.y + this.height * 0.85 },
      { x: this.x - this.width * 0.4, y: this.y + this.height * 0.85 }
    ];

    // Right fin (triangle)
    const rightFin = [
      { x: this.x + this.width * 0.4, y: this.y + this.height * 0.65 },
      { x: this.x + this.width * 0.4 + this.width * 0.3, y: this.y + this.height * 0.85 },
      { x: this.x + this.width * 0.4, y: this.y + this.height * 0.85 }
    ];

    return { rhombus, leftFin, rightFin };
  }
};

// Projectile properties
const projectile = {
  active: false,
  x: 0,
  y: 0,
  width: 5,
  height: 15,
  speed: 10,
  canShoot: true,
  cooldownTime: 1500, // 1.5 seconds
  lastShotTime: 0
};

// Game state
let score = 0;
let gameOver = false;
let obstacles = [];
let stars = [];
const maxObstacles = 5;

// Explosions array
let explosions = [];

// Chain lines array
let chainLines = [];

// Obstacle class
class Obstacle {
  constructor(x, y, size, speed, rotationSpeed) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.rotation = 0;
    this.rotationSpeed = rotationSpeed;
    this.vertices = this.createAsteroidShape();
    this.craters = this.createCraters();
    this.spots = this.createSpots();
  }

  createAsteroidShape() {
    const points = [];
    const numVertices = Math.floor(Math.random() * 5) + 7;
    for (let i = 0; i < numVertices; i++) {
      const angle = (i / numVertices) * Math.PI * 2;
      const radius = (this.size / 2) * (0.7 + Math.random() * 0.6);
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
      });
    }
    return points;
  }

  createCraters() {
    const craters = [];
    const numCraters = Math.floor(Math.random() * 3) + 2;
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
    const numSpots = Math.floor(Math.random() * 5) + 5;
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

    const gradient = ctx.createRadialGradient(
      -this.size * 0.2, -this.size * 0.2, this.size * 0.2,
      0, 0, this.size
    );
    gradient.addColorStop(0, '#6e6e6e');
    gradient.addColorStop(0.5, '#5a5a5a');
    gradient.addColorStop(1, '#3e3e3e');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let point of this.vertices) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();

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

    if (debug) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.size, this.size);
    }
  }

  update() {
    this.y += this.speed;
    this.rotation += this.rotationSpeed;
  }
}

// Star class
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

// CollisionAnimation class
class CollisionAnimation {
  constructor(ctx, x, y, radius) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.particles = [];
    this.animationDuration = 30; // frames
    this.currentFrame = 0;
  }

  createParticles() {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: this.x,
        y: this.y,
        radius: Math.random() * 3 + 1,
        color: `hsl(${Math.random() * 60 + 15}, 100%, 50%)`,
        velocity: {
          x: (Math.random() - 0.5) * 5,
          y: (Math.random() - 0.5) * 5
        },
        alpha: 1
      });
    }
  }

  update() {
    this.currentFrame++;
    if (this.currentFrame === 1) {
      this.createParticles();
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.velocity.x;
      p.y += p.velocity.y;
      p.alpha -= 1 / this.animationDuration;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        i--;
      }
    }
  }

  draw() {
    this.ctx.save();
    for (const p of this.particles) {
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  isFinished() {
    return this.currentFrame >= this.animationDuration;
  }
}

// Function to find the nearest asteroid
function findNearestAsteroid(x, y, excludedAsteroids) {
  let nearest = null;
  let minDistance = Infinity;

  for (const asteroid of obstacles) {
    if (excludedAsteroids.includes(asteroid)) continue;

    const dx = (asteroid.x + asteroid.size / 2) - x;
    const dy = (asteroid.y + asteroid.size / 2) - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = asteroid;
    }
  }

  return nearest;
}

// Chain reaction function
function triggerChainReaction(startX, startY, remainingChain = 4, hitAsteroids = []) {
  if (remainingChain <= 0) return;

  const nearest = findNearestAsteroid(startX, startY, hitAsteroids);

  if (!nearest) return;

  // Draw connecting line
  chainLines.push({
    startX: startX,
    startY: startY,
    endX: nearest.x + nearest.size / 2,
    endY: nearest.y + nearest.size / 2,
    duration: 15 // frames
  });

  // Add to hit asteroids
  hitAsteroids.push(nearest);

  // Create explosion
  explosions.push(new CollisionAnimation(ctx, nearest.x + nearest.size / 2, nearest.y + nearest.size / 2, nearest.size / 2));

  // Remove the asteroid
  obstacles = obstacles.filter(a => a !== nearest);

  // Continue chain after a brief delay
  setTimeout(() => {
    triggerChainReaction(nearest.x + nearest.size / 2, nearest.y + nearest.size / 2, remainingChain - 1, hitAsteroids);
  }, 100);
}

// Draw player function
function drawPlayer() {
  ctx.save();

  // Main body
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.bezierCurveTo(
    player.x - player.width * 0.4, player.y + player.height * 0.3,
    player.x - player.width * 0.4, player.y + player.height * 0.7,
    player.x, player.y + player.height
  );
  ctx.bezierCurveTo(
    player.x + player.width * 0.4, player.y + player.height * 0.7,
    player.x + player.width * 0.4, player.y + player.height * 0.3,
    player.x, player.y
  );

  const gradient = ctx.createLinearGradient(
    player.x - player.width / 2,
    player.y,
    player.x + player.width / 2,
    player.y
  );
  gradient.addColorStop(0, '#4a4a4a');
  gradient.addColorStop(0.5, '#ffffff');
  gradient.addColorStop(1, '#4a4a4a');

  ctx.fillStyle = gradient;
  ctx.fill();

  // Fins
  const finWidth = player.width * 0.3;
  const finHeight = player.height * 0.3;

  // Left fin
  ctx.beginPath();
  ctx.moveTo(player.x - player.width * 0.4, player.y + player.height * 0.65);
  ctx.lineTo(
    player.x - player.width * 0.4 - finWidth,
    player.y + player.height * 0.85
  );
  ctx.lineTo(player.x - player.width * 0.4, player.y + player.height * 0.85);
  ctx.closePath();
  ctx.fillStyle = '#ff4000';
  ctx.fill();

  // Right fin
  ctx.beginPath();
  ctx.moveTo(player.x + player.width * 0.4, player.y + player.height * 0.65);
  ctx.lineTo(
    player.x + player.width * 0.4 + finWidth,
    player.y + player.height * 0.85
  );
  ctx.lineTo(player.x + player.width * 0.4, player.y + player.height * 0.85);
  ctx.closePath();
  ctx.fillStyle = '#ff4000';
  ctx.fill();

  // Windows
  const windowPositions = [0.2, 0.5, 0.8];
  windowPositions.forEach((pos) => {
    ctx.beginPath();
    ctx.arc(
      player.x,
      player.y + player.height * pos,
      player.width / 6,
      0,
      Math.PI * 2
    );
    const windowGradient = ctx.createRadialGradient(
      player.x,
      player.y + player.height * pos,
      0,
      player.x,
      player.y + player.height * pos,
      player.width / 6
    );
    windowGradient.addColorStop(0, '#a7d8ff');
    windowGradient.addColorStop(1, '#004080');
    ctx.fillStyle = windowGradient;
    ctx.fill();
  });

  // Flames
  const baseFlameHeight = 30 * sizeMultiplier;
  const flameHeight = (baseFlameHeight + Math.random() * 20) * (player.dy > 0 ? 0.5 : 1);
  const flameWidth = player.width * 0.6;

  const flameGradient = ctx.createLinearGradient(
    player.x,
    player.y + player.height,
    player.x,
    player.y + player.height + flameHeight
  );
  flameGradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
  flameGradient.addColorStop(0.5, 'rgba(255, 120, 0, 1)');
  flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

  ctx.beginPath();
  ctx.moveTo(player.x - flameWidth / 2, player.y + player.height);
  ctx.quadraticCurveTo(
    player.x,
    player.y + player.height + flameHeight * 1.2,
    player.x + flameWidth / 2,
    player.y + player.height
  );
  ctx.fillStyle = flameGradient;
  ctx.fill();

  ctx.restore();

  if (debug) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;

    // Main body hitbox (rhombus)
    const topX = player.x;
    const topY = player.y;
    const bottomX = player.x;
    const bottomY = player.y + player.height;
    const leftX = player.x - player.width / 2;
    const leftY = player.y + player.height * 0.5;
    const rightX = player.x + player.width / 2;
    const rightY = player.y + player.height * 0.5;

    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(bottomX, bottomY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.stroke();

    // Left fin hitbox
    ctx.beginPath();
    ctx.moveTo(player.x - player.width * 0.4, player.y + player.height * 0.65);
    ctx.lineTo(player.x - player.width * 0.4 - player.width * 0.3, player.y + player.height * 0.85);
    ctx.lineTo(player.x - player.width * 0.4, player.y + player.height * 0.85);
    ctx.closePath();
    ctx.stroke();

    // Right fin hitbox
    ctx.beginPath();
    ctx.moveTo(player.x + player.width * 0.4, player.y + player.height * 0.65);
    ctx.lineTo(player.x + player.width * 0.4 + player.width * 0.3, player.y + player.height * 0.85);
    ctx.lineTo(player.x + player.width * 0.4, player.y + player.height * 0.85);
    ctx.closePath();
    ctx.stroke();
  }
}

// Update player position
function updatePlayer() {
  player.x += player.dx;
  player.y += player.dy;

  const finWidth = player.width * 0.4;

  // Horizontal boundaries
  if (player.x - player.width / 2 - finWidth < 0) {
    player.x = player.width / 2 + finWidth;
  }
  if (player.x + player.width / 2 + finWidth > canvas.width) {
    player.x = canvas.width - player.width / 2 - finWidth;
  }

  // Vertical boundaries
  if (player.y < 0) {
    player.y = 0;
  }
  if (player.y + player.height > canvas.height) {
    player.y = canvas.height - player.height;
  }
}

// Spawn obstacles
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
  let size = Math.random() * (50 - 30) + 30;
  const x = Math.random() * (canvas.width - size);
  const y = -size;

  const speed = Math.random() * (4 - 2) + 2 + cappedScore * 0.1;

  const rotationSpeed = (Math.random() * 0.05 - 0.025) * (1 + cappedScore / 50);

  obstacles.push(new Obstacle(x, y, size, speed, rotationSpeed));
}

// Helper function: checks if a point is inside a polygon
function isPointInPolygon(point, polygon) {
  let collision = false;
  let next = 0;
  for (let current = 0; current < polygon.length; current++) {
    next = current + 1;
    if (next == polygon.length) next = 0;

    const vc = polygon[current];
    const vn = polygon[next];

    if (
      ((vc.y >= point.y && vn.y < point.y) || (vc.y < point.y && vn.y >= point.y)) &&
      (point.x < (vn.x - vc.x) * (point.y - vc.y) / (vn.y - vc.y) + vc.x)
    ) {
      collision = !collision;
    }
  }
  return collision;
}

// Detect collision
function detectCollision(player, obstacle) {
  const hitboxes = player.getHitboxes();

  const obstacleCorners = [
    { x: obstacle.x, y: obstacle.y },
    { x: obstacle.x + obstacle.size, y: obstacle.y },
    { x: obstacle.x, y: obstacle.y + obstacle.size },
    { x: obstacle.x + obstacle.size, y: obstacle.y + obstacle.size }
  ];

  for (const corner of obstacleCorners) {
    if (
      isPointInPolygon(corner, hitboxes.rhombus) ||
      isPointInPolygon(corner, hitboxes.leftFin) ||
      isPointInPolygon(corner, hitboxes.rightFin)
    ) {
      return true;
    }
  }

  return false;
}

// Game loop
function gameLoop() {
  if (gameOver) return;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach(star => {
    star.update();
    star.draw();
  });

  updatePlayer();
  drawPlayer();
  updateProjectile();
  drawCooldownIndicator();
  drawProjectile();

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

  // Draw explosions
  explosions = explosions.filter(explosion => {
    explosion.update();
    explosion.draw();
    return !explosion.isFinished();
  });

  // Draw chain lines
  chainLines = chainLines.filter(line => {
    line.duration--;
    ctx.beginPath();
    ctx.strokeStyle = '#00ffff';
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'; // Set opacity to 0.5
    ctx.lineWidth = 2;
    ctx.moveTo(line.startX, line.startY);
    ctx.lineTo(line.endX, line.endY);
    ctx.stroke();
    return line.duration > 0;
  });

  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, 10, 30);

  requestAnimationFrame(gameLoop);
}

// Draw cooldown indicator
function drawCooldownIndicator() {
  const timeElapsed = Date.now() - projectile.lastShotTime;
  const progress = timeElapsed / projectile.cooldownTime;

  // Draw background
  ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
  ctx.fillRect(10, 40, 100, 10);

  // Draw progress bar
  ctx.fillStyle = progress >= 1 ? '#44ff44' : '#ff4444';
  ctx.fillRect(10, 40, 100 * Math.min(progress, 1), 10);
}

// Handle key down
function handleKeyDown(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    player.dx = player.speed;
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    player.dx = -player.speed;
  }
  else if (e.key === 'ArrowUp' || e.key === 'w') {
    player.dy = -player.speed;
  }
  else if (e.key === 'ArrowDown' || e.key === 's') {
    player.dy = player.speed;
  }
  else if (e.key === ' ' && projectile.canShoot) {
    shootProjectile();
  }
}

// Handle key up
function handleKeyUp(e) {
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'ArrowLeft' || e.key === 'a') {
    player.dx = 0;
  }
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'ArrowDown' || e.key === 's') {
    player.dy = 0;
  }
}

// Mobile controls
if (isMobileDevice()) {
  document.querySelector('.mobile-controls').style.display = 'block';

  const joystickOptions = {
    zone: document.getElementById('joystick-container'),
    mode: 'static',
    position: { left: '75px', bottom: '75px' },
    color: 'white',
    size: 100
  };

  const joystick = nipplejs.create(joystickOptions);

  joystick.on('move', function (evt, data) {
    const angle = data.angle.radian;
    const force = Math.min(data.force, 2) / 2;

    player.dx = Math.cos(angle) * player.speed * force;
    player.dy = -Math.sin(angle) * player.speed * force;
  });

  joystick.on('end', function () {
    player.dx = 0;
    player.dy = 0;
  });
}

// Touch swipe detection for shooting on mobile
if (isMobileDevice()) {
  let touchStartY = 0;

  canvas.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const swipeDistance = touchStartY - touchEndY;

    if (swipeDistance > 50) {
      shootProjectile();
    }
  }, { passive: false });
}

// Shoot projectile
function shootProjectile() {
  if (!projectile.canShoot || gameOver) return;

  projectile.active = true;
  projectile.x = player.x;
  projectile.y = player.y;
  projectile.canShoot = false;
  projectile.lastShotTime = Date.now();

  // Start cooldown
  setTimeout(() => {
    projectile.canShoot = true;
  }, projectile.cooldownTime);
}

// Draw projectile
function drawProjectile() {
  if (!projectile.active) return;

  ctx.fillStyle = '#ff0000';
  ctx.fillRect(projectile.x - projectile.width / 2, projectile.y, projectile.width, projectile.height);
}

// Update projectile
function updateProjectile() {
  if (!projectile.active) return;

  projectile.y -= projectile.speed;

  if (projectile.y < 0) {
    projectile.active = false;
    return;
  }

  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    if (projectile.x >= obstacle.x &&
      projectile.x <= obstacle.x + obstacle.size &&
      projectile.y >= obstacle.y &&
      projectile.y <= obstacle.y + obstacle.size) {

      projectile.active = false;

      // Start chain reaction from hit asteroid
      explosions.push(new CollisionAnimation(ctx, obstacle.x + obstacle.size / 2, obstacle.y + obstacle.size / 2, obstacle.size / 2));
      obstacles.splice(i, 1);

      // Random chain length between 2-5
      const chainLength = Math.floor(Math.random() * 4) + 2;
      triggerChainReaction(obstacle.x + obstacle.size / 2, obstacle.y + obstacle.size / 2, chainLength - 1);

      break;
    }
  }
}

// Show game over screen
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
  gameOverDiv.style.zIndex = '1000';

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

// Start game
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
