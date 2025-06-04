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

// Add game state variables
let score = { player1: 0, player2: 0 };
let gameTime = 0;
let roundNumber = 1;
let maxRounds = 3;
let timeLimit = 180; // 3 minutes for quick mode

// Add business-related variables
let userData = {
    username: '',
    coins: 0,
    level: 1,
    experience: 0,
    premium: false,
    skins: ['default'],
    selectedSkin: 'default'
};

let gameStats = {
    gamesPlayed: 0,
    wins: 0,
    bestScore: 0,
    totalHits: 0
};

// Add ad configuration
const AD_CONFIG = {
    positions: {
        top: { id: 'top-ad', width: '728px', height: '90px' },
        side: { id: 'side-ad', width: '300px', height: '600px' },
        bottom: { id: 'bottom-ad', width: '728px', height: '90px' }
    },
    refreshInterval: 300000 // 5 minutes
};

// Add security-related variables and configurations
const SECURITY_CONFIG = {
    maxRequestsPerMinute: 60,
    sessionTimeout: 3600000, // 1 hour
    maxScorePerGame: 10000,
    maxCoinsPerGame: 1000,
    encryptionKey: 'YOUR_ENCRYPTION_KEY', // Replace with a secure key
    allowedOrigins: ['https://yourdomain.com'], // Replace with your domain
    apiEndpoints: {
        auth: '/api/auth',
        score: '/api/score',
        shop: '/api/shop'
    }
};

// Add security middleware
const securityMiddleware = {
    // Rate limiting
    rateLimiter: new Map(),
    
    // Session management
    sessions: new Map(),
    
    // Request validation
    validateRequest: function(req) {
        const timestamp = Date.now();
        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // Check rate limiting
        if (!this.rateLimiter.has(clientIP)) {
            this.rateLimiter.set(clientIP, {
                count: 1,
                timestamp: timestamp
            });
        } else {
            const clientData = this.rateLimiter.get(clientIP);
            if (timestamp - clientData.timestamp > 60000) {
                clientData.count = 1;
                clientData.timestamp = timestamp;
            } else if (clientData.count >= SECURITY_CONFIG.maxRequestsPerMinute) {
                throw new Error('Rate limit exceeded');
            } else {
                clientData.count++;
            }
        }
        
        // Validate session
        const sessionId = req.headers['x-session-id'];
        if (!this.sessions.has(sessionId)) {
            throw new Error('Invalid session');
        }
        
        return true;
    },
    
    // Session management
    createSession: function(userId) {
        const sessionId = this.generateSecureToken();
        this.sessions.set(sessionId, {
            userId: userId,
            created: Date.now(),
            lastActivity: Date.now()
        });
        return sessionId;
    },
    
    // Token generation
    generateSecureToken: function() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
};

// Add data encryption
const encryption = {
    // Encrypt sensitive data
    encrypt: function(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        return crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
            SECURITY_CONFIG.encryptionKey,
            dataBuffer
        );
    },
    
    // Decrypt data
    decrypt: function(encryptedData) {
        return crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: encryptedData.iv },
            SECURITY_CONFIG.encryptionKey,
            encryptedData.data
        );
    }
};

// Update anti-cheat protection
const antiCheat = {
    // Track game state
    gameState: new Map(),
    
    // Validate game actions
    validateAction: function(action, playerId) {
        // Initialize player state if not exists
        if (!this.gameState.has(playerId)) {
            this.gameState.set(playerId, {
                lastAction: Date.now(),
                actions: []
            });
        }
        
        const playerState = this.gameState.get(playerId);
        
        // Update last action time
        const currentTime = Date.now();
        playerState.lastAction = currentTime;
        
        // Add action to history
        playerState.actions.push({
            type: action.type,
            timestamp: currentTime,
            data: action
        });
        
        // Keep only last 10 actions
        if (playerState.actions.length > 10) {
            playerState.actions.shift();
        }
        
        // Basic validation - allow normal gameplay actions
        if (action.type === 'fire') {
            // Validate angle and power are within reasonable ranges
            if (action.angle >= 0 && action.angle <= 90 &&
                action.power >= 0 && action.power <= maxPower) {
                return true;
            }
        }
        
        return true; // Allow all other actions by default
    },
    
    // Detect impossible moves
    isImpossibleMove: function(action, state) {
        // No impossible moves in basic gameplay
        return false;
    },
    
    // Detect speed hacks
    isSpeedHack: function(action, state) {
        // Allow normal gameplay speed
        return false;
    },
    
    // Flag suspicious activity
    flagSuspiciousActivity: function(playerId, reason) {
        console.warn(`Suspicious activity detected for player ${playerId}: ${reason}`);
        // Log but don't block normal gameplay
    }
};

