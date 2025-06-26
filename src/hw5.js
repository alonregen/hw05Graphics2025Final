import {OrbitControls} from './OrbitControls.js'

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 25);
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Game state variables
const gameState = {
  score: 0,
  shotAttempts: 0,
  shotsMade: 0,
  shotPower: 50, // 0-100%
  ballVelocity: new THREE.Vector3(0, 0, 0),
  ballPosition: new THREE.Vector3(0, 0.15, 0),
  isInFlight: false,
  lastShotResult: null,
  basketballObj: null,
  hoops: [],
  keys: {
    up: false,
    down: false,
    left: false,
    right: false,
    w: false,
    s: false
  }
};

// Physics constants
const PHYSICS = {
  gravity: -9.8,
  ballRadius: 0.15,
  bounceEnergyLoss: 0.7,
  groundLevel: 0.15,
  courtBounds: {
    minX: -13.5, // 28m court: -14 to +14, with 0.5m buffer
    maxX: 13.5,
    minZ: -7,    // 15m court: -7.5 to +7.5, with 0.5m buffer
    maxZ: 7
  },
  rimHeight: 3.05, // Standard basketball hoop height: 10 feet (3.05 meters)
  rimRadius: 0.45,
  shootingSpeed: 25 // speed of the ball
};

// Court setup - Standard basketball court: 28m x 15m
const courtGeometry = new THREE.PlaneGeometry(28, 15);
const courtMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xC19A6B,
  side: THREE.DoubleSide
});
const court = new THREE.Mesh(courtGeometry, courtMaterial);
court.rotation.x = -Math.PI / 2;
court.position.y = 0;
scene.add(court);

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
mainLight.position.set(10, 10, 10);
mainLight.castShadow = true;
scene.add(mainLight);

// Court markings
const linesMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

// Boundary lines
const boundaryGeometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(28, 15));
const boundaryLines = new THREE.LineSegments(
  boundaryGeometry,
  new THREE.LineBasicMaterial({ color: 0xFFFFFF })
);
boundaryLines.rotation.x = -Math.PI / 2;
boundaryLines.position.y = 0.01;
scene.add(boundaryLines);

// Center circle
const curve = new THREE.EllipseCurve(
  0, 0,                // Center
  2.4, 2.4,           // Radius
  0, Math.PI * 2,     // Full circle
  false               // Clockwise
);

const points = curve.getPoints(50);
const points3D = points.map(point => new THREE.Vector3(point.x, 0.01, point.y));
const centerCircleGeometry = new THREE.BufferGeometry().setFromPoints(points3D);
const centerCircle = new THREE.Line(centerCircleGeometry, linesMaterial);
scene.add(centerCircle);

// Center line
const centerLine = new THREE.Mesh(
  new THREE.PlaneGeometry(0.1, 15),
  linesMaterial
);
centerLine.rotation.x = -Math.PI / 2;
centerLine.position.y = 0.01;
scene.add(centerLine);

// Three-point lines
function createThreePointLine(side) {
  const startAngle = side === 1 ? Math.PI/2 : 3*Math.PI/2;
  const endAngle = side === 1 ? 3*Math.PI/2 : 5*Math.PI/2;
  
  const curve = new THREE.EllipseCurve(
    0, 0,                     // Center
    6.75, 6.75,               // Radius
    startAngle, endAngle,     // Angles
    false,                     // Clockwise
    0                         // Rotation
  );
  
  const points = curve.getPoints(50);
  const points3D = points.map(point => {
    if (side === 1) {
      return new THREE.Vector3(point.x, 0.01, -point.y);
    } else {
      return new THREE.Vector3(point.x, 0.01, point.y);
    }
  });
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
  const material = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
  const threePointLine = new THREE.Line(geometry, material);
  
  const straightLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.01, -7.5),
    new THREE.Vector3(0, 0.01, 7.5)
  ]);
  const straightLine = new THREE.Line(straightLineGeometry, material);
  
  const threePointGroup = new THREE.Group();
  threePointGroup.add(threePointLine);
  threePointGroup.add(straightLine);
  threePointGroup.position.x = side * 14; // Adjusted for 28m court
  
  scene.add(threePointGroup);
}

createThreePointLine(-1);
createThreePointLine(1);

// Key areas (free throw boxes)
function createKeyArea(side) {
  const keyGeometry = new THREE.PlaneGeometry(4, 5.8);
  const keyMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
  const keyLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(keyGeometry),
    keyMaterial
  );
  keyLines.rotation.x = -Math.PI / 2;
  keyLines.position.set(side * 12, 0.01, 0); // Adjusted for 28m court
  scene.add(keyLines);
}

