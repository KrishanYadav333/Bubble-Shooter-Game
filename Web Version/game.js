// Bubble Shooter Web Version - Game Logic

class BubbleShooter {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextBubbleCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        // Game dimensions
        this.WIDTH = 940;
        this.HEIGHT = 740;
        this.BUBBLE_RADIUS = 20;
        this.BUBBLE_DIAMETER = this.BUBBLE_RADIUS * 2;

        // Colors (matching Python version)
        this.colors = [
            [100, 100, 100],    // grey
            [0, 0, 205],        // blue
            [255, 0, 0],        // red
            [255, 255, 255],    // white
            [255, 192, 203],    // pink
            [255, 229, 180],    // peach
            [255, 105, 180],    // hotpink
            [0, 255, 0],        // green
            [255, 20, 147],     // deeppink
            [0, 164, 180],      // peacockblue
            [128, 49, 167],     // grapecolor
            [255, 198, 0],      // amber
            [0, 174, 239],      // comic
            [217, 217, 214]     // lytgray
        ];

        // Game state
        this.gameState = 'menu'; // menu, playing, gameOver, win
        this.score = 0;
        this.bubbles = [];
        this.shootingBubble = null;
        this.nextBubbleColor = this.getRandomColor();
        this.aiming = false;
        this.aimAngle = Math.PI / 2; // Start pointing up
        this.launcherX = this.WIDTH / 2;
        this.launcherY = this.HEIGHT - 30;

        // Arrow properties
        this.arrowImage = null;
        this.arrowLoaded = false;
        this.arrowWidth = 60;
        this.arrowHeight = 24;
        this.defaultAimAngle = 0; // Point straight up by default (0°)

