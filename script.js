const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1000;
canvas.height = 500;

const fireButton = document.getElementById('fire');
const angleInput = document.getElementById('angle');
const powerInput = document.getElementById('power');
const turnDisplay = document.getElementById('turn');
const modeSelection = document.getElementById('mode-selection');
const gameContainer = document.getElementById('game-container');
const twoPlayerButton = document.getElementById('two-player');
const vsComputerButton = document.getElementById('vs-computer');

let terrain = [];
let wind = 0;
let turn = 1;
let player1X, player2X;
let gameMode = '2-players'; // Default game mode
let tankImage1 = new Image();
let tankImage2 = new Image();
let explosionImage = new Image();
let skyGradient;

// --- CLOUDS ---
let clouds = [];

// Add environment variables at the top
let currentEnvironment = '';
let skyColor = '';
let terrainColor = '';
let terrainDetailColor = '';
let cloudColor = '';

// Add difficulty level variables at the top
let difficultyLevel = 'medium';
let maxWindStrength = 50;
let terrainComplexity = 1;
let gravity = 0.5;
let maxPower = 100;

// Add environment generation function
function generateEnvironment() {
    const environments = ['grass', 'desert', 'jungle', 'mountain'];
    currentEnvironment = environments[Math.floor(Math.random() * environments.length)];
    
    switch(currentEnvironment) {
        case 'grass':
            skyColor = '#87CEEB';  // Light blue sky
            terrainColor = '#8BC34A';  // Green grass
            terrainDetailColor = '#689F38';  // Darker green
            cloudColor = '#FFFFFF';  // White clouds
            break;
        case 'desert':
            skyColor = '#FFB74D';  // Sandy sky
            terrainColor = '#FFD54F';  // Sand color
            terrainDetailColor = '#FFA000';  // Darker sand
            cloudColor = '#FFE0B2';  // Sandy clouds
            break;
        case 'jungle':
            skyColor = '#4CAF50';  // Green-tinted sky
            terrainColor = '#2E7D32';  // Dark green
            terrainDetailColor = '#1B5E20';  // Darker green
            cloudColor = '#A5D6A7';  // Light green clouds
            break;
        case 'mountain':
            skyColor = '#90CAF9';  // Mountain sky
            terrainColor = '#78909C';  // Rock color
            terrainDetailColor = '#546E7A';  // Darker rock
            cloudColor = '#ECEFF1';  // Mountain clouds
            break;
    }
    
    // Update sky gradient
    skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, skyColor);
    skyGradient.addColorStop(1, '#FFFFFF');
}

function generateClouds() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 120 + 20,
            size: Math.random() * 40 + 40,
            speed: Math.random() * 0.3 + 0.1
        });
    }
}

function drawClouds() {
    ctx.save();
    ctx.globalAlpha = 0.5;
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = cloudColor;
        ctx.shadowColor = cloudColor;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
    ctx.restore();
}

function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x - cloud.size > canvas.width) {
            cloud.x = -cloud.size;
            cloud.y = Math.random() * 120 + 20;
            cloud.size = Math.random() * 40 + 40;
            cloud.speed = Math.random() * 0.3 + 0.1;
        }
    });
}

// --- ANIMATED PROJECTILE TRAIL ---
let projectileTrail = [];
let explosionAnim = null;

// Update the drawProjectile function to make it more visible
function drawProjectile(x, y) {
    // Draw a large, bright projectile
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#FF0000';  // Bright red
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';  // White outline
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

// Update the fireProjectile function to ensure proper rendering
function fireProjectile(startX, startY, angle, power, callback) {
    let radianAngle = startX === player2X
        ? (Math.PI / 180) * (180 - angle)
        : (Math.PI / 180) * angle;

    let velocityX = power * Math.cos(radianAngle);
    let velocityY = -power * Math.sin(radianAngle);

    let x = startX;
    let y = startY;

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawTerrain();
        drawCannon(player1X, terrain[player1X]);
        drawCannon(player2X, terrain[player2X]);
        drawWindArrow();
        drawPowerMeter();
        drawExplosion();

        x += velocityX;
        y += velocityY;
        velocityY += gravity;

        drawProjectile(x, y);

        if (y > terrain[Math.round(x)] || x < 0 || x > canvas.width) {
            if (x >= 0 && x < canvas.width) {
                createCrater(Math.round(x), 20);
            }
            callback(x, y);
            return;
        }

        requestAnimationFrame(animate);
    }

    animate();
}

