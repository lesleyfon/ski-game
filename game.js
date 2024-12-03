import { Player } from "./player.js";
import GameState from "./game-state.js";
import CanvasConfig from "./canvas.js";

class Game extends Player {
	/**@type {CanvasConfig} */ canvasConfig;
	/**@type {number} */ totalNumOfRows;
	/**@type {number} */ totalGridCols = 10;

	/**@type {GameState} */ gameState = new GameState();

	/** @type {Array<Array<{row: number, col: number}>>} */ #canvasGrid = [];
	/** @type {[]string} */ #obstacles = ["🪨", "🌲", "💣", "🦬"];

	/** @type {Array<{x: number, y: number, col: number, row: number, obstacle: string, obstacleRowId: string}>} */ #fallingObstacles =
		[];
	/** @type {Set<string>} */ #rowsSeenSet = new Set();

	/** @type {{x: number, y: number, dx: number, dy: number, speed: number}} */
	#playerVelocity = {
		x: 0,
		y: 0,
		dx: 0,
		dy: 0,
		speed: 5,
	};

	/** @type {boolean} */ #isMovingLeft = false;
	/** @type {boolean} */ #isMovingRight = false;
	/** @type {boolean} */ #isMovingUp = false;
	/** @type {boolean} */ #isMovingDown = false;

	/**
	 * @type {number}
	 * @description Probability of spawning new obstacles each frame (0-1).
	 * Lower values mean less frequent spawns:
	 * - 0.001 ≈ 1 spawn every 1000 frames
	 * - 0.01 ≈ 1 spawn every 100 frames
	 * - 0.05 ≈ 1 spawn every 20 frames
	 */
	#obstacleSpawnRate = 0.009;

	constructor() {
		super();
		this.canvasConfig = new CanvasConfig(700, window.innerHeight - 200);
		this.canvasConfig.initialize();
		this.#initializeControls();
	}

	/**
	 * @private
	 * @description Calculates the cell dimension based on the canvas width and total number of columns
	 * @returns {void}
	 */
	#generateGrid() {
		this.canvasConfig.cellDimension = this.canvasConfig.width / this.totalGridCols;
	}

	/**
	 * @description Calculates and places the player on the canvas based on their current position
	 * @returns {void}
	 */
	placePlayer = () => {
		const x = this.#playerVelocity.x + this.canvasConfig.cellDimension / 2;
		const y = this.#playerVelocity.y + this.canvasConfig.cellDimension / 2;

		this.#placeItemToGrid(this.canvasConfig.cellDimension);
		this.canvasConfig.context.fillText(this.playerCharacter, x, y);
	};

	/**
	 * @description Clears a cell by drawing a rectangle over it
	 * @param {{row: number, col: number}} dimensions - The dimensions of the cell
	 * @returns {void}
	 */
	removeItemFromPrevPosition = ({ row, col }) => {
		this.canvasConfig.context.clearRect(
			col * this.canvasConfig.cellDimension,
			row * this.canvasConfig.cellDimension,
			this.canvasConfig.cellDimension,
			this.canvasConfig.cellDimension
		);
	};

	/**
	 * @description Sets the font properties for text rendering
	 * @param {number} dimensions - The dimensions of the cell
	 * @returns {void}
	 */
	#placeItemToGrid(dimensions) {
		this.canvasConfig.context.font = `${dimensions * 0.8}px Arial`; // Scale font to cell size: ;
		this.canvasConfig.context.textAlign = "center";
		this.canvasConfig.context.textBaseline = "middle";
	}

	/**
	 * @description Initializes the game by setting up the canvas, grid, and placing the player and obstacles
	 * @returns {void}
	 */
	startGame() {
		this.canvasConfig.initialize();
		this.#generateGrid();
		this.placePlayer();
		this.placeObstacleOnGrid();

		this.gameState.isRunning = true;
		this.#gameLoop();
	}

	/**
	 * @private
	 * @description Generates the number of obstacles per row
	 * @returns {number} - The number of obstacles to be placed in a row
	 */
	#generateObstaclesNumberPerRow() {
		return Math.floor(Math.random() * 4);
	}

	/**
	 * @private
	 * @description Generates the positions of obstacles on the grid
	 * @returns {Array<{x: number, y: number, col: number, row: number, obstacle: string, obstacleRowId: string}>}
	 */
	generateObstaclePosition() {
		const totalNumOfObstacles = this.#generateObstaclesNumberPerRow();
		const alreadyTakenPosition = new Set();
		const obstaclePosition = [];
		const obstacleRowId = crypto.randomUUID();
		let count = 0;

		while (count < totalNumOfObstacles) {
			const col = Math.floor(Math.random() * this.totalGridCols);

			if (!alreadyTakenPosition.has(col)) {
				alreadyTakenPosition.add(col);
				const obstacleIdx = Math.floor(Math.random() * this.#obstacles.length);

				// Calculate pixel positions
				const x = col * this.canvasConfig.cellDimension;
				const y = this.canvasConfig.height; // Start from bottom of canvas

				obstaclePosition.push({
					obstacleRowId,
					row: this.totalNumOfRows,
					col,
					x,
					y,
					obstacle: this.#obstacles[obstacleIdx],
				});
				count += 1;
			}
		}
		return obstaclePosition;
	}

	/**
	 * @description Places obstacles on the grid
	 * @returns {void}
	 */
	placeObstacleOnGrid() {
		const obstacles = this.generateObstaclePosition();
		this.#placeItemToGrid(this.canvasConfig.cellDimension);

		obstacles.forEach((obstacle) => {
			this.canvasConfig.context.fillText(
				obstacle.obstacle,
				obstacle.x + this.canvasConfig.cellDimension / 2,
				obstacle.y + this.canvasConfig.cellDimension / 2
			);
		});

		this.#fallingObstacles.push(...obstacles);
	}

	/**
	 * @description Moves obstacles up the grid
	 * @returns {void}
	 */
	#moveObstacles() {
		const moveSpeed = 1; // Adjust this value to change obstacle speed

		// Remove obstacles that have moved off the top of the screen
		this.#fallingObstacles = this.#fallingObstacles.filter(
			(obstacle) => obstacle.y > -this.canvasConfig.cellDimension
		);

		// Move remaining obstacles
		this.#fallingObstacles.forEach((obstacle) => {
			// Update pixel position
			obstacle.y -= moveSpeed;

			// Update grid position
			const gridPosition = obstacle.y / this.canvasConfig.cellDimension;
			obstacle.row = Math.floor(gridPosition);

			// Draw obstacle
			this.#placeItemToGrid(this.canvasConfig.cellDimension);
			this.canvasConfig.context.fillText(
				obstacle.obstacle,
				obstacle.x + this.canvasConfig.cellDimension / 2,
				obstacle.y + this.canvasConfig.cellDimension / 2
			);
		});

		// Generate new obstacles periodically
		if (Math.random() < this.#obstacleSpawnRate) {
			this.placeObstacleOnGrid();
		}
	}

	/**
	 * @description Handles collision detection and scoring for a single obstacle
	 * @param {{x: number, y: number, col: number, row: number, obstacle: string, obstacleRowId: string}} obstacle
	 * @returns {boolean}
	 */
	#handleObstacleCollision(obstacle) {
		// Calculate the centers of both player and obstacle
		const playerCenterX = this.#playerVelocity.x + this.canvasConfig.cellDimension / 2;
		const playerCenterY = this.#playerVelocity.y + this.canvasConfig.cellDimension / 2;

		// Calculate the center of the obstacle
		const obstacleCenterX = obstacle.x + this.canvasConfig.cellDimension / 2;
		const obstacleCenterY = obstacle.y + this.canvasConfig.cellDimension / 2;

		// Calculate collision distance
		const collisionDistance = this.canvasConfig.cellDimension * 0.7; // Slightly smaller than cell size

		// Calculate the distance between the player and the obstacle
		const x = Math.pow(playerCenterX - obstacleCenterX, 2);
		const y = Math.pow(playerCenterY - obstacleCenterY, 2);

		const actualDistance = Math.sqrt(x + y);

		// Check for collision
		if (actualDistance < collisionDistance) {
			this.gameState.isRunning = false;
			this.updateGameStatus();
			return true;
		}

		// Update score if obstacle passes player
		if (
			!this.#rowsSeenSet.has(obstacle.obstacleRowId) &&
			obstacle.y < this.#playerVelocity.y &&
			this.gameState.isRunning
		) {
			this.#rowsSeenSet.add(obstacle.obstacleRowId);
			this.gameState.score += 1;
			this.updateGameScore();
		}

		return false;
	}

	/**
	 * @description Checks for collisions between player and obstacles
	 * @returns {void}
	 */
	playerContactedObstacle() {
		for (const obstacle of this.#fallingObstacles) {
			if (this.#handleObstacleCollision(obstacle)) {
				break;
			}
		}
	}

	/**
	 * @description Updates the game status displayed in the DOM
	 * @returns {void}
	 */
	updateGameStatus() {
		const gameStatusText = document.getElementById("game-status-text");
		gameStatusText.textContent = this.gameState.isRunning ? "Running" : "Game Over";
	}

	/**
	 * @description Updates the game score displayed in the DOM
	 * @returns {void}
	 */
	updateGameScore() {
		const gameScoreText = document.getElementById("game-score");
		gameScoreText.textContent = this.gameState.score;
	}

	/**
	 * @description The main game loop
	 * @returns {void}
	 */
	#gameLoop = () => {
		if (!this.gameState.isRunning) return;

		// Clear the canvas
		this.canvasConfig.context.clearRect(
			0,
			0,
			this.canvasConfig.width,
			this.canvasConfig.height
		);

		this.#handlePlayerMovement();
		this.#moveObstacles();
		this.placePlayer(); // Draw player last so it appears on top
		this.playerContactedObstacle();

		// Request the next frame
		requestAnimationFrame(this.#gameLoop);
	};

	/**
	 * @description Updates the player's position based on their velocity
	 * @returns {void}
	 */
	#handlePlayerMovement() {
		// Update position based on velocity
		this.#playerVelocity.x += this.#playerVelocity.dx;
		this.#playerVelocity.y += this.#playerVelocity.dy;

		// Apply friction
		this.#playerVelocity.dx *= 0.9;
		this.#playerVelocity.dy *= 0.9;

		// Convert pixel position to grid position
		const col = Math.floor(this.#playerVelocity.x / this.canvasConfig.cellDimension);
		const row = Math.floor(this.#playerVelocity.y / this.canvasConfig.cellDimension);

		this.playerPosition.col = col;
		this.playerPosition.row = row;

		// Boundary checks for horizontal movement
		if (this.#playerVelocity.x < 0) {
			this.#playerVelocity.x = 0;
			this.#playerVelocity.dx = 0;
		}

		const maxHorizontalPosition = (this.totalGridCols - 1) * this.canvasConfig.cellDimension;
		if (this.#playerVelocity.x > maxHorizontalPosition) {
			this.#playerVelocity.x = maxHorizontalPosition;
			this.#playerVelocity.dx = 0;
		}

		// Boundary checks for vertical movement
		if (this.#playerVelocity.y < 0) {
			this.#playerVelocity.y = 0;
			this.#playerVelocity.dy = 0;
		}

		const maxVerticalPosition = (this.totalNumOfRows - 1) * this.canvasConfig.cellDimension;

		if (this.#playerVelocity.y > maxVerticalPosition) {
			this.#playerVelocity.y = maxVerticalPosition;
			this.#playerVelocity.dy = 0;
		}
	}

	#initializeControls() {
		document.addEventListener("keydown", (event) => {
			if (!this.gameState.isRunning) return;

			switch (event.key) {
				case "ArrowLeft":
					this.#isMovingLeft = true;
					this.#playerVelocity.dx = -this.#playerVelocity.speed;
					break;
				case "ArrowRight":
					this.#isMovingRight = true;
					this.#playerVelocity.dx = this.#playerVelocity.speed;
					break;
				case "ArrowUp":
					this.#isMovingUp = true;
					this.#playerVelocity.dy = -this.#playerVelocity.speed;
					break;
				case "ArrowDown":
					this.#isMovingDown = true;
					this.#playerVelocity.dy = this.#playerVelocity.speed;
					break;
			}
		});

		document.addEventListener("keyup", (event) => {
			switch (event.key) {
				case "ArrowLeft":
					this.#isMovingLeft = false;
					if (!this.#isMovingRight) {
						this.#playerVelocity.dx = 0;
					}
					break;
				case "ArrowRight":
					this.#isMovingRight = false;
					if (!this.#isMovingLeft) {
						this.#playerVelocity.dx = 0;
					}
					break;
				case "ArrowUp":
					this.#isMovingUp = false;
					if (!this.#isMovingDown) {
						this.#playerVelocity.dy = 0;
					}
					break;
				case "ArrowDown":
					this.#isMovingDown = false;
					if (!this.#isMovingUp) {
						this.#playerVelocity.dy = 0;
					}
					break;
			}
		});
	}
	// --- END OF CLASS ---
}

// Initialize and start the game
const game = new Game();
game.startGame();
