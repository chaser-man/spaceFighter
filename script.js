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
  y: canvas.height - 100 * sizeMultiplier,
  width: 40 * sizeMultiplier,
  height: 60 * sizeMultiplier,
  speed: 7,
  dx: 0,
  moving: false,
  
  // Function to return the hitboxes
  getHitboxes() {
    // Main body rhombus
    const topX = this.x; // X-coordinate for the top and bottom points (centered on the ship)
    const topY = this.y; // Y-coordinate for the top point
    const bottomX = this.x; // X-coordinate for the bottom point (centered on the ship)
    const bottomY = this.y + this.height; // Y-coordinate for the bottom point
    const leftX = this.x - this.width / 2; // Leftmost point of the visible body
    const leftY = this.y + this.height * 0.5; // Y-coordinate for the left side
    const rightX = this.x + this.width / 2; // Rightmost point of the visible body
    const rightY = this.y + this.height * 0.5; // Y-coordinate for the right side

    const rhombus = [
      { x: topX, y: topY },
      { x: leftX, y: leftY },
      { x: bottomX, y: bottomY },
      { x: rightX, y: rightY }
    ];

    // Left fin (triangle)
    const leftFin = [
      { x: this.x - this.width * 0.4, y: this.y + this.height * 0.65 }, // Top
      { x: this.x - this.width * 0.4 - this.width * 0.3, y: this.y + this.height * 0.85 }, // Bottom-left
      { x: this.x - this.width * 0.4, y: this.y + this.height * 0.85 } // Bottom-right
    ];

    // Right fin (triangle)
    const rightFin = [
      { x: this.x + this.width * 0.4, y: this.y + this.height * 0.65 }, // Top
      { x: this.x + this.width * 0.4 + this.width * 0.3, y: this.y + this.height * 0.85 }, // Bottom-right
      { x: this.x + this.width * 0.4, y: this.y + this.height * 0.85 } // Bottom-left
    ];

    return { rhombus, leftFin, rightFin };
  }
};


// Game state
let score = 0;
let gameOver = false;
let obstacles = [];
let stars = [];
const maxObstacles = 5;

class Obstacle {
  constructor(x, y, size, speed, rotationSpeed) {
    this.x = x; // X position of the obstacle
    this.y = y; // Y position of the obstacle
    this.size = size; // Size of the obstacle (width and height)
    this.speed = speed; // Vertical speed of the obstacle
    this.rotation = 0; // Current rotation angle
    this.rotationSpeed = rotationSpeed; // Speed of rotation
    this.vertices = this.createAsteroidShape(); // Array of points defining the asteroid's shape
    this.craters = this.createCraters(); // Array of craters on the asteroid
    this.spots = this.createSpots(); // Array of spots on the asteroid
  }