// Update the createCrater function
function createCrater(x, radius) {
    // Create explosion
    explosionAnim = {
        x: x,
        y: terrain[x],
        r: 0,
        max: radius * 2,
        alpha: 1
    };
    
    // Create crater
    for (let i = Math.max(0, x - radius); i < Math.min(canvas.width, x + radius); i++) {
        const distance = Math.abs(i - x);
        if (distance < radius) {
            terrain[i] = Math.min(canvas.height, terrain[i] + 10);
        }
    }
}

// Update the drawExplosion function
function drawExplosion() {
    if (!explosionAnim) return;
    
    // Draw explosion
    ctx.beginPath();
    ctx.arc(explosionAnim.x, explosionAnim.y, explosionAnim.r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFF00';  // Bright yellow
    ctx.fill();
    ctx.strokeStyle = '#FFA500';  // Orange outline
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
    
    explosionAnim.r += 3;
    if (explosionAnim.r > explosionAnim.max) {
        explosionAnim = null;
    }
}

// Update the generateTerrain function to include environment-specific features
function generateTerrain() {
    terrain = [];
    for (let i = 0; i < canvas.width; i++) {
        let baseHeight = 300;
        
        // Add environment-specific terrain features with complexity
        switch(currentEnvironment) {
            case 'grass':
                baseHeight += Math.sin(i / 50) * 30 * terrainComplexity + 
                             Math.random() * 20 * terrainComplexity - 10;
                break;
            case 'desert':
                baseHeight += Math.sin(i / 30) * 40 * terrainComplexity + 
                             Math.random() * 30 * terrainComplexity - 15;
                break;
            case 'jungle':
                baseHeight += Math.sin(i / 40) * 50 * terrainComplexity + 
                             Math.random() * 25 * terrainComplexity - 12;
                break;
            case 'mountain':
                baseHeight += Math.sin(i / 60) * 100 * terrainComplexity + 
                             Math.random() * 40 * terrainComplexity - 20;
                break;
        }
        
        terrain[i] = baseHeight;
    }
}

function randomizePlayerPositions() {
    // Ensure players are placed at a safe distance
    player1X = Math.floor(Math.random() * (canvas.width / 4)) + 50; // Player 1 on the left
    player2X = Math.floor(Math.random() * (canvas.width / 4)) + canvas.width - 200; // Player 2 on the right
}

function updateWind() {
    wind = Math.floor(Math.random() * (maxWindStrength * 2 + 1)) - maxWindStrength;
    draw();
}

function drawWindArrow() {
    const arrowStartX = canvas.width / 2;
    const arrowStartY = 30;
    const arrowLength = wind * 2; // Length proportional to wind strength
    const arrowEndX = arrowStartX + arrowLength;

    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(arrowStartX, arrowStartY);
    ctx.lineTo(arrowEndX, arrowStartY);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw arrowhead
    if (wind > 0) {
        // Rightward arrow
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowStartY);
        ctx.lineTo(arrowEndX - 10, arrowStartY - 5);
        ctx.lineTo(arrowEndX - 10, arrowStartY + 5);
        ctx.closePath();
    } else {
        // Leftward arrow
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowStartY);
        ctx.lineTo(arrowEndX + 10, arrowStartY - 5);
        ctx.lineTo(arrowEndX + 10, arrowStartY + 5);
        ctx.closePath();
    }
    ctx.fillStyle = "blue";
    ctx.fill();

    // Draw wind value text above the arrow
    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    const windText = `Wind: ${Math.abs(wind)} (${wind > 0 ? "Right" : "Left"})`;
    ctx.textAlign = "center";
    ctx.fillText(windText, canvas.width / 2, arrowStartY - 10);
}

// Add tank recoil animation
let tankRecoil = { active: false, offset: 0, direction: 1 };

function drawCannon(x, y) {
    const tank = turn === 1 ? tankImage1 : tankImage2;
    ctx.save();
    ctx.translate(x, y);
    
    // Apply recoil effect if active
    if (tankRecoil.active) {
        ctx.translate(tankRecoil.offset * tankRecoil.direction, 0);
        tankRecoil.offset -= 0.5;
        if (tankRecoil.offset <= 0) {
            tankRecoil.active = false;
        }
    }
    
    ctx.drawImage(tank, -20, -15, 40, 30);
    ctx.restore();
}

// Add power meter and angle indicator
function drawPowerMeter() {
    const power = parseFloat(powerInput.value);
    const maxWidth = 100;
    const height = 10;
    const x = canvas.width - 120;
    const y = 50;

    // Draw background
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, maxWidth, height);

    // Draw power level
    const powerWidth = (power / maxPower) * maxWidth;
    const gradient = ctx.createLinearGradient(x, y, x + powerWidth, y);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(1, '#FF5722');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, powerWidth, height);

    // Draw text
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(`Power (Max: ${maxPower})`, x, y - 5);
}