// Add secure communication
const secureCommunication = {
    // Validate API requests
    validateApiRequest: function(request) {
        // Check origin
        if (!SECURITY_CONFIG.allowedOrigins.includes(request.origin)) {
            throw new Error('Invalid origin');
        }
        
        // Validate request headers
        if (!request.headers['x-api-key']) {
            throw new Error('Missing API key');
        }
        
        return true;
    },
    
    // Secure API response
    secureResponse: function(data) {
        return {
            data: encryption.encrypt(data),
            timestamp: Date.now(),
            signature: this.generateSignature(data)
        };
    },
    
    // Generate request signature
    generateSignature: function(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        return crypto.subtle.sign(
            'HMAC',
            SECURITY_CONFIG.encryptionKey,
            dataBuffer
        );
    }
};

// Add secure storage
const secureStorage = {
    // Store sensitive data
    store: function(key, value) {
        const encrypted = encryption.encrypt(value);
        localStorage.setItem(key, JSON.stringify(encrypted));
    },
    
    // Retrieve sensitive data
    retrieve: function(key) {
        const encrypted = JSON.parse(localStorage.getItem(key));
        if (!encrypted) return null;
        return encryption.decrypt(encrypted);
    },
    
    // Clear sensitive data
    clear: function(key) {
        localStorage.removeItem(key);
    }
};

// Update input validation to handle objects
const inputValidation = {
    // Validate user input
    validateInput: function(input) {
        // Handle object input
        if (typeof input === 'object') {
            return this.validateObject(input);
        }
        
        // Handle string input
        const sanitized = this.sanitizeInput(input);
        
        // Validate length
        if (sanitized.length > 100) {
            throw new Error('Input too long');
        }
        
        // Check for malicious patterns
        if (this.containsMaliciousPattern(sanitized)) {
            throw new Error('Invalid input pattern');
        }
        
        return sanitized;
    },
    
    // Validate object input
    validateObject: function(obj) {
        const validated = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                validated[key] = this.sanitizeInput(value);
            } else if (typeof value === 'number') {
                validated[key] = value;
            } else {
                validated[key] = value;
            }
        }
        return validated;
    },
    
    // Sanitize input
    sanitizeInput: function(input) {
        if (typeof input !== 'string') {
            return input;
        }
        return input.replace(/[<>]/g, '');
    },
    
    // Check for malicious patterns
    containsMaliciousPattern: function(input) {
        if (typeof input !== 'string') {
            return false;
        }
        const maliciousPatterns = [
            /<script>/i,
            /javascript:/i,
            /on\w+=/i
        ];
        
        return maliciousPatterns.some(pattern => pattern.test(input));
    }
};

// Update game functions with security measures
function updateGameWithSecurity() {
    // Secure the fireProjectile function
    const originalFireProjectile = fireProjectile;
    fireProjectile = function(startX, startY, angle, power, callback) {
        // Validate input
        if (!inputValidation.validateInput({ startX, startY, angle, power })) {
            console.error('Invalid input detected');
            return;
        }
        
        // Check for cheating
        if (!antiCheat.validateAction({
            type: 'fire',
            startX,
            startY,
            angle,
            power,
            timestamp: Date.now()
        }, turn)) {
            console.error('Suspicious activity detected');
            return;
        }
        
        // Proceed with original function
        originalFireProjectile(startX, startY, angle, power, callback);
    };
    
    // Secure the score update
    const originalUpdateScore = updateGameStatus;
    updateGameStatus = function() {
        // Validate score
        if (score.player1 > SECURITY_CONFIG.maxScorePerGame ||
            score.player2 > SECURITY_CONFIG.maxScorePerGame) {
            console.error('Invalid score detected');
            return;
        }
        
        // Proceed with original function
        originalUpdateScore();
    };
}