createKeyArea(-1);
createKeyArea(1);

// Basketball creation
function createBasketball() {
  const BALL_RADIUS = PHYSICS.ballRadius;
  const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
  const ballMaterial = new THREE.MeshPhongMaterial({
    color: 0xD85C17,
    roughness: 0.8,
    metalness: 0.1
  });
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  
  const seams = new THREE.Group();
  
  function addSeam(rotationY) {
    const curve = new THREE.EllipseCurve(
      0, 0,
      BALL_RADIUS, BALL_RADIUS,
      0, Math.PI * 2,
      false
    );
    
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const seam = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    
    seam.rotation.y = rotationY;
    seams.add(seam);
  }
  
  addSeam(0);
  addSeam(Math.PI / 2);
  addSeam(Math.PI / 4);
  addSeam(-Math.PI / 4);
  
  ball.add(seams);
  ball.position.copy(gameState.ballPosition);
  scene.add(ball);
  
  gameState.basketballObj = ball;
  return ball;
}

const basketball = createBasketball();

// Basketball hoops
function createBasketballHoop(side) {
  const hoopGroup = new THREE.Group();
  
  const RIM_HEIGHT = PHYSICS.rimHeight;
  const BACKBOARD_HEIGHT = RIM_HEIGHT + 0.5;
  
  // Backboard
  const backboardGeometry = new THREE.BoxGeometry(2.2, 1.3, 0.05);
  const backboardMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
  backboard.position.set(0, BACKBOARD_HEIGHT, 0);
  hoopGroup.add(backboard);
  
  // Rim
  const rimGeometry = new THREE.TorusGeometry(PHYSICS.rimRadius, 0.02, 16, 32);
  const rimMaterial = new THREE.MeshPhongMaterial({ color: 0xff8c00 });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, RIM_HEIGHT, -PHYSICS.rimRadius);
  hoopGroup.add(rim);
  
  // Net
  const netMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const netSegments = 12;
  const netLength = 0.5;
  
  for (let i = 0; i < netSegments; i++) {
    const angle = (i / netSegments) * Math.PI * 2;
    const x = Math.cos(angle) * PHYSICS.rimRadius;
    const z = Math.sin(angle) * PHYSICS.rimRadius;
    
    const netGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, RIM_HEIGHT, z - PHYSICS.rimRadius),
      new THREE.Vector3(x * 0.3, RIM_HEIGHT - netLength, z * 0.3 - PHYSICS.rimRadius)
    ]);
    const netLine = new THREE.Line(netGeometry, netMaterial);
    hoopGroup.add(netLine);
  }
  
  // Support structure
  const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
  
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, BACKBOARD_HEIGHT * 1.2, 8);
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.set(0, BACKBOARD_HEIGHT * 0.6, 1);
  hoopGroup.add(pole);
  
  const armGeometry = new THREE.BoxGeometry(0.1, 0.1, 1);
  const arm1 = new THREE.Mesh(armGeometry, poleMaterial);
  arm1.position.set(0, BACKBOARD_HEIGHT, 0.5);
  hoopGroup.add(arm1);
  
  const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.2), poleMaterial);
  arm2.position.set(0, BACKBOARD_HEIGHT - 0.5, 0.5);
  arm2.rotation.x = -Math.PI / 6;
  hoopGroup.add(arm2);
  
  hoopGroup.position.set(side * 13.4, 0, 0); // Adjusted for 28m court
  hoopGroup.rotation.y = side * Math.PI / 2;
  
  scene.add(hoopGroup);
  
  // Store hoop data for collision detection
  const hoopData = {
    side: side,
    position: new THREE.Vector3(side * 13.4, RIM_HEIGHT, 0), // Adjusted for 28m court
    rimRadius: PHYSICS.rimRadius,
    rimHeight: RIM_HEIGHT
  };
  gameState.hoops.push(hoopData);
  
  return hoopGroup;
}

createBasketballHoop(-1);
createBasketballHoop(1);