function computerTurn() {
    const startX = player2X;
    const startY = terrain[startX];
    const targetX = player1X;
    const distance = Math.abs(targetX - startX);
    const windAdjustment = wind * 0.1;

    let estimatedAngle = 45;
    let estimatedPower = Math.sqrt((distance * gravity) / Math.sin((2 * estimatedAngle * Math.PI) / 180)) + windAdjustment;

    // Adjust computer accuracy based on difficulty
    let accuracy = 1;
    switch(difficultyLevel) {
        case 'easy':
            accuracy = 0.7; // Less accurate
            break;
        case 'medium':
            accuracy = 0.85;
            break;
        case 'hard':
            accuracy = 0.95; // More accurate
            break;
    }

    estimatedPower = Math.min(Math.max(estimatedPower * accuracy, 10), maxPower);
    estimatedAngle += (Math.random() * 10 - 5) * (1 - accuracy);
    estimatedPower += (Math.random() * 10 - 5) * (1 - accuracy);

    fireProjectile(startX, startY, estimatedAngle, estimatedPower, (x, y) => {
        if (x >= player1X - 20 && x <= player1X + 20) {
            alert('Computer wins!');
            resetGame();
        } else {
            turn = 1;
            turnDisplay.textContent = "Player 1's Turn";
            updateWind();
        }
    });
}

function setFavicon(direction) {
    // direction: 'right' or 'left'
    let svg;
    if (direction === 'right') {
        svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x='4' y='18' width='24' height='8' rx='2' fill='%234CAF50'/><ellipse cx='16' cy='18' rx='8' ry='5' fill='%23388E3C'/><rect x='16' y='10' width='10' height='3' rx='1' fill='%232E7D32'/></svg>`;
    } else {
        svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x='4' y='18' width='24' height='8' rx='2' fill='%23FF5722'/><ellipse cx='16' cy='18' rx='8' ry='5' fill='%23E64A19'/><rect x='6' y='10' width='10' height='3' rx='1' fill='%23D84315'/></svg>`;
    }
    const url = 'data:image/svg+xml,' + encodeURIComponent(svg);
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = url;
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize fire button
    const fireButton = document.getElementById('fire');
    if (!fireButton) {
        console.error('Fire button not found!');
        return;
    }

    // Add click event listener
    fireButton.addEventListener('click', () => {
        console.log('Fire button clicked');
        const angle = parseFloat(angleInput.value);
        const power = parseFloat(powerInput.value);
        const startX = turn === 1 ? player1X : player2X;
        const startY = terrain[startX];

        console.log('Firing with:', { angle, power, startX, startY });

        fireProjectile(startX, startY, angle, power, (x, y) => {
            console.log('Projectile hit at:', { x, y });
            if (turn === 1 && x >= player2X - 20 && x <= player2X + 20) {
                alert('Player 1 wins!');
                resetGame();
            } else if (turn === 2 && x >= player1X - 20 && x <= player1X + 20) {
                alert('Player 2 wins!');
                resetGame();
            } else {
                turn = turn === 1 ? 2 : 1;
                turnDisplay.textContent = gameMode === 'vs-computer' && turn === 2
                    ? "Computer's Turn"
                    : `Player ${turn}'s Turn`;

                if (gameMode === 'vs-computer' && turn === 2) {
                    setTimeout(computerTurn, 1000);
                } else {
                    updateWind();
                }
            }
        });
    });
});

twoPlayerButton.addEventListener('click', () => {
    gameMode = '2-players';
    startGame();
});

vsComputerButton.addEventListener('click', () => {
    gameMode = 'vs-computer';
    startGame();
});

function startGame() {
    modeSelection.style.display = 'none';
    gameContainer.style.visibility = 'visible';
    resetGame();
    setFavicon('right');
}

// Update the resetGame function to include environment generation
function resetGame() {
    turn = 1;
    generateEnvironment();  // Generate new environment
    randomizePlayerPositions();
    generateTerrain();
    updateWind();
    draw();
    setFavicon('right');
}

