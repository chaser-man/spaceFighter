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
  shield: false,
  rapidFire: false,
  magnet: false,
  invincible: false, // Adds invincibility frames

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

// Powerups array
let powerups = [];

// Add these variables to your global scope
let shieldEndTime = 0;
const shieldDuration = 10000; // 10 seconds
const shieldWarningTime = 3000; // Start flashing 3 seconds before end

// Replace the single projectile object with an array of projectiles
let projectiles = [];

// Obstacle class
class Obstacle {
  constructor(x, y, size, speed, rotationSpeed) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.dx = 0; // Add horizontal speed
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
    this.x += this.dx; // Update x position
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

// Powerup class
class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.type = type;
    this.speed = 2;
    this.rotation = 0;
  }

  update() {
    this.y += this.speed;
    this.rotation += 0.05;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    this.drawOuterCircle();
    this.drawInnerShape();

    ctx.restore();
  }

  drawOuterCircle() {
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);

    if (this.type === 'shield') {
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(0, 150, 255, 0.4)');
    } else if (this.type === 'rapidFire') {
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0.4)');
    }

    ctx.fillStyle = gradient;
    ctx.fill();
  }

  drawInnerShape() {
    if (this.type === 'shield') {
      this.drawShieldShape();
    } else if (this.type === 'rapidFire') {
      this.drawLightningBolt();
    }
  }

  drawShieldShape() {
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.quadraticCurveTo(this.width / 2, -this.height / 4, this.width / 3, this.height / 4);
    ctx.lineTo(0, this.height / 2);
    ctx.lineTo(-this.width / 3, this.height / 4);
    ctx.quadraticCurveTo(-this.width / 2, -this.height / 4, 0, -this.height / 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200, 255, 255, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawLightningBolt() {
    ctx.beginPath();
    ctx.moveTo(-this.width / 6, -this.height / 3);
    ctx.lineTo(this.width / 6, 0);
    ctx.lineTo(-this.width / 6, 0);
    ctx.lineTo(this.width / 6, this.height / 3);
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
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

  // Increment score for chain reaction hit
  score++;

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

  // Make player blink when invincible
  if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
    return; // Skip drawing this frame without restoring early
  }

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

  ctx.restore();
  
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

  // Draw shield if active
  if (player.shield) {
    const timeLeft = shieldEndTime - Date.now();
    if (timeLeft <= shieldWarningTime) {
      // Flash the shield
      if (Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.beginPath();
        ctx.arc(player.x, player.y + player.height / 2, player.width * 0.75, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.lineWidth = 5;
        ctx.stroke();
      } 
    }
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

let spawnInterval = null; // Add this variable to track the spawn interval
let powerupInterval = null; // Add this variable to track powerup spawns

function spawnObstacles() {
  // Clear any existing spawn interval
  if (spawnInterval) {
    clearTimeout(spawnInterval);
    spawnInterval = null;
  }

  if (gameOver) return;

  const cappedScore = Math.min(score, maxDifficultyScore);

  // Only spawn obstacles if the boss is not active
  if (!(currentBoss && currentBoss.active)) {
    const numObstacles = Math.min(1 + Math.floor(cappedScore / 10), maxObstacles);

    for (let i = 0; i < numObstacles; i++) {
      spawnObstacle(cappedScore);
    }

    // Only set up next spawn if boss isn't active
    const spawnDelay = Math.max(300, 1000 - cappedScore * 20);
    spawnInterval = setTimeout(spawnObstacles, spawnDelay);
  }
}

// Separate function for powerup spawning
function spawnPowerups() {
  if (gameOver) return;

  // Spawn powerups with a 10% chance (reduced from 20%)
  if (Math.random() < 0.1) {
    const powerupTypes = ['shield', 'rapidFire'];
    const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    const x = Math.random() * (canvas.width - 30);
    powerups.push(new Powerup(x, -30, randomType));
  }

  // Set up next powerup spawn
  powerupInterval = setTimeout(spawnPowerups, 1000); // Check every second
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

// Add boss class
class Boss {
  constructor() {
    this.width = 150;
    this.height = 150;
    this.size = 150; // Added for consistency with Obstacle class
    this.x = canvas.width / 2 - this.width / 2;
    this.y = -this.height;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 2;
    this.phase = 'entering';
    this.phaseTimer = 0;
    this.active = true;
    this.rotation = 0;
    this.rotationSpeed = 0.005;
    this.streamTimer = 0;
    this.isStreaming = false;
    this.damageTaken = 0; // Track damage for healing
    this.teleportCooldown = 1500; // 1.5 seconds between teleports
    this.lastTeleportTime = 0;
    this.fastShotChance = 0.1; // 10% chance for fast shot during regular attacks
    this.opacity = 1; // Added for fade-in/fade-out animation

    // Generate asteroid-like shape
    this.vertices = this.createAsteroidShape();
    this.craters = this.createCraters();
    this.spots = this.createSpots();

    this.attackPatterns = [
      'spiral', // Shoots asteroids in a spiral pattern
      'burst',  // Rapid burst of asteroids in player's direction
      'cross'   // Cross-shaped pattern of asteroids
    ];
    this.currentPattern = 'spiral';
  }

  // Copy asteroid shape generation methods from Obstacle class
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
    const numCraters = Math.floor(Math.random() * 5) + 4; // More craters than regular asteroids
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
    const numSpots = Math.floor(Math.random() * 7) + 8; // More spots than regular asteroids
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
    ctx.globalAlpha = this.opacity; // Apply opacity for fade-in/fade-out animation

    // Create red-hued gradient
    const gradient = ctx.createRadialGradient(
      -this.size * 0.2, -this.size * 0.2, this.size * 0.2,
      0, 0, this.size
    );
    gradient.addColorStop(0, '#ff4444');
    gradient.addColorStop(0.5, '#cc0000');
    gradient.addColorStop(1, '#800000');

    // Draw main body
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let point of this.vertices) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw craters with red hues
    for (let crater of this.craters) {
      ctx.beginPath();
      ctx.arc(crater.x, crater.y, crater.radius, 0, Math.PI * 2);
      const craterGradient = ctx.createRadialGradient(
        crater.x - crater.radius * 0.3, crater.y - crater.radius * 0.3, crater.radius * 0.1,
        crater.x, crater.y, crater.radius
      );
      craterGradient.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
      craterGradient.addColorStop(1, 'rgba(100, 0, 0, 0.2)');
      ctx.fillStyle = craterGradient;
      ctx.fill();
    }

    // Draw spots with darker red
    for (let spot of this.spots) {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 0, 0, 0.3)';
      ctx.fill();
    }

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Draw health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthBarX = (canvas.width - healthBarWidth) / 2;
    const healthBarY = 50;

    ctx.fillStyle = '#333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    ctx.fillStyle = '#ff0000';
    const currentHealthWidth = (this.health / this.maxHealth) * healthBarWidth;
    ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  }

  update() {
    this.rotation += this.rotationSpeed;

    // Handle streaming attack if active
    if (this.isStreaming) {
      this.streamTimer--;
      if (this.streamTimer % 5 === 0) { // Fire every 5 frames for dense pattern
        this.shootStreamPattern();
      }
      if (this.streamTimer <= 0) {
        this.isStreaming = false;
      }
    }

    switch (this.phase) {
      case 'entering':
        if (this.y < 50) {
          this.y += this.speed;
        } else {
          this.phase = 'phase1';
          this.phaseTimer = 120;
        }
        break;

      case 'phase1':
        this.x += Math.sin(Date.now() / 1000) * 3;
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

        if (this.phaseTimer % 50 === 0) {
          if (Math.random() < this.fastShotChance) {
            this.shootFastShot();
          } else if (Math.random() < 0.2 && !this.isStreaming) {
            this.isStreaming = true;
            this.streamTimer = 75;
          } else {
            this.shootPattern1();
          }
        }

        this.phaseTimer--;
        if (this.phaseTimer <= 0) {
          this.phase = 'resting';
          this.phaseTimer = 60;
        }
        break;

      case 'phase2':
        this.x += Math.cos(Date.now() / 500) * 5;
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

        if (this.phaseTimer % 30 === 0) {
          if (Math.random() < this.fastShotChance) {
            this.shootFastShot();
          } else if (Math.random() < 0.3 && !this.isStreaming) {
            this.isStreaming = true;
            this.streamTimer = 75;
          } else {
            this.shootPattern2();
          }
        }

        this.phaseTimer--;
        if (this.phaseTimer <= 0) {
          this.phase = 'resting';
          this.phaseTimer = 60;
        }
        break;

      case 'resting':
        if (this.damageTaken > 0) {
          // Heal 25% of damage taken
          const healAmount = Math.ceil(this.damageTaken * 0.25);
          this.heal(healAmount);
          this.damageTaken = 0; // Reset damage tracker
        }
        
        this.phaseTimer--;
        if (this.phaseTimer <= 0) {
          this.phase = this.health > this.maxHealth / 2 ? 'phase1' : 'phase2';
          this.phaseTimer = 120;
        }
        break;
    }

    // Check for player proximity
    const distanceToPlayer = Math.hypot(
      (player.x - this.x - this.width/2),
      (player.y - this.y - this.height/2)
    );

    const canTeleport = Date.now() - this.lastTeleportTime >= this.teleportCooldown;
    
    // Always teleport when player gets too close (if cooldown allows)
    if (distanceToPlayer < 150 && canTeleport) {
      this.teleport();
    }
  }

  shootStreamPattern() {
    const asteroidSize = 25;
    const spacing = asteroidSize + 10; // Increase spacing between asteroids
    
    // Create three parallel streams
    for (let i = -1; i <= 1; i++) {
      const offset = i * spacing * 2;
      
      obstacles.push(new Obstacle(
        this.x + this.width / 2 + offset,
        this.y + this.height,
        asteroidSize,
        4,
        0.02
      ));
      
      obstacles[obstacles.length - 1].dx = offset * 0.05;
    }
  }

  shootPattern1() {
    // Modify to include different patterns
    switch(this.currentPattern) {
      case 'spiral':
        this.shootSpiral();
        break;
      case 'burst':
        this.shootBurst();
        break;
      case 'cross':
        this.shootCross();
        break;
    }
    // Randomly change pattern
    if (Math.random() < 0.2) {
      this.currentPattern = this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)];
    }
  }

  shootSpiral() {
    const angleStep = Math.PI * 2 / 8;
    for (let i = 0; i < 8; i++) {
      const angle = angleStep * i + this.rotation;
      const speed = 4;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      
      obstacles.push(new Obstacle(
        this.x + this.width/2,
        this.y + this.height,
        25,
        dy,
        0.02
      ));
      obstacles[obstacles.length - 1].dx = dx;
    }
  }

  shootBurst() {
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    for (let i = -2; i <= 2; i++) {
      const speed = 6;
      const spreadAngle = angle + (i * Math.PI / 12);
      const dx = Math.cos(spreadAngle) * speed;
      const dy = Math.sin(spreadAngle) * speed;
      
      obstacles.push(new Obstacle(
        this.x + this.width/2,
        this.y + this.height,
        20,
        dy,
        0.02
      ));
      obstacles[obstacles.length - 1].dx = dx;
    }
  }

  shootCross() {
    const directions = [[1,0], [-1,0], [0,1], [0,-1]];
    directions.forEach(([dx, dy]) => {
      obstacles.push(new Obstacle(
        this.x + this.width/2,
        this.y + this.height,
        30,
        dy * 4,
        0.02
      ));
      obstacles[obstacles.length - 1].dx = dx * 4;
    });
  }

  shootPattern2() {
    // Shoot 3 asteroids diagonally towards the player
    for (let i = -1; i <= 1; i++) {
      const angle = Math.atan2(player.y - (this.y + this.height), player.x - (this.x + this.width / 2)) + i * Math.PI / 6;
      const speed = 4;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;

      obstacles.push(new Obstacle(
        this.x + this.width / 2,
        this.y + this.height,
        30,
        dy,
        0.02
      ));
      obstacles[obstacles.length - 1].dx = dx; // Add horizontal speed
    }
  }

  shootFastShot() {
    const angle = Math.atan2(
      player.y - (this.y + this.height),
      player.x - (this.x + this.width / 2)
    );
    const speed = 12; // Much faster than normal asteroids

    obstacles.push(new Obstacle(
      this.x + this.width / 2,
      this.y + this.height,
      20, // Slightly smaller size
      speed * Math.sin(angle),
      0.02
    ));
    obstacles[obstacles.length - 1].dx = speed * Math.cos(angle); // Set horizontal speed
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  takeDamage(amount) {
    this.health -= amount;
    this.damageTaken += amount;

    // 50% chance to teleport when hit if cooldown allows
    const canTeleport = Date.now() - this.lastTeleportTime >= this.teleportCooldown;
    if (canTeleport && Math.random() < 0.5) {
      this.teleport();
    }

    if (this.health <= 0) {
      this.active = false;
      explosions.push(new CollisionAnimation(
        ctx,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width
      ));
      score += 30; // Award 30 points for defeating the boss
      setTimeout(() => {
        spawnObstacles();
      }, 2000);
    }
  }

  teleport() {
    // Store target position
    const maxY = canvas.height * 0.3;
    const minY = 50;
    const targetX = Math.random() * (canvas.width - this.width);
    const targetY = minY + Math.random() * (maxY - minY);

    // Fade out animation
    const fadeOut = setInterval(() => {
      this.opacity -= 0.1;
      if (this.opacity <= 0) {
        clearInterval(fadeOut);
        // Move to new position when fully faded out
        this.x = targetX;
        this.y = targetY;
        // Start fade in
        const fadeIn = setInterval(() => {
          this.opacity += 0.1;
          if (this.opacity >= 1) {
            clearInterval(fadeIn);
          }
        }, 20);
      }
    }, 20);

    this.lastTeleportTime = Date.now();
  }
}

// Add boss-related variables
let currentBoss = null;
let bossDefeated = false;

// Add warning state variable
let bossWarningShown = false;
let showingBossWarning = false;
let bossWarningTimer = 0;

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
  updateProjectiles();
  drawProjectiles();
  drawCooldownIndicator();
  drawPowerupIndicators();

  obstacles = obstacles.filter(obstacle => {
    obstacle.update();
    obstacle.draw();

    if (obstacle.y - obstacle.size > canvas.height) {
      return false;
    }

    if (detectCollision(player, obstacle)) {
  if (player.invincible) {
    // When invincible, simply remove the obstacle and (optionally) add an explosion.
    explosions.push(new CollisionAnimation(
      ctx,
      obstacle.x + obstacle.size / 2,
      obstacle.y + obstacle.size / 2,
      obstacle.size / 2
    ));
    return false;
  } else if (player.shield) {
    // Shield is active: remove the obstacle, play an explosion, and enable invincibility frames.
    explosions.push(new CollisionAnimation(
      ctx,
      obstacle.x + obstacle.size / 2,
      obstacle.y + obstacle.size / 2,
      obstacle.size / 2
    ));
    player.shield = false;
    shieldEndTime = 0;
    player.invincible = true; // Turn on invincibility
    setTimeout(() => {
      player.invincible = false;
    }, 1000); // Invincibility lasts 1000 ms (adjust as needed)
    return false;
  } else {
    gameOver = true;
    showGameOver();
    return false;
  }
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

  // Update and draw powerups
  powerups = powerups.filter(powerup => {
    powerup.update();
    powerup.draw();

    // Check for collision with player
    if (
      player.x < powerup.x + powerup.width &&
      player.x + player.width > powerup.x &&
      player.y < powerup.y + powerup.height &&
      player.y + player.height > powerup.y
    ) {
      applyPowerup(powerup.type);
      return false;
    }

    return powerup.y < canvas.height;
  });

  // Remove magnet effect code

  // Draw shield if active
  if (player.shield) {
    ctx.beginPath();
    ctx.arc(player.x, player.y + player.height / 2, player.width * 0.75, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  if (currentBoss && currentBoss.active) {
    currentBoss.update();
    currentBoss.draw();
  } else if (currentBoss && !currentBoss.active) {
    currentBoss = null;
    bossDefeated = true;
    // Resume normal obstacle spawning
    spawnObstacles();
  }

  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, 10, 30);

  // Draw boss warning
  if (showingBossWarning) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 0, ' + (Math.sin(Date.now() / 100) * 0.3 + 0.7) + ')';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS INCOMING', canvas.width / 2, canvas.height / 2);
    ctx.restore();

    bossWarningTimer--;
    if (bossWarningTimer <= 0) {
      showingBossWarning = false;
    }
  }

  requestAnimationFrame(gameLoop);
}

// Draw cooldown indicator
function drawCooldownIndicator() {
  if (player.rapidFire) return; // No cooldown indicator during rapid fire

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

// Modify the shootProjectile function
function shootProjectile() {
  if (!projectile.canShoot || gameOver) return;

  projectiles.push({
    x: player.x,
    y: player.y,
    width: 5,
    height: 15,
    speed: 10
  });

  if (!player.rapidFire) {
    projectile.canShoot = false;
    projectile.lastShotTime = Date.now();

    // Start cooldown
    setTimeout(() => {
      projectile.canShoot = true;
    }, projectile.cooldownTime);
  }
}

// Modify the drawProjectile function
function drawProjectiles() {
  ctx.fillStyle = '#ff0000';
  projectiles.forEach(proj => {
    ctx.fillRect(proj.x - proj.width / 2, proj.y, proj.width, proj.height);
  });
}

// Modify the updateProjectile function
function updateProjectiles() {
  projectiles = projectiles.filter(proj => {
    proj.y -= proj.speed;

    if (proj.y < 0) {
      return false;
    }

    // Check for boss collision
    if (currentBoss && currentBoss.active) {
      if (proj.x >= currentBoss.x &&
          proj.x <= currentBoss.x + currentBoss.width &&
          proj.y >= currentBoss.y &&
          proj.y <= currentBoss.y + currentBoss.height) {
        currentBoss.takeDamage(10);
        explosions.push(new CollisionAnimation(ctx, proj.x, proj.y, 20));
        return false;
      }
    }

    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      if (proj.x >= obstacle.x &&
        proj.x <= obstacle.x + obstacle.size &&
        proj.y >= obstacle.y &&
        proj.y <= obstacle.y + obstacle.size) {

        // Increment score for direct hit
        score++;

        // Start chain reaction from hit asteroid
        explosions.push(new CollisionAnimation(ctx, obstacle.x + obstacle.size / 2, obstacle.y + obstacle.size / 2, obstacle.size / 2));
        obstacles.splice(i, 1);

        // Random chain length between 2-5
        const chainLength = Math.floor(Math.random() * 4) + 2;
        triggerChainReaction(obstacle.x + obstacle.size / 2, obstacle.y + obstacle.size / 2, chainLength - 1);

        return false;
      }
    }

    return true;
  });
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
  spawnPowerups();

  const bossCheckInterval = setInterval(() => {
    if (!gameOver) {
        // Show boss warning at score 25
        if (score >= 25 && !bossWarningShown) {
            showingBossWarning = true;
            bossWarningTimer = 180; // 3 seconds at 60fps
            bossWarningShown = true;
        }

        // Spawn boss at score 30
        if (score >= 30 && !currentBoss && !bossDefeated) {
            currentBoss = new Boss();
            obstacles = []; // Clear existing obstacles
        }
    } else {
        clearInterval(bossCheckInterval);
        clearTimeout(powerupInterval);
    }
  }, 1000);

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  gameLoop();
}
startGame();

// Add this new function to handle powerup effects
function applyPowerup(type) {
  switch (type) {
    case 'shield':
      player.shield = true;
      shieldEndTime = Date.now() + shieldDuration;
      // Create a shield activation effect
      explosions.push(new CollisionAnimation(ctx, player.x, player.y + player.height / 2, player.width * 0.75));
      break;
    case 'rapidFire':
      player.rapidFire = true;
      setTimeout(() => {
        player.rapidFire = false;
      }, 10000); // 10 seconds
      break;
  }
}

// Add these functions to draw powerup indicators
function drawPowerupIndicators() {
  const indicatorSize = 20;
  const margin = 5;
  let offsetY = 60;

  if (player.shield) {
    drawPowerupIndicator('Shield', 'rgba(0, 255, 255, 0.8)', offsetY);
    offsetY += indicatorSize + margin;
  }
  if (player.rapidFire) {
    drawPowerupIndicator('Rapid Fire', 'rgba(255, 0, 0, 0.8)', offsetY);
  }
}

function drawPowerupIndicator(text, color, offsetY) {
  const indicatorSize = 20;
  ctx.fillStyle = color;
  ctx.fillRect(10, offsetY, indicatorSize, indicatorSize);
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  ctx.fillText(text, 35, offsetY + 15);
}

