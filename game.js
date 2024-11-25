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

	/** @type {Array<Array<{row: number, col: number, obstacle: string}>>} */ #fallingObstacles =
		[];
	/** @type {Set<string>} */ #rowsSeenSet = new Set();

	constructor() {
		super();
		this.canvasConfig = new CanvasConfig(700, window.innerHeight - 200);
		this.canvasConfig.initialize();
	}

	/**
	 * Generates a grid based on the canvas dimensions
	 * @private
	 * @description Creates a grid of cells based on the canvas width and height
	 * @returns {void}
	 */
	#generateGrid() {
		this.canvasConfig.cellDimension = this.canvasConfig.width / this.totalGridCols; // Dynamically generate this number to get cell width base on the canvas width. And there should be ten cols in a row
		this.totalNumOfRows = Math.floor(
			this.canvasConfig.height / this.canvasConfig.cellDimension
		);

		for (let row = 0; row < this.totalNumOfRows; row += 1) {
			const currRow = [];
			for (let col = 0; col < this.canvasConfig.cellDimension; col += 1) {
				currRow.push({ row, col });
			}
			this.#canvasGrid.push(currRow);
		}
	}

	/**
	 * Draws grid lines on the canvas
	 * @private
	 * @description Draws grid lines to visualize the grid structure
	 * @returns {void}
	 */
	#drawGridLines() {
		this.canvasConfig.context.clearRect(
			0,
			0,
			this.canvasConfig.width,
			this.canvasConfig.height
		);
		this.canvasConfig.context.fillStyle = "white";
		this.canvasConfig.context.stroke = "#000000";
		this.canvasConfig.context.lineWidth = 0.5;

		for (let row = 0; row < this.totalNumOfRows; row += 1) {
			for (let col = 0; col < this.canvasConfig.cellDimension; col += 1) {
				/**@description  draws a rectangle that is filled according to the current fill style*/
				this.canvasConfig.context.fillRect(
					col * this.canvasConfig.cellDimension,
					row * this.canvasConfig.cellDimension,
					this.canvasConfig.cellDimension * this.totalGridCols,
					this.canvasConfig.cellDimension * this.totalGridCols
				);
				this.canvasConfig.context.strokeRect(
					col * this.canvasConfig.cellDimension,
					row * this.canvasConfig.cellDimension,
					this.canvasConfig.cellDimension,
					this.canvasConfig.cellDimension
				);
			}
		}
	}

	/**
	 * Calculates the coordinates position of an item on the grid
	 * @private
	 * @description Computes the center coordinates of a cell based on its row and column indices
	 * @param {number} row - The row index of the cell
	 * @param {number} col - The column index of the cell
	 * @returns {{x:number, y:number}} - An object containing the x and y coordinates
	 */
	#calculateCoordinatesPosition(row, col) {
		const x = col * this.canvasConfig.cellDimension + this.canvasConfig.cellDimension / 2;
		const y = row * this.canvasConfig.cellDimension + this.canvasConfig.cellDimension / 2;

		return {
			x,
			y,
		};
	}

	/**
	 * Places the player on the grid
	 * @description Calculates and places the player on the grid based on their current position
	 * @returns {void}
	 */
	placePlayer = () => {
		const { x, y } = this.#calculateCoordinatesPosition(
			this.playerPosition.row,
			this.playerPosition.col
		);

		// Add these font settings
		this.#placeItemToGrid(this.canvasConfig.cellDimension);

		this.canvasConfig.context.fillText(this.playerCharacter, x, y);
	};

	/**
	 * Removes an item from its previous position on the grid
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
	 * Sets the font properties for text rendering
	 * @private
	 * @description Configures the canvas context for text rendering with specified dimensions
	 * @param {number} dimensions - The dimensions of the cell
	 * @returns {void}
	 */
	#placeItemToGrid(dimensions) {
		this.canvasConfig.context.font = `${dimensions * 0.8}px Arial`; // Scale font to cell size: ;
		this.canvasConfig.context.textAlign = "center";
		this.canvasConfig.context.textBaseline = "middle";
	}

	/**
	 * Initializes the game by setting up the canvas, grid, and placing the player and obstacles
	 * @description Sets up the game environment and starts the game loop
	 * @returns {void}
	 */
	startGame() {
		// Set Canvas height
		this.canvasConfig.initialize();

		// Create game grid
		this.#generateGrid();

		// Uncomment this to draw the grid lines
		// this.#drawGridLines();

		// Place player and obstacles on the grid
		this.placePlayer();
		this.placeObstacleOnGrid();

		// Start the game loop
		this.gameState.isRunning = true;
		this.gameState.intervalId = setInterval(() => {
			this.#moveObstacles();
		}, 2000);
	}

	/**
	 * Generates the number of obstacles per row
	 * @private
	 * @description Randomly determines the number of obstacles to be placed in a row
	 * @returns {number} - The number of obstacles to be placed in a row
	 */
	#generateObstaclesNumberPerRow() {
		return Math.floor(Math.random() * 4) + 1;
	}

	/**
	 * Generates the positions of obstacles on the grid
	 * @private
	 * @description Determines obstacle positions and ensures no overlap
	 * @returns {Array<{row: number, col: number, obstacle: string}>} - An array of obstacle positions and types
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

				obstaclePosition.push({
					obstacleRowId,
					row: this.totalNumOfRows,
					col,
					obstacle: this.#obstacles[obstacleIdx],
				});
				count += 1;
			}
		}
		return obstaclePosition;
	}

	/**
	 * Places obstacles on the grid
	 * @private
	 * @description Generates obstacle positions and places them on the grid
	 * @returns {void}
	 */
	placeObstacleOnGrid() {
		const obstacles = this.generateObstaclePosition();

		this.#placeItemToGrid(this.canvasConfig.cellDimension);

		obstacles.forEach(({ col, obstacle }) => {
			const { x, y } = this.#calculateCoordinatesPosition(this.totalNumOfRows, col);
			this.canvasConfig.context.fillText(obstacle, x, y);
		});
		this.#fallingObstacles.push(obstacles);
	}

	/**
	 * Moves obstacles down the grid
	 * @private
	 * @description Updates obstacle positions and redraws them on the grid
	 * @returns {void}
	 */
	#moveObstacles() {
		this.#fallingObstacles.forEach((obstacle) => {
			obstacle.forEach((item) => {
				this.removeItemFromPrevPosition({
					row: item.row,
					col: item.col,
				});

				item.row = item.row - 1;

				const { x, y } = this.#calculateCoordinatesPosition(item.row, item.col);

				// Add these font settings
				this.#placeItemToGrid(this.canvasConfig.cellDimension);

				this.canvasConfig.context.fillText(item.obstacle, x, y);
			});
		});

		// After moving all obstacles, place new Obstacles to the grid
		this.placeObstacleOnGrid();
		this.playerContactedObstacle();
	}

	/**
	 * Handles collision detection and scoring for a single obstacle
	 * @private
	 * @param {{row: number, col: number, obstacleRowId: string, obstacle: string}} item - The obstacle to check
	 * @returns {boolean} - Returns true if game should stop, false to continue
	 */
	#handleObstacleCollision(item) {
		if (item.row !== this.playerPosition.row) {
			return false;
		}

		// Check for direct collision with player
		if (item.col === this.playerPosition.col) {
			this.gameState.isRunning = false;
			clearInterval(this.gameState.intervalId);
			this.updateGameStatus();
			return true;
		}

		// Update score if row hasn't been counted yet
		if (!this.#rowsSeenSet.has(item.obstacleRowId) && this.gameState.isRunning) {
			this.#rowsSeenSet.add(item.obstacleRowId);
			this.gameState.score += 1;
			this.updateGameScore();
		}

		return false;
	}

	/**
	 * Checks if the player has contacted an obstacle
	 * @description Iterates through falling obstacles to check for player contact
	 * @returns {void}
	 */
	playerContactedObstacle() {
		for (let i = 0; i < this.#fallingObstacles.length; i++) {
			const obstacleRow = this.#fallingObstacles[i];

			for (let j = 0; j < obstacleRow.length; j++) {
				const item = obstacleRow[j];
				const collided = this.#handleObstacleCollision(item);
				if (collided) {
					break;
				}
			}
		}
	}

	/**
	 * Updates the game status displayed in the DOM
	 * @private
	 * @description Changes the text content of the game status element
	 * @returns {void}
	 */
	updateGameStatus() {
		const gameStatusText = document.getElementById("game-status-text");
		gameStatusText.textContent = this.gameState.isRunning ? "Running" : "Game Over";
	}

	/**
	 * Updates the game score displayed in the DOM
	 * @private
	 * @description Changes the text content of the game score element
	 * @returns {void}
	 */
	updateGameScore() {
		const gameScoreText = document.getElementById("game-score");
		gameScoreText.textContent = this.gameState.score;
	}
	// --- END OF CLASS ---
}

const game = new Game();

game.startGame();

document.addEventListener("keydown", (event) => {
	if (game.gameState.isRunning) {
		game.movePlayer(event, {
			totalNumOfRows: game.totalNumOfRows,
			placePlayer: game.placePlayer,
			removePlayerFromPrevPosition: game.removeItemFromPrevPosition,
			totalGridCols: game.totalGridCols - 1,
		});

		game.playerContactedObstacle();
	}
});