// Update the drawTerrain function to include environment-specific details
function drawTerrain() {
    // Draw sky
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw terrain with gradient
    const terrainGradient = ctx.createLinearGradient(0, 300, 0, canvas.height);
    terrainGradient.addColorStop(0, terrainColor);
    terrainGradient.addColorStop(1, terrainDetailColor);

    ctx.fillStyle = terrainGradient;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let i = 0; i < terrain.length; i++) {
        ctx.lineTo(i, terrain[i]);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Add environment-specific details
    switch(currentEnvironment) {
        case 'grass':
            // Draw grass details
            ctx.strokeStyle = terrainDetailColor;
            ctx.lineWidth = 2;
            for (let i = 0; i < terrain.length; i += 5) {
                ctx.beginPath();
                ctx.moveTo(i, terrain[i]);
                ctx.lineTo(i, terrain[i] + 10);
                ctx.stroke();
            }
            break;
        case 'desert':
            // Draw sand dunes
            ctx.strokeStyle = terrainDetailColor;
            ctx.lineWidth = 1;
            for (let i = 0; i < terrain.length; i += 10) {
                ctx.beginPath();
                ctx.moveTo(i, terrain[i]);
                ctx.lineTo(i + 5, terrain[i] + 5);
                ctx.stroke();
            }
            break;
        case 'jungle':
            // Draw jungle details
            ctx.strokeStyle = terrainDetailColor;
            ctx.lineWidth = 3;
            for (let i = 0; i < terrain.length; i += 8) {
                ctx.beginPath();
                ctx.moveTo(i, terrain[i]);
                ctx.lineTo(i, terrain[i] + 15);
                ctx.stroke();
            }
            break;
        case 'mountain':
            // Draw mountain details
            ctx.strokeStyle = terrainDetailColor;
            ctx.lineWidth = 2;
            for (let i = 0; i < terrain.length; i += 15) {
                ctx.beginPath();
                ctx.moveTo(i, terrain[i]);
                ctx.lineTo(i + 10, terrain[i] + 20);
                ctx.stroke();
            }
            break;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTerrain();
    drawClouds();
    drawCannon(player1X, terrain[player1X]);
    drawCannon(player2X, terrain[player2X]);
    drawWindArrow();
    drawExplosion();
    drawPowerMeter();
}

function loadImages() {
    // Create tank images using canvas
    const tankCanvas1 = document.createElement('canvas');
    const tankCanvas2 = document.createElement('canvas');
    const tankCtx1 = tankCanvas1.getContext('2d');
    const tankCtx2 = tankCanvas2.getContext('2d');
    
    tankCanvas1.width = 40;
    tankCanvas1.height = 30;
    tankCanvas2.width = 40;
    tankCanvas2.height = 30;

    // Draw tank for player 1 (black metallic)
    tankCtx1.fillStyle = '#1a1a1a';
    tankCtx1.beginPath();
    tankCtx1.moveTo(5, 15);
    tankCtx1.lineTo(35, 15);
    tankCtx1.lineTo(35, 25);
    tankCtx1.lineTo(5, 25);
    tankCtx1.closePath();
    tankCtx1.fill();
    
    // Add metallic effect
    const gradient1 = tankCtx1.createLinearGradient(0, 15, 0, 25);
    gradient1.addColorStop(0, '#333');
    gradient1.addColorStop(0.5, '#1a1a1a');
    gradient1.addColorStop(1, '#000');
    tankCtx1.fillStyle = gradient1;
    tankCtx1.fill();
    
    // Tank turret
    tankCtx1.fillStyle = '#000';
    tankCtx1.beginPath();
    tankCtx1.arc(20, 15, 8, 0, Math.PI * 2);
    tankCtx1.fill();
    
    // Tank cannon
    tankCtx1.fillStyle = '#333';
    tankCtx1.fillRect(20, 7, 15, 4);

    // Draw tank for player 2 (black metallic)
    tankCtx2.fillStyle = '#1a1a1a';
    tankCtx2.beginPath();
    tankCtx2.moveTo(5, 15);
    tankCtx2.lineTo(35, 15);
    tankCtx2.lineTo(35, 25);
    tankCtx2.lineTo(5, 25);
    tankCtx2.closePath();
    tankCtx2.fill();
    
    // Add metallic effect
    const gradient2 = tankCtx2.createLinearGradient(0, 15, 0, 25);
    gradient2.addColorStop(0, '#333');
    gradient2.addColorStop(0.5, '#1a1a1a');
    gradient2.addColorStop(1, '#000');
    tankCtx2.fillStyle = gradient2;
    tankCtx2.fill();
    
    // Tank turret
    tankCtx2.fillStyle = '#000';
    tankCtx2.beginPath();
    tankCtx2.arc(20, 15, 8, 0, Math.PI * 2);
    tankCtx2.fill();
    
    // Tank cannon
    tankCtx2.fillStyle = '#333';
    tankCtx2.fillRect(5, 7, 15, 4);

    tankImage1.src = tankCanvas1.toDataURL();
    tankImage2.src = tankCanvas2.toDataURL();

    // Create explosion image
    const explosionCanvas = document.createElement('canvas');
    const explosionCtx = explosionCanvas.getContext('2d');
    explosionCanvas.width = 40;
    explosionCanvas.height = 40;

    // Draw explosion
    const gradient = explosionCtx.createRadialGradient(20, 20, 0, 20, 20, 20);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    explosionCtx.fillStyle = gradient;
    explosionCtx.beginPath();
    explosionCtx.arc(20, 20, 20, 0, Math.PI * 2);
    explosionCtx.fill();

    explosionImage.src = explosionCanvas.toDataURL();
}

// Update the init function to include initial environment generation
function init() {
    loadImages();
    createDifficultyButtons();
    setDifficulty('medium'); // Set default difficulty
    generateEnvironment();
    randomizePlayerPositions();
    generateTerrain();
    updateWind();
    generateClouds();
    draw();
    animate();
}

function animate() {
    updateClouds();
    draw();
    requestAnimationFrame(animate);
}

function updateTurnDisplay() {
    turnDisplay.textContent = gameMode === 'vs-computer' && turn === 2
        ? "Computer's Turn"
        : `Player ${turn}'s Turn`;
    turnDisplay.classList.remove('turn-glow');
    setTimeout(() => turnDisplay.classList.add('turn-glow'), 10);
}

// Add smooth power and angle changes
angleInput.addEventListener('input', () => {
    draw();
});

powerInput.addEventListener('input', () => {
    draw();
});

// Add difficulty selection UI
function createDifficultyButtons() {
    const difficultyContainer = document.createElement('div');
    difficultyContainer.id = 'difficulty-container';
    difficultyContainer.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.5);
        padding: 10px;
        border-radius: 8px;
        backdrop-filter: blur(5px);
    `;

    // Add difficulty label
    const label = document.createElement('div');
    label.textContent = 'Difficulty:';
    label.style.cssText = `
        color: white;
        font-size: 14px;
        margin-bottom: 5px;
        text-align: center;
    `;
    difficultyContainer.appendChild(label);

    const difficulties = ['easy', 'medium', 'hard'];
    difficulties.forEach(level => {
        const button = document.createElement('button');
        button.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        button.className = 'difficulty-btn';
        button.style.cssText = `
            padding: 6px 12px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
            min-width: 80px;
            text-align: center;
        `;
        button.onmouseover = () => {
            if (button.textContent.toLowerCase() !== difficultyLevel) {
                button.style.background = 'rgba(255, 255, 255, 0.3)';
            }
        };
        button.onmouseout = () => {
            if (button.textContent.toLowerCase() !== difficultyLevel) {
                button.style.background = 'rgba(255, 255, 255, 0.2)';
            }
        };
        button.onclick = () => setDifficulty(level);
        difficultyContainer.appendChild(button);
    });

    document.body.appendChild(difficultyContainer);
}

// Add difficulty settings function
function setDifficulty(level) {
    difficultyLevel = level;
    
    switch(level) {
        case 'easy':
            maxWindStrength = 30;
            terrainComplexity = 0.7;
            gravity = 0.4;
            maxPower = 120;
            break;
        case 'medium':
            maxWindStrength = 50;
            terrainComplexity = 1;
            gravity = 0.5;
            maxPower = 100;
            break;
        case 'hard':
            maxWindStrength = 70;
            terrainComplexity = 1.3;
            gravity = 0.6;
            maxPower = 80;
            break;
    }
    
    // Update UI to show selected difficulty with better visual feedback
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        if (btn.textContent.toLowerCase() === level) {
            btn.style.background = 'rgba(76, 175, 80, 0.6)';
            btn.style.border = '1px solid rgba(76, 175, 80, 0.8)';
            btn.style.transform = 'scale(1.05)';
        } else {
            btn.style.background = 'rgba(255, 255, 255, 0.2)';
            btn.style.border = '1px solid rgba(255, 255, 255, 0.3)';
            btn.style.transform = 'scale(1)';
        }
    });
    
    // Show difficulty change notification
    const notification = document.createElement('div');
    notification.textContent = `Difficulty set to ${level.toUpperCase()}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 1001;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    // Remove notification after 2 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
    
    // Reset game with new difficulty
    resetGame();
}

init();