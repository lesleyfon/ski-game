import { Player } from "./player.js";

class Game extends Player {
	/**@type {number} */ #canvasWidth;
	/**@type {number} */ #canvasHeight;

	/**@type {HTMLCanvasElement} */ #canvasDocument;
	/**@type {CanvasRenderingContext2D} */ #context;

	/**@type {number} */ #cellDimension;
	/**@type {number} */ totalNumOfRows;
	/**@type {number} */ totalGridCols = 10;
	/**
	 * @description Determine if the game is running or not
	 * @type {boolean}
	 */
	isRunning = false;

	/** @type {number | null} */ intervalId = null;

	/** @type {Array<Array<{row: number, col: number}>>} */ #canvasGrid = [];
	/** @type {[]string} */ #obstacles = ["🪨", "🌲", "💣"];

	/** @type {Array<Array<{row: number, col: number, obstacle: string}>>} */ #fallingObstacles =
		[];
	constructor() {
		super();
		this.#canvasDocument = document.getElementById("game-canvas");
		this.#context = this.#canvasDocument.getContext("2d");

		this.#canvasWidth = 700;
		this.#canvasHeight = window.innerHeight - 200;
	}

	/**
	 * Sets the canvas dimensions based on predefined width and height values
	 * @private
	 * @description Initializes the game canvas with dimensions calculated from window size and preset width
	 * @throws {TypeError} If canvas element is not found in the DOM
	 * @returns {void}
	 */
	#setCanvasWidthAndHeight() {
		this.#canvasDocument.height = this.#canvasHeight;
		this.#canvasDocument.width = this.#canvasWidth;
	}

	/**
	 * Generates a grid based on the canvas dimensions
	 * @private
	 * @description Creates a grid of cells based on the canvas width and height
	 * @returns {void}
	 */
	#generateGrid() {
		this.#cellDimension = this.#canvasWidth / this.totalGridCols; // Dynamically generate this number to get cell width base on the canvas width. And there should be ten cols in a row
		this.totalNumOfRows = Math.floor(this.#canvasHeight / this.#cellDimension);

		for (let row = 0; row < this.totalNumOfRows; row += 1) {
			const currRow = [];
			for (let col = 0; col < this.#cellDimension; col += 1) {
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
		this.#context.clearRect(0, 0, this.#canvasWidth, this.#canvasHeight);
		this.#context.fillStyle = "white";
		this.#context.stroke = "#000000";
		this.#context.lineWidth = 0.5;

		for (let row = 0; row < this.totalNumOfRows; row += 1) {
			for (let col = 0; col < this.#cellDimension; col += 1) {
				/**@description  draws a rectangle that is filled according to the current fill style*/
				this.#context.fillRect(
					col * this.#cellDimension,
					row * this.#cellDimension,
					this.#cellDimension * this.totalGridCols,
					this.#cellDimension * this.totalGridCols
				);
				this.#context.strokeRect(
					col * this.#cellDimension,
					row * this.#cellDimension,
					this.#cellDimension,
					this.#cellDimension
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
		const x = col * this.#cellDimension + this.#cellDimension / 2;
		const y = row * this.#cellDimension + this.#cellDimension / 2;

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
		this.#placeItemToGrid(this.#cellDimension);

		this.#context.fillText(this.playerCharacter, x, y);
	};

	/**
	 * Removes an item from its previous position on the grid
	 * @description Clears a cell by drawing a rectangle over it
	 * @param {{row: number, col: number}} dimensions - The dimensions of the cell
	 * @returns {void}
	 */
	removeItemFromPrevPosition = ({ row, col }) => {
		this.#context.clearRect(
			col * this.#cellDimension,
			row * this.#cellDimension,
			this.#cellDimension,
			this.#cellDimension
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
		this.#context.font = `${dimensions * 0.8}px Arial`; // Scale font to cell size: ;
		this.#context.textAlign = "center";
		this.#context.textBaseline = "middle";
	}

	/**
	 * Initializes the game by setting up the canvas, grid, and placing the player and obstacles
	 * @description Sets up the game environment and starts the game loop
	 * @returns {void}
	 */
	startGame() {
		// Set Canvas height
		this.#setCanvasWidthAndHeight();

		// Create game grid
		this.#generateGrid();

		// Uncomment this to draw the grid lines
		// this.#drawGridLines();

		// Place player and obstacles on the grid
		this.placePlayer();
		this.placeObstacleOnGrid();

		// Start the game loop
		this.isRunning = true;
		this.intervalId = setInterval(() => {
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
		let count = 0;

		while (count < totalNumOfObstacles) {
			const col = Math.floor(Math.random() * this.totalGridCols);

			if (!alreadyTakenPosition.has(col)) {
				alreadyTakenPosition.add(col);

				const obstacleIdx = Math.floor(Math.random() * this.#obstacles.length);

				obstaclePosition.push({
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

		this.#placeItemToGrid(this.#cellDimension);

		obstacles.forEach(({ col, obstacle }) => {
			const { x, y } = this.#calculateCoordinatesPosition(this.totalNumOfRows, col);
			this.#context.fillText(obstacle, x, y);
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
				this.#placeItemToGrid(this.#cellDimension);

				this.#context.fillText(item.obstacle, x, y);
			});
		});

		// After moving all obstacles, place new Obstacles to the grid
		this.placeObstacleOnGrid();
		this.playerContactedObstacle();
	}

	/**
	 * Checks if the player has contacted an obstacle
	 * @description Iterates through falling obstacles to check for player contact
	 * @returns {void}
	 */
	playerContactedObstacle() {
		this.#fallingObstacles.forEach((obstacle) => {
			obstacle.forEach((item) => {
				if (item.row === this.playerPosition.row && item.col === this.playerPosition.col) {
					// Stop Game from running
					this.isRunning = false;
					// Stop Game from running
					clearInterval(this.intervalId);
					// Update Game Status
					this.updateGameStatus();
				}
			});
		});
	}

	/**
	 * Updates the game status displayed in the DOM
	 * @private
	 * @description Changes the text content of the game status element
	 * @returns {void}
	 */
	updateGameStatus() {
		const gameStatusText = document.getElementById("game-status-text");
		gameStatusText.textContent = this.isRunning ? "Running" : "Game Over";
	}
	// --- END OF CLASS ---
}

const game = new Game();

game.startGame();

document.addEventListener("keydown", (event) => {
	if (game.isRunning) {
		game.movePlayer(event, {
			totalNumOfRows: game.totalNumOfRows,
			placePlayer: game.placePlayer,
			removePlayerFromPrevPosition: game.removeItemFromPrevPosition,
		});

		game.playerContactedObstacle();
	}
});