// Physics system
function updatePhysics(deltaTime) {
  if (!gameState.isInFlight) return;
  
  const ball = gameState.basketballObj;
  
  // Apply gravity
  gameState.ballVelocity.y += PHYSICS.gravity * deltaTime;
  
  // Update position
  gameState.ballPosition.x += gameState.ballVelocity.x * deltaTime;
  gameState.ballPosition.y += gameState.ballVelocity.y * deltaTime;
  gameState.ballPosition.z += gameState.ballVelocity.z * deltaTime;
  
  // Ground collision
  if (gameState.ballPosition.y <= PHYSICS.groundLevel) {
    gameState.ballPosition.y = PHYSICS.groundLevel;
    gameState.ballVelocity.y = -gameState.ballVelocity.y * PHYSICS.bounceEnergyLoss;
    gameState.ballVelocity.x *= PHYSICS.bounceEnergyLoss;
    gameState.ballVelocity.z *= PHYSICS.bounceEnergyLoss;
    
    // Stop if velocity is too low
    if (Math.abs(gameState.ballVelocity.y) < 0.5 && 
        Math.abs(gameState.ballVelocity.x) < 0.5 && 
        Math.abs(gameState.ballVelocity.z) < 0.5) {
      gameState.ballVelocity.set(0, 0, 0);
      gameState.isInFlight = false;
    }
  }
  
  // Court bounds
  if (gameState.ballPosition.x < PHYSICS.courtBounds.minX || 
      gameState.ballPosition.x > PHYSICS.courtBounds.maxX) {
    gameState.ballVelocity.x = -gameState.ballVelocity.x * PHYSICS.bounceEnergyLoss;
    gameState.ballPosition.x = Math.max(PHYSICS.courtBounds.minX, 
                                       Math.min(PHYSICS.courtBounds.maxX, gameState.ballPosition.x));
  }
  
  if (gameState.ballPosition.z < PHYSICS.courtBounds.minZ || 
      gameState.ballPosition.z > PHYSICS.courtBounds.maxZ) {
    gameState.ballVelocity.z = -gameState.ballVelocity.z * PHYSICS.bounceEnergyLoss;
    gameState.ballPosition.z = Math.max(PHYSICS.courtBounds.minZ, 
                                       Math.min(PHYSICS.courtBounds.maxZ, gameState.ballPosition.z));
  }
  
  // Check for scoring
  checkScoring();
  
  // Update ball rotation based on velocity
  const rotationSpeed = gameState.ballVelocity.length() * 0.1;
  ball.rotation.x += rotationSpeed * deltaTime;
  ball.rotation.z += rotationSpeed * deltaTime * 0.7;
  
  // Update ball position
  ball.position.copy(gameState.ballPosition);
}

function checkScoring() {
  if (gameState.lastShotResult === 'made') return;
  
  for (const hoop of gameState.hoops) {
    const distanceToHoop = gameState.ballPosition.distanceTo(hoop.position);
    
    // Check if ball is close to rim and moving downward
    if (distanceToHoop < hoop.rimRadius && 
        gameState.ballPosition.y < hoop.rimHeight && 
        gameState.ballPosition.y > hoop.rimHeight - 1 &&
        gameState.ballVelocity.y < 0) {
      
      // Score detection
      const horizontalDistance = Math.sqrt(
        Math.pow(gameState.ballPosition.x - hoop.position.x, 2) +
        Math.pow(gameState.ballPosition.z - hoop.position.z, 2)
      );
      
      if (horizontalDistance < hoop.rimRadius * 0.8) {
        scoreShot();
        return;
      }
    }
  }
}

function scoreShot() {
  gameState.score += 2;
  gameState.shotsMade++;
  gameState.lastShotResult = 'made';
  updateUI();
  showShotFeedback('SHOT MADE!', '#4CAF50');
}

function missShot() {
  gameState.lastShotResult = 'missed';
  showShotFeedback('MISSED SHOT', '#f44336');
}

// Ball movement controls
function updateBallMovement(deltaTime) {
  if (gameState.isInFlight) return;
  
  const moveSpeed = 8;
  const ball = gameState.basketballObj;
  
  // Get camera direction vectors
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  
  // Calculate right vector (perpendicular to camera direction)
  const cameraRight = new THREE.Vector3();
  cameraRight.crossVectors(cameraDirection, camera.up).normalize();
  
  const cameraForward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
  
  // Movement relative to camera
  let moveVector = new THREE.Vector3(0, 0, 0);
  
  if (gameState.keys.left) {
    // Move left relative to camera
    moveVector.add(cameraRight.clone().multiplyScalar(-moveSpeed * deltaTime));
    ball.rotation.z += moveSpeed * deltaTime * 0.2;
  }
  if (gameState.keys.right) {
    // Move right relative to camera
    moveVector.add(cameraRight.clone().multiplyScalar(moveSpeed * deltaTime));
    ball.rotation.z -= moveSpeed * deltaTime * 0.2;
  }
  if (gameState.keys.up) {
    // Move forward relative to camera
    moveVector.add(cameraForward.clone().multiplyScalar(moveSpeed * deltaTime));
    ball.rotation.x += moveSpeed * deltaTime * 0.2;
  }
  if (gameState.keys.down) {
    // Move backward relative to camera
    moveVector.add(cameraForward.clone().multiplyScalar(-moveSpeed * deltaTime));
    ball.rotation.x -= moveSpeed * deltaTime * 0.2;
  }
  
  // Apply movement to ball position
  gameState.ballPosition.add(moveVector);
  
  // Power adjustment
  if (gameState.keys.w) {
    gameState.shotPower = Math.min(100, gameState.shotPower + 50 * deltaTime);
    updateUI();
  }
  if (gameState.keys.s) {
    gameState.shotPower = Math.max(0, gameState.shotPower - 50 * deltaTime);
    updateUI();
  }
  
  // Keep ball within court bounds
  gameState.ballPosition.x = Math.max(PHYSICS.courtBounds.minX, 
                                     Math.min(PHYSICS.courtBounds.maxX, gameState.ballPosition.x));
  gameState.ballPosition.z = Math.max(PHYSICS.courtBounds.minZ, 
                                     Math.min(PHYSICS.courtBounds.maxZ, gameState.ballPosition.z));
  
  ball.position.copy(gameState.ballPosition);
}