  // Creates a random shape for the asteroid
  createAsteroidShape() {
    const points = [];
    const numVertices = Math.floor(Math.random() * 5) + 7; // Random number of vertices between 7 and 11
    for (let i = 0; i < numVertices; i++) {
      const angle = (i / numVertices) * Math.PI * 2;
      const radius = (this.size / 2) * (0.7 + Math.random() * 0.6); // Random radius for irregular shape
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
      });
    }
    return points;
  }

  // Creates random craters on the asteroid
  createCraters() {
    const craters = [];
    const numCraters = Math.floor(Math.random() * 3) + 2; // Random number of craters between 2 and 4
    for (let i = 0; i < numCraters; i++) {
      const craterX = (Math.random() - 0.5) * this.size * 0.6;
      const craterY = (Math.random() - 0.5) * this.size * 0.6;
      const craterRadius = this.size * 0.1 * (0.5 + Math.random() * 0.5);
      craters.push({ x: craterX, y: craterY, radius: craterRadius });
    }
    return craters;
  }

  // Creates small spots on the asteroid for texture
  createSpots() {
    const spots = [];
    const numSpots = Math.floor(Math.random() * 5) + 5; // Random number of spots between 5 and 9
    for (let i = 0; i < numSpots; i++) {
      const spotX = (Math.random() - 0.5) * this.size * 0.8;
      const spotY = (Math.random() - 0.5) * this.size * 0.8;
      const spotRadius = this.size * 0.02 * (0.5 + Math.random() * 0.5);
      spots.push({ x: spotX, y: spotY, radius: spotRadius });
    }
    return spots;
  }

  // Draws the obstacle (asteroid) on the canvas
  draw() {
    ctx.save();
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2); // Move to the center of the asteroid
    ctx.rotate(this.rotation); // Rotate the asteroid

    // Create a gradient for the asteroid's color
    const gradient = ctx.createRadialGradient(
      -this.size * 0.2, -this.size * 0.2, this.size * 0.2,
      0, 0, this.size
    );
    gradient.addColorStop(0, '#6e6e6e');
    gradient.addColorStop(0.5, '#5a5a5a');
    gradient.addColorStop(1, '#3e3e3e');

    // Draw the main shape of the asteroid
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let point of this.vertices) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw craters on the asteroid
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

    // Draw spots on the asteroid
    for (let spot of this.spots) {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fill();
    }

    // Optional: Draw the outline of the asteroid
    ctx.strokeStyle = '#2C2C2C';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // Draw hitbox if debug mode is enabled
    if (debug) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.size, this.size);
    }
  }

  // Updates the obstacle's position and rotation
  update() {
    this.y += this.speed; // Move down the screen
    this.rotation += this.rotationSpeed; // Rotate the asteroid
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

// Load the rocket image
const rocketImage = new Image();
rocketImage.src = 'rocketImage.jpeg';  // Update with the correct path

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

  // Adjusted the fins to match the body more closely
  // Left fin
  ctx.beginPath();
  ctx.moveTo(player.x - player.width * 0.4, player.y + player.height * 0.65); // Higher position
  ctx.lineTo(
    player.x - player.width * 0.4 - finWidth,
    player.y + player.height * 0.85
  ); // Aligned more with the body curve
  ctx.lineTo(player.x - player.width * 0.4, player.y + player.height * 0.85);
  ctx.closePath();
  ctx.fillStyle = '#ff4000';
  ctx.fill();

  // Right fin
  ctx.beginPath();
  ctx.moveTo(player.x + player.width * 0.4, player.y + player.height * 0.65); // Higher position
  ctx.lineTo(
    player.x + player.width * 0.4 + finWidth,
    player.y + player.height * 0.85
  ); // Aligned more with the body curve
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
  const flameHeight = (30 + Math.random() * 20) * sizeMultiplier;
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
    const topX = player.x; // X-coordinate for the top and bottom points (centered on the ship)
    const topY = player.y; // Y-coordinate for the top point
    const bottomX = player.x; // X-coordinate for the bottom point (centered on the ship)
    const bottomY = player.y + player.height; // Y-coordinate for the bottom point
    const leftX = player.x - player.width / 2; // Leftmost point of the visible body
    const leftY = player.y + player.height * 0.5; // Y-coordinate for the left side
    const rightX = player.x + player.width / 2; // Rightmost point of the visible body
    const rightY = player.y + player.height * 0.5; // Y-coordinate for the right side

    ctx.beginPath();
    ctx.moveTo(topX, topY); // Move to the top point
    ctx.lineTo(leftX, leftY); // Draw line to the left corner
    ctx.lineTo(bottomX, bottomY); // Draw line to the bottom corner
    ctx.lineTo(rightX, rightY); // Draw line to the right corner
    ctx.closePath(); // Close the path back to the top point
    ctx.stroke(); // Draw the rhombus outline

    // Draw fin hitboxes (triangles)
    // Left fin hitbox (triangle)
    ctx.beginPath();
    ctx.moveTo(player.x - player.width * 0.4, player.y + player.height * 0.65); // Top of the left fin
    ctx.lineTo(player.x - player.width * 0.4 - player.width * 0.3, player.y + player.height * 0.85); // Bottom-left of the left fin
    ctx.lineTo(player.x - player.width * 0.4, player.y + player.height * 0.85); // Bottom-right of the left fin
    ctx.closePath();
    ctx.stroke();

    // Right fin hitbox (triangle)
    ctx.beginPath();
    ctx.moveTo(player.x + player.width * 0.4, player.y + player.height * 0.65); // Top of the right fin
    ctx.lineTo(player.x + player.width * 0.4 + player.width * 0.3, player.y + player.height * 0.85); // Bottom-right of the right fin
    ctx.lineTo(player.x + player.width * 0.4, player.y + player.height * 0.85); // Bottom-left of the right fin
    ctx.closePath();
    ctx.stroke();
  }
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

    const vc = polygon[current]; // Current vertex
    const vn = polygon[next]; // Next vertex

    if (
      ((vc.y >= point.y && vn.y < point.y) || (vc.y < point.y && vn.y >= point.y)) &&
      (point.x < (vn.x - vc.x) * (point.y - vc.y) / (vn.y - vc.y) + vc.x)
    ) {
      collision = !collision;
    }
  }
  return collision;
}


function detectCollision(player, obstacle) {
  const hitboxes = player.getHitboxes();

  // Check if any corner of the obstacle is inside any of the hitboxes
  const obstacleCorners = [
    { x: obstacle.x, y: obstacle.y }, // Top-left
    { x: obstacle.x + obstacle.size, y: obstacle.y }, // Top-right
    { x: obstacle.x, y: obstacle.y + obstacle.size }, // Bottom-left
    { x: obstacle.x + obstacle.size, y: obstacle.y + obstacle.size } // Bottom-right
  ];

  // Check collision with rhombus (main body)
  for (const corner of obstacleCorners) {
    if (isPointInPolygon(corner, hitboxes.rhombus)) {
      return true; // Collision detected
    }
  }

  // Check collision with left fin
  for (const corner of obstacleCorners) {
    if (isPointInPolygon(corner, hitboxes.leftFin)) {
      return true; // Collision detected
    }
  }

  // Check collision with right fin
  for (const corner of obstacleCorners) {
    if (isPointInPolygon(corner, hitboxes.rightFin)) {
      return true; // Collision detected
    }
  }

  return false; // No collision
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

if (isMobileDevice()) {
  document.querySelector('.mobile-controls').style.display = 'block';

  leftButton.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default behavior to avoid zooming
    player.dx = -player.speed;
  }, { passive: false });

  leftButton.addEventListener('touchend', (e) => {
    e.preventDefault(); // Prevent default behavior to avoid zooming
    player.dx = 0;
  }, { passive: false });

  rightButton.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default behavior to avoid zooming
    player.dx = player.speed;
  }, { passive: false });

  rightButton.addEventListener('touchend', (e) => {
    e.preventDefault(); // Prevent default behavior to avoid zooming
    player.dx = 0;
  }, { passive: false });

  leftButton.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent default behavior to avoid zooming
  }, { passive: false });

  rightButton.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent default behavior to avoid zooming
  }, { passive: false });
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