// Update security headers function
function addSecurityHeaders() {
    // Content Security Policy
    const csp = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data:;
        connect-src 'self';
    `;
    
    // Set security headers
    document.head.innerHTML += `
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <meta http-equiv="X-Content-Type-Options" content="nosniff">
        <meta http-equiv="X-XSS-Protection" content="1; mode=block">
    `;

    // Note: X-Frame-Options should be set in server headers
    console.log('Security headers set. Note: X-Frame-Options should be set in server headers.');
}

// Initialize security measures
function initializeSecurity() {
    addSecurityHeaders();
    updateGameWithSecurity();
    
    // Add event listeners for security
    window.addEventListener('beforeunload', () => {
        secureStorage.clear('session');
    });
    
    // Monitor for suspicious activity
    setInterval(() => {
        const currentTime = Date.now();
        securityMiddleware.sessions.forEach((session, sessionId) => {
            if (currentTime - session.lastActivity > SECURITY_CONFIG.sessionTimeout) {
                securityMiddleware.sessions.delete(sessionId);
            }
        });
    }, 60000);
}

// Update the init function
function init() {
    try {
        initializeSecurity();
        loadImages();
        createAdContainers();
        createBusinessUI();
        createGameStatusUI();
        createDifficultyButtons();
        setDifficulty('medium');
        generateEnvironment();
        randomizePlayerPositions();
        generateTerrain();
        updateWind();
        generateClouds();
        draw();
        animate();

        // Set up ad refresh interval
        setInterval(refreshAds, AD_CONFIG.refreshInterval);
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

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

// Update the fireProjectile function to include wind effects on the projectile trajectory
function fireProjectile(startX, startY, angle, power, callback) {
    try {
        // Basic validation
        if (angle < 0 || angle > 90 || power < 0 || power > maxPower) {
            console.error('Invalid angle or power values');
            return;
        }

        let radianAngle = startX === player2X
            ? (Math.PI / 180) * (180 - angle)
            : (Math.PI / 180) * angle;

        let velocityX = power * Math.cos(radianAngle);
        let velocityY = -power * Math.sin(radianAngle);

        let x = startX;
        let y = startY;

        console.log('Initial conditions:', {
            wind: wind,
            initialVelocityX: velocityX,
            angle: angle,
            power: power
        });

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            drawTerrain();
            drawCannon(player1X, terrain[player1X]);
            drawCannon(player2X, terrain[player2X]);
            drawWindArrow();
            drawPowerMeter();
            drawExplosion();

            // Apply much stronger wind effect
            const windEffect = wind * 0.2; // Significantly increased wind effect
            
            // Check if bullet is moving in the same direction as wind
            const isMovingWithWind = (wind > 0 && velocityX > 0) || (wind < 0 && velocityX < 0);
            
            if (isMovingWithWind) {
                // Same direction - accelerate
                velocityX += windEffect;
                console.log('Moving with wind - Accelerating:', {
                    windEffect: windEffect,
                    newVelocityX: velocityX
                });
            } else {
                // Opposite direction - push in opposite direction
                velocityX -= windEffect;
                console.log('Moving against wind - Pushing back:', {
                    windEffect: windEffect,
                    newVelocityX: velocityX
                });
            }
            
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
    } catch (error) {
        console.error('Error in fireProjectile:', error);
        // Reset turn if there's an error
        turn = turn === 1 ? 2 : 1;
        turnDisplay.textContent = gameMode === 'vs-computer' && turn === 2
            ? "Computer's Turn"
            : `Player ${turn}'s Turn`;
    }
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

        // Validate input before firing
        if (isNaN(angle) || isNaN(power)) {
            console.error('Invalid angle or power values');
            return;
        }

        // Fire the projectile
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