// Shooting mechanics
function shootBasketball() {
  if (gameState.isInFlight) return;
  
  gameState.shotAttempts++;
  gameState.isInFlight = true;
  gameState.lastShotResult = null; // Reset shot result for new shot
  
  // Find nearest hoop
  let nearestHoop = gameState.hoops[0];
  let minDistance = gameState.ballPosition.distanceTo(nearestHoop.position);
  
  for (const hoop of gameState.hoops) {
    const distance = gameState.ballPosition.distanceTo(hoop.position);
    if (distance < minDistance) {
      minDistance = distance;
      nearestHoop = hoop;
    }
  }
  
  // Calculate shot trajectory
  const targetPosition = nearestHoop.position.clone();
  const ballPosition = gameState.ballPosition.clone();
  
  const horizontal = new THREE.Vector2(
    targetPosition.x - ballPosition.x,
    targetPosition.z - ballPosition.z
  );
  const horizontalDistance = horizontal.length();
  const verticalDistance = targetPosition.y - ballPosition.y;
  
  // Calculate launch angle and velocity
  const powerMultiplier = gameState.shotPower / 100;
  const baseSpeed = PHYSICS.shootingSpeed * (0.7 + powerMultiplier * 0.8); // Increased power range (was 0.5-1.0, now 0.7-1.5)
  
  // Optimal angle for basketball shot (around 45-50 degrees)
  const launchAngle = Math.PI / 4 + (powerMultiplier - 0.5) * 0.3; // Increased angle variation
  
  const velocityMagnitude = Math.sqrt(
    (horizontalDistance * Math.abs(PHYSICS.gravity)) / 
    Math.sin(2 * launchAngle)
  ) * (baseSpeed / PHYSICS.shootingSpeed) * 1.2; // Additional 20% power boost
  
  gameState.ballVelocity.x = (horizontal.x / horizontalDistance) * velocityMagnitude * Math.cos(launchAngle);
  gameState.ballVelocity.z = (horizontal.y / horizontalDistance) * velocityMagnitude * Math.cos(launchAngle);
  gameState.ballVelocity.y = velocityMagnitude * Math.sin(launchAngle);
  
  updateUI();
  
  // Set timeout to check for miss if ball doesn't score
  setTimeout(() => {
    if (gameState.isInFlight && gameState.lastShotResult !== 'made') {
      missShot();
    }
  }, 6000);
}

function resetBall() {
  gameState.ballPosition.set(0, PHYSICS.groundLevel, 0);
  gameState.ballVelocity.set(0, 0, 0);
  gameState.isInFlight = false;
  gameState.shotPower = 50;
  gameState.basketballObj.position.copy(gameState.ballPosition);
  updateUI();
}

// UI system
function updateUI() {
  const scoreElement = document.querySelector('.score-display');
  if (scoreElement) {
    scoreElement.textContent = `Score: ${gameState.score}`;
  }
  
  const gameStatusElement = document.getElementById('game-status');
  if (gameStatusElement) {
    const accuracy = gameState.shotAttempts > 0 ? 
      Math.round((gameState.shotsMade / gameState.shotAttempts) * 100) : 0;
    gameStatusElement.innerHTML = `
      <span class="status-label">Shots:</span>${gameState.shotsMade}/${gameState.shotAttempts} (${accuracy}%)
    `;
  }
  
  const ballPositionElement = document.getElementById('ball-position');
  if (ballPositionElement) {
    const powerBar = '█'.repeat(Math.floor(gameState.shotPower / 10)) + 
                     '░'.repeat(10 - Math.floor(gameState.shotPower / 10));
    ballPositionElement.innerHTML = `
      <span class="status-label">Power:</span>${Math.round(gameState.shotPower)}% [${powerBar}]
    `;
  }
  
  // Update camera status
  const cameraStatusElement = document.getElementById('camera-status');
  if (cameraStatusElement) {
    const orbitStatus = orbitEnabled ? 'Orbit Enabled' : 'Orbit Disabled';
    cameraStatusElement.innerHTML = `
      <span class="status-label">Camera:</span>${orbitStatus}
    `;
  }
}