        // Mouse/Touch handling
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;

        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }

    init() {
        // Set canvas size
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;

        // Load arrow image
        this.loadArrowImage();

        // Create initial bubble grid
        this.createBubbleGrid();

        // Draw next bubble preview
        this.drawNextBubble();
    }

    loadArrowImage() {
        this.arrowImage = new Image();
        this.arrowImage.onload = () => {
            this.arrowLoaded = true;
            console.log('Arrow image loaded successfully', this.arrowImage.width, 'x', this.arrowImage.height);
        };
        this.arrowImage.onerror = () => {
            console.error('Failed to load arrow image');
            // Fallback: create a simple arrow if image fails to load
            this.createFallbackArrow();
        };
        this.arrowImage.src = 'Arrow.png'; // Path relative to web version directory
    }

    createFallbackArrow() {
        // Create a simple arrow shape as fallback
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');

        // Draw a simple arrow pointing right
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(40, 6);
        ctx.lineTo(40, 2);
        ctx.lineTo(60, 12);
        ctx.lineTo(40, 22);
        ctx.lineTo(40, 18);
        ctx.lineTo(0, 18);
        ctx.closePath();
        ctx.fill();

        this.arrowImage = new Image();
        this.arrowImage.src = canvas.toDataURL();
        this.arrowImage.onload = () => {
            this.arrowLoaded = true;
            console.log('Fallback arrow created');
        };
    }

    createBubbleGrid() {
        const rows = 5;
        const cols = 25;
        const startY = 50;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Offset every other row
                const x = col * this.BUBBLE_DIAMETER + (row % 2 === 0 ? this.BUBBLE_RADIUS : 0) + 15;
                const y = row * this.BUBBLE_DIAMETER + startY;

                // Only create bubble if it fits within bounds
                if (x + this.BUBBLE_RADIUS < this.WIDTH - 15) {
                    const color = this.getRandomColor();
                    this.bubbles.push(new Bubble(x, y, color, row, col));
                }
            }
        }
    }

    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Button events
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainButton').addEventListener('click', () => this.restartGame());
    }

    handleMouseDown(e) {
        if (this.gameState !== 'playing') return;

        this.isMouseDown = true;
        this.aiming = true;
        const rect = this.canvas.getBoundingClientRect();
        this.updateAim(e.clientX - rect.left, e.clientY - rect.top);
    }

    handleMouseMove(e) {
        if (!this.aiming) return;
        const rect = this.canvas.getBoundingClientRect();
        this.updateAim(e.clientX - rect.left, e.clientY - rect.top);
    }

    handleMouseUp(e) {
        if (!this.aiming) return;

        this.aiming = false;
        this.isMouseDown = false;
        this.shootBubble();
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (this.gameState !== 'playing') return;

        this.isMouseDown = true;
        this.aiming = true;
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.updateAim(touch.clientX - rect.left, touch.clientY - rect.top);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.aiming) return;

        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.updateAim(touch.clientX - rect.left, touch.clientY - rect.top);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.aiming) return;

        this.aiming = false;
        this.isMouseDown = false;
        this.shootBubble();
    }

    updateAim(mouseX, mouseY) {
        const dx = mouseX - this.launcherX;
        const dy = mouseY - this.launcherY;

        // Calculate angle from launcher to mouse position
        let angle = Math.atan2(dy, dx);

        // Normalize angle to be between -π and π
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;

        // Limit angle to 80° on each side (total 160° range)
        // Allow shooting from -80° to +80° (left to right)
        const minAngle = -Math.PI * 80 / 180; // -80°
        const maxAngle = Math.PI * 80 / 180;  // +80°

        if (angle < minAngle) angle = minAngle;
        if (angle > maxAngle) angle = maxAngle;

        this.aimAngle = angle;

        // Debug logging
        console.log(`Mouse: (${mouseX}, ${mouseY}), Launcher: (${this.launcherX}, ${this.launcherY}), Raw angle: ${(angle * 180 / Math.PI).toFixed(1)}°, Final angle: ${(this.aimAngle * 180 / Math.PI).toFixed(1)}°`);
    }

    shootBubble() {
        if (this.shootingBubble) return;

        this.shootingBubble = new Bubble(
            this.launcherX,
            this.launcherY,
            this.nextBubbleColor,
            -1, -1
        );

        // Set velocity based on aim angle
        const speed = 8;
        this.shootingBubble.vx = Math.cos(this.aimAngle) * speed;
        this.shootingBubble.vy = Math.sin(this.aimAngle) * speed;

        // Get next color
        this.nextBubbleColor = this.getRandomColor();
        this.drawNextBubble();
    }

    drawNextBubble() {
        // Clear next bubble canvas
        this.nextCtx.clearRect(0, 0, 40, 40);

        // Draw next bubble
        this.nextCtx.beginPath();
        this.nextCtx.arc(20, 20, this.BUBBLE_RADIUS, 0, Math.PI * 2);
        this.nextCtx.fillStyle = `rgb(${this.nextBubbleColor[0]}, ${this.nextBubbleColor[1]}, ${this.nextBubbleColor[2]})`;
        this.nextCtx.fill();

        // Draw border
        this.nextCtx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        this.nextCtx.lineWidth = 2;
        this.nextCtx.stroke();

        // Add highlight
        this.nextCtx.beginPath();
        this.nextCtx.arc(15, 15, 5, 0, Math.PI * 2);
        this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.nextCtx.fill();
    }

    startGame() {
        this.gameState = 'playing';
        document.getElementById('gameOverlay').style.display = 'none';
    }

    restartGame() {
        // Reset game state
        this.gameState = 'playing';
        this.score = 0;
        this.bubbles = [];
        this.shootingBubble = null;
        this.nextBubbleColor = this.getRandomColor();

        // Reset UI
        document.getElementById('score').textContent = '0';
        document.getElementById('gameOverlay').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('winScreen').style.display = 'none';

        // Recreate bubble grid
        this.createBubbleGrid();
        this.drawNextBubble();
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Update shooting bubble
        if (this.shootingBubble) {
            this.shootingBubble.x += this.shootingBubble.vx;
            this.shootingBubble.y += this.shootingBubble.vy;

            // Check wall collisions
            if (this.shootingBubble.x <= this.BUBBLE_RADIUS + 15 ||
                this.shootingBubble.x >= this.WIDTH - this.BUBBLE_RADIUS - 15) {
                this.shootingBubble.vx *= -1;
            }

            // Check collision with existing bubbles
            for (let bubble of this.bubbles) {
                const dx = this.shootingBubble.x - bubble.x;
                const dy = this.shootingBubble.y - bubble.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.BUBBLE_DIAMETER) {
                    // Snap to grid position
                    this.snapToGrid(this.shootingBubble);
                    this.shootingBubble = null;
                    break;
                }
            }

            // Check if bubble went off screen
            if (this.shootingBubble && this.shootingBubble.y < -this.BUBBLE_RADIUS) {
                this.shootingBubble = null;
            }
        }

        // Check win/lose conditions
        if (this.bubbles.length === 0) {
            this.gameState = 'win';
            this.showWinScreen();
        }

        // Check if bubbles reached bottom
        for (let bubble of this.bubbles) {
            if (bubble.y + this.BUBBLE_RADIUS >= this.HEIGHT - 50) {
                this.gameState = 'gameOver';
                this.showGameOverScreen();
                break;
            }
        }
    }

    snapToGrid(bubble) {
        // Find closest grid position
        const col = Math.round((bubble.x - 15) / this.BUBBLE_DIAMETER);
        const row = Math.round((bubble.y - 50) / this.BUBBLE_DIAMETER);

        bubble.x = col * this.BUBBLE_DIAMETER + 15 + (row % 2 === 0 ? 0 : this.BUBBLE_RADIUS);
        bubble.y = row * this.BUBBLE_DIAMETER + 50;

        this.bubbles.push(bubble);
    }

    showGameOverScreen() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('gameOverlay').style.display = 'flex';
    }

    showWinScreen() {
        document.getElementById('winScore').textContent = this.score;
        document.getElementById('winScreen').style.display = 'flex';
        document.getElementById('gameOverlay').style.display = 'flex';
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

        // Draw background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.HEIGHT);
        gradient.addColorStop(0, '#000050');
        gradient.addColorStop(1, '#000080');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Draw border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(10, 10, this.WIDTH - 20, this.HEIGHT - 20);

        // Draw bubbles
        for (let bubble of this.bubbles) {
            bubble.draw(this.ctx, this.BUBBLE_RADIUS);
        }

        // Draw shooting bubble
        if (this.shootingBubble) {
            this.shootingBubble.draw(this.ctx, this.BUBBLE_RADIUS);
        }

        // Draw launcher with arrow
        this.drawLauncher();
    }

    drawLauncher() {
        // Draw launcher base
        this.ctx.beginPath();
        this.ctx.arc(this.launcherX, this.launcherY, 25, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw arrow if loaded (always visible)
        if (this.arrowLoaded && this.arrowImage) {
            this.ctx.save();
            this.ctx.translate(this.launcherX, this.launcherY);
            // Use current aim angle if aiming, otherwise use default
            const rotationAngle = this.aiming ? this.aimAngle : this.defaultAimAngle;


            // Rotate arrow to point in the correct direction
            // If fallback arrow points right, rotate -90° to point up initially
            const baseRotation = this.arrowLoaded && this.arrowImage.src.includes('data:') ? -Math.PI / 2 : 0;
            this.ctx.rotate(rotationAngle + baseRotation);

            this.ctx.drawImage(
                this.arrowImage,
                -this.arrowWidth / 2,
                -this.arrowHeight / 2,
                this.arrowWidth,
                this.arrowHeight
            );
            this.ctx.restore();
        }
    }


    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

class Bubble {
    constructor(x, y, color, row, col) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.row = row;
        this.col = col;
        this.vx = 0;
        this.vy = 0;
    }

    draw(ctx, radius) {
        // Draw bubble
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        ctx.fill();

        // Draw border
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add highlight
        ctx.beginPath();
        ctx.arc(this.x - radius * 0.3, this.y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BubbleShooter();
});