// Add UI elements for game status
function createGameStatusUI() {
    const statusContainer = document.createElement('div');
    statusContainer.id = 'game-status';
    statusContainer.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 15px;
        border-radius: 10px;
        color: white;
        font-family: Arial, sans-serif;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    // Score display
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score-display';
    scoreDisplay.style.cssText = `
        font-size: 18px;
        margin-bottom: 10px;
        text-align: center;
    `;
    statusContainer.appendChild(scoreDisplay);

    // Round display
    const roundDisplay = document.createElement('div');
    roundDisplay.id = 'round-display';
    roundDisplay.style.cssText = `
        font-size: 14px;
        margin-bottom: 10px;
        text-align: center;
    `;
    statusContainer.appendChild(roundDisplay);

    // Timer display
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer-display';
    timerDisplay.style.cssText = `
        font-size: 14px;
        text-align: center;
    `;
    statusContainer.appendChild(timerDisplay);

    document.body.appendChild(statusContainer);
    updateGameStatus();
}

// Add back createGameModeSelection function
function createGameModeSelection() {
    const modeContainer = document.createElement('div');
    modeContainer.id = 'game-mode-selection';
    modeContainer.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        padding: 20px;
        border-radius: 15px;
        color: white;
        text-align: center;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        z-index: 1000;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Select Game Mode';
    title.style.cssText = `
        margin-bottom: 20px;
        color: #4CAF50;
    `;
    modeContainer.appendChild(title);

    const modes = [
        { id: 'classic', name: 'Classic Mode', desc: 'Traditional turn-based gameplay' },
        { id: 'quick', name: 'Quick Mode', desc: '3-minute time limit, fast-paced action' },
        { id: 'tournament', name: 'Tournament Mode', desc: 'Best of 3 rounds' }
    ];

    modes.forEach(mode => {
        const button = document.createElement('button');
        button.textContent = mode.name;
        button.style.cssText = `
            display: block;
            width: 200px;
            padding: 10px;
            margin: 10px auto;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        button.onmouseover = () => button.style.background = 'rgba(255, 255, 255, 0.2)';
        button.onmouseout = () => button.style.background = 'rgba(255, 255, 255, 0.1)';
        button.onclick = () => startGameMode(mode.id);
        modeContainer.appendChild(button);

        const desc = document.createElement('div');
        desc.textContent = mode.desc;
        desc.style.cssText = `
            font-size: 12px;
            color: #aaa;
            margin-bottom: 15px;
        `;
        modeContainer.appendChild(desc);
    });

    document.body.appendChild(modeContainer);
}

// Update startGameMode function to handle all game modes
function startGameMode(mode) {
    gameMode = mode;
    
    // Hide game mode selection
    const modeSelection = document.getElementById('game-mode-selection');
    if (modeSelection) {
        modeSelection.remove(); // Remove the element instead of just hiding it
    }
    
    // Show game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.visibility = 'visible';
    }
    
    switch(mode) {
        case 'quick':
            timeLimit = 180; // 3 minutes
            gameTime = timeLimit;
            startQuickMode();
            break;
        case 'tournament':
            roundNumber = 1;
            maxRounds = 3;
            startTournamentMode();
            break;
        default:
            startClassicMode();
    }
}

// Add quick mode function
function startQuickMode() {
    // Hide game mode selection
    const modeSelection = document.getElementById('game-mode-selection');
    if (modeSelection) {
        modeSelection.style.display = 'none';
    }

    // Reset game state
    score = { player1: 0, player2: 0 };
    roundNumber = 1;
    maxRounds = 1;
    
    // Show game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.visibility = 'visible';
    }

    // Start timer
    const timer = setInterval(() => {
        gameTime--;
        updateGameStatus();
        
        if (gameTime <= 0) {
            clearInterval(timer);
            endGame();
        }
    }, 1000);

    // Reset and start game
    resetGame();
    updateGameStatus();
}

// Add tournament mode function
function startTournamentMode() {
    // Hide game mode selection
    const modeSelection = document.getElementById('game-mode-selection');
    if (modeSelection) {
        modeSelection.style.display = 'none';
    }

    // Reset game state
    score = { player1: 0, player2: 0 };
    roundNumber = 1;
    maxRounds = 3;
    gameTime = 0;

    // Show game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.visibility = 'visible';
    }

    // Reset and start game
    resetGame();
    updateGameStatus();
}

// Add visual effects for hits
function createHitEffect(x, y, isDirectHit) {
    const effect = document.createElement('div');
    effect.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        transform: translate(-50%, -50%);
        font-size: ${isDirectHit ? '24px' : '18px'};
        color: ${isDirectHit ? '#FFD700' : '#FF5722'};
        text-shadow: 0 0 10px ${isDirectHit ? '#FFD700' : '#FF5722'};
        font-weight: bold;
        pointer-events: none;
        animation: hitEffect 1s ease-out forwards;
    `;
    effect.textContent = isDirectHit ? 'DIRECT HIT!' : 'HIT!';
    document.body.appendChild(effect);

    setTimeout(() => effect.remove(), 1000);
}

// Update the fireProjectile callback
function handleProjectileHit(x, y) {
    const isPlayer1Turn = turn === 1;
    const targetX = isPlayer1Turn ? player2X : player1X;
    const isDirectHit = Math.abs(x - targetX) <= 20;

    if (isDirectHit) {
        createHitEffect(x, y, true);
        if (gameMode === 'tournament') {
            if (isPlayer1Turn) score.player1++;
            else score.player2++;
            
            if (score.player1 >= 2 || score.player2 >= 2) {
                endGame();
            } else {
                roundNumber++;
                resetGame();
            }
        } else {
            alert(isPlayer1Turn ? 'Player 1 wins!' : 'Player 2 wins!');
            resetGame();
        }
    } else {
        createHitEffect(x, y, false);
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
    updateGameStatus();
}

// End game function
function endGame() {
    let message = '';
    if (gameMode === 'quick') {
        message = `Time's up!\nFinal Score:\nPlayer 1: ${score.player1}\nPlayer 2: ${score.player2}`;
    } else if (gameMode === 'tournament') {
        message = `Tournament Over!\nFinal Score:\nPlayer 1: ${score.player1}\nPlayer 2: ${score.player2}`;
    }
    
    if (message) {
        alert(message);
        document.getElementById('game-mode-selection').style.display = 'block';
    }
}

// Add CSS for hit effect animation
const style = document.createElement('style');
style.textContent = `
    @keyframes hitEffect {
        0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -100%) scale(1.5);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Create user interface for business features
function createBusinessUI() {
    // Create main menu
    const mainMenu = document.createElement('div');
    mainMenu.id = 'main-menu';
    mainMenu.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        padding: 30px;
        border-radius: 20px;
        color: white;
        text-align: center;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        z-index: 1000;
        min-width: 300px;
    `;

    // Add user info section
    const userInfo = document.createElement('div');
    userInfo.style.cssText = `
        margin-bottom: 20px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    `;
    userInfo.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 10px;">Welcome, ${userData.username || 'Player'}</div>
        <div style="display: flex; justify-content: space-around;">
            <div>Level: ${userData.level}</div>
            <div>XP: ${userData.experience}</div>
        </div>
    `;
    mainMenu.appendChild(userInfo);

    // Add menu buttons
    const buttons = [
        { id: 'play', text: 'Play Game', action: () => showGameModes() },
        { id: 'leaderboard', text: 'Leaderboard', action: () => showLeaderboard() }
    ];

    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.style.cssText = `
            display: block;
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 16px;
        `;
        button.onmouseover = () => button.style.background = 'rgba(255, 255, 255, 0.2)';
        button.onmouseout = () => button.style.background = 'rgba(255, 255, 255, 0.1)';
        button.onclick = btn.action;
        mainMenu.appendChild(button);
    });

    document.body.appendChild(mainMenu);
}

// Show leaderboard
function showLeaderboard() {
    const leaderboardContainer = document.createElement('div');
    leaderboardContainer.id = 'leaderboard-container';
    leaderboardContainer.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        padding: 20px;
        border-radius: 15px;
        color: white;
        backdrop-filter: blur(10px);
        z-index: 1001;
        width: 80%;
        max-width: 500px;
    `;

    // Add leaderboard title
    const title = document.createElement('h2');
    title.textContent = 'Global Leaderboard';
    title.style.cssText = `
        color: #4CAF50;
        text-align: center;
        margin-bottom: 20px;
    `;
    leaderboardContainer.appendChild(title);

    // Add leaderboard entries (mock data)
    const entries = [
        { rank: 1, username: 'ProGamer123', score: 1500, level: 50 },
        { rank: 2, username: 'TankMaster', score: 1200, level: 45 },
        { rank: 3, username: 'BattleKing', score: 1000, level: 40 }
    ];

    entries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
        `;

        entryElement.innerHTML = `
            <div style="font-weight: bold; color: ${entry.rank === 1 ? '#FFD700' : 
                                                   entry.rank === 2 ? '#C0C0C0' : 
                                                   entry.rank === 3 ? '#CD7F32' : 'white'}">
                #${entry.rank}
            </div>
            <div>${entry.username}</div>
            <div>Level ${entry.level}</div>
            <div>${entry.score} points</div>
        `;

        leaderboardContainer.appendChild(entryElement);
    });

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
        display: block;
        margin: 20px auto 0;
        padding: 8px 20px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 5px;
        color: white;
        cursor: pointer;
    `;
    closeButton.onclick = () => leaderboardContainer.remove();
    leaderboardContainer.appendChild(closeButton);

    document.body.appendChild(leaderboardContainer);
}

// Add function to handle ad refresh
function refreshAds() {
    // This function would be implemented with your ad network's refresh mechanism
    console.log('Refreshing ads...');
}

// Create ad containers
function createAdContainers() {
    // Create container for ads
    const adContainer = document.createElement('div');
    adContainer.id = 'ad-container';
    adContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
    `;
    document.body.appendChild(adContainer);

    // Top ad
    const topAd = document.createElement('div');
    topAd.id = AD_CONFIG.positions.top.id;
    topAd.style.cssText = `
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: ${AD_CONFIG.positions.top.width};
        height: ${AD_CONFIG.positions.top.height};
        background: rgba(0, 0, 0, 0.1);
        pointer-events: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #666;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    topAd.innerHTML = 'Advertisement Space';
    adContainer.appendChild(topAd);

    // Side ad
    const sideAd = document.createElement('div');
    sideAd.id = AD_CONFIG.positions.side.id;
    sideAd.style.cssText = `
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: ${AD_CONFIG.positions.side.width};
        height: ${AD_CONFIG.positions.side.height};
        background: rgba(0, 0, 0, 0.1);
        pointer-events: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #666;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    sideAd.innerHTML = 'Advertisement Space';
    adContainer.appendChild(sideAd);

    // Bottom ad
    const bottomAd = document.createElement('div');
    bottomAd.id = AD_CONFIG.positions.bottom.id;
    bottomAd.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: ${AD_CONFIG.positions.bottom.width};
        height: ${AD_CONFIG.positions.bottom.height};
        background: rgba(0, 0, 0, 0.1);
        pointer-events: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #666;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    bottomAd.innerHTML = 'Advertisement Space';
    adContainer.appendChild(bottomAd);
}

// Add missing functions
function showProfile() {
    const profileContainer = document.createElement('div');
    profileContainer.id = 'profile-container';
    profileContainer.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        padding: 20px;
        border-radius: 15px;
        color: white;
        backdrop-filter: blur(10px);
        z-index: 1001;
        width: 80%;
        max-width: 500px;
    `;

    profileContainer.innerHTML = `
        <h2 style="color: #4CAF50; margin-bottom: 20px;">Player Profile</h2>
        <div style="margin-bottom: 20px;">
            <div style="margin: 10px 0;">
                <strong>Username:</strong> ${userData.username || 'Player'}
            </div>
            <div style="margin: 10px 0;">
                <strong>Level:</strong> ${userData.level}
            </div>
            <div style="margin: 10px 0;">
                <strong>Experience:</strong> ${userData.experience}
            </div>
            <div style="margin: 10px 0;">
                <strong>Games Played:</strong> ${gameStats.gamesPlayed}
            </div>
            <div style="margin: 10px 0;">
                <strong>Wins:</strong> ${gameStats.wins}
            </div>
            <div style="margin: 10px 0;">
                <strong>Best Score:</strong> ${gameStats.bestScore}
            </div>
        </div>
    `;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
        display: block;
        margin: 20px auto 0;
        padding: 8px 20px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 5px;
        color: white;
        cursor: pointer;
    `;
    closeButton.onclick = () => profileContainer.remove();
    profileContainer.appendChild(closeButton);

    document.body.appendChild(profileContainer);
}

function startClassicMode() {
    // Hide game mode selection
    const modeSelection = document.getElementById('game-mode-selection');
    if (modeSelection) {
        modeSelection.style.display = 'none';
    }

    // Reset game state
    score = { player1: 0, player2: 0 };
    roundNumber = 1;
    maxRounds = 1; // Classic mode is single round
    gameTime = 0;

    // Show game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.visibility = 'visible';
    }

    // Reset and start game
    resetGame();
    updateGameStatus();
}

// Add game status update function
function updateGameStatus() {
    const scoreDisplay = document.getElementById('score-display');
    const roundDisplay = document.getElementById('round-display');
    const timerDisplay = document.getElementById('timer-display');

    if (scoreDisplay) {
        scoreDisplay.innerHTML = `
            <span style="color: #4CAF50">Player 1: ${score.player1}</span> | 
            <span style="color: #FF5722">Player 2: ${score.player2}</span>
        `;
    }

    if (roundDisplay) {
        roundDisplay.textContent = `Round ${roundNumber}/${maxRounds}`;
    }

    if (timerDisplay && gameMode === 'quick') {
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        timerDisplay.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Add game mode selection function
function showGameModes() {
    // Hide main menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        mainMenu.style.display = 'none';
    }

    // Create game mode selection container
    const modeContainer = document.createElement('div');
    modeContainer.id = 'game-mode-selection';
    modeContainer.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        padding: 20px;
        border-radius: 15px;
        color: white;
        text-align: center;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        z-index: 1000;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Select Game Mode';
    title.style.cssText = `
        margin-bottom: 20px;
        color: #4CAF50;
    `;
    modeContainer.appendChild(title);

    const modes = [
        { id: 'classic', name: 'Classic Mode', desc: 'Traditional turn-based gameplay' },
        { id: 'quick', name: 'Quick Mode', desc: '3-minute time limit, fast-paced action' },
        { id: 'tournament', name: 'Tournament Mode', desc: 'Best of 3 rounds' }
    ];

    modes.forEach(mode => {
        const button = document.createElement('button');
        button.textContent = mode.name;
        button.style.cssText = `
            display: block;
            width: 200px;
            padding: 10px;
            margin: 10px auto;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        button.onmouseover = () => button.style.background = 'rgba(255, 255, 255, 0.2)';
        button.onmouseout = () => button.style.background = 'rgba(255, 255, 255, 0.1)';
        button.onclick = () => startGameMode(mode.id);
        modeContainer.appendChild(button);

        const desc = document.createElement('div');
        desc.textContent = mode.desc;
        desc.style.cssText = `
            font-size: 12px;
            color: #aaa;
            margin-bottom: 15px;
        `;
        modeContainer.appendChild(desc);
    });

    // Add back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back to Menu';
    backButton.style.cssText = `
        display: block;
        width: 200px;
        padding: 10px;
        margin: 20px auto 0;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    backButton.onmouseover = () => backButton.style.background = 'rgba(255, 255, 255, 0.2)';
    backButton.onmouseout = () => backButton.style.background = 'rgba(255, 255, 255, 0.1)';
    backButton.onclick = () => {
        modeContainer.remove();
        if (mainMenu) {
            mainMenu.style.display = 'block';
        }
    };
    modeContainer.appendChild(backButton);

    document.body.appendChild(modeContainer);
}

init();