function showShotFeedback(message, color) {
  // Create temporary feedback element
  const feedbackElement = document.createElement('div');
  feedbackElement.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    font-weight: bold;
    color: ${color};
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    z-index: 2000;
    pointer-events: none;
    animation: fadeOut 2s ease-out forwards;
  `;
  feedbackElement.textContent = message;
  
  // Add fade out animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeOut {
      0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(feedbackElement);
  
  setTimeout(() => {
    document.body.removeChild(feedbackElement);
    document.head.removeChild(style);
  }, 2000);
}

// Controls system
// Handle keyboard down events
document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  
  // Movement keys
  switch(key) {
    case 'arrowleft':
      gameState.keys.left = true;
      event.preventDefault();
      break;
    case 'arrowright':
      gameState.keys.right = true;
      event.preventDefault();
      break;
    case 'arrowup':
      gameState.keys.up = true;
      event.preventDefault();
      break;
    case 'arrowdown':
      gameState.keys.down = true;
      event.preventDefault();
      break;
    case 'w':
      gameState.keys.w = true;
      event.preventDefault();
      break;
    case 's':
      gameState.keys.s = true;
      event.preventDefault();
      break;
  }
  
  // Single press actions
  switch(key) {
    case ' ':
      shootBasketball();
      event.preventDefault();
      break;
    case 'r':
      resetBall();
      event.preventDefault();
      break;
    case 'o':
      orbitEnabled = !orbitEnabled;
      controls.enabled = orbitEnabled;
      updateUI();
      break;
    case '1':
      setCameraPreset('default');
      break;
    case '2':
      setCameraPreset('side');
      break;
    case '3':
      setCameraPreset('corner');
      break;
    case '4':
      setCameraPreset('hoop');
      break;
  }
});

// Handle keyboard up events
document.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  
  switch(key) {
    case 'arrowleft':
      gameState.keys.left = false;
      break;
    case 'arrowright':
      gameState.keys.right = false;
      break;
    case 'arrowup':
      gameState.keys.up = false;
      break;
    case 'arrowdown':
      gameState.keys.down = false;
      break;
    case 'w':
      gameState.keys.w = false;
      break;
    case 's':
      gameState.keys.s = false;
      break;
  }
});

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI * 0.5;

// Camera presets
function getCameraPresets(side = currentSide) {
  return {
    default: { position: new THREE.Vector3(0, 15, 25), target: new THREE.Vector3(0, 0, 0) },
    side: { position: new THREE.Vector3(side * 23, 8, 0), target: new THREE.Vector3(0, 0, 0) },
    corner: { position: new THREE.Vector3(side * 18, 10, 18), target: new THREE.Vector3(0, 0, 0) },
    hoop: { position: new THREE.Vector3(side * 9, 6, 0), target: new THREE.Vector3(side * 13.4, 3, 0) }
  };
}

// Function to smoothly transition camera
function setCameraPreset(presetName, duration = 1000) {
  // Toggle side for side, corner, and hoop views
  if (presetName === 'side' || presetName === 'corner' || presetName === 'hoop') {
    currentSide = currentSide * -1;
  }
  
  const cameraPresets = getCameraPresets(currentSide);
  const preset = cameraPresets[presetName];
  if (!preset) return;
  
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = Date.now();
  
  function updateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Smooth easing
    const t = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    
    camera.position.lerpVectors(startPos, preset.position, t);
    controls.target.lerpVectors(startTarget, preset.target, t);
    controls.update();
    
    if (progress < 1) {
      requestAnimationFrame(updateCamera);
    }
  }
  
  updateCamera();
}

// Animation loop
let lastTime = 0;
let orbitEnabled = true;
  let currentSide = 1;

function animate(currentTime) {
  requestAnimationFrame(animate);
  
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  // Update game systems
  updateBallMovement(deltaTime);
  updatePhysics(deltaTime);
  
  controls.update();
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize UI
updateUI();

// Start animation loop
animate(0);