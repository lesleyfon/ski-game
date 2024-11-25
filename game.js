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

	intervalId = null;

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
	 * The function sets the width and height of a canvas element to match the page dimensions.
	 */
	#setCanvasWidthAndHeight() {
		this.#canvasDocument.height = this.#canvasHeight;
		this.#canvasDocument.width = this.#canvasWidth;
	}

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

	// TODO: DELETE ME WHEN everything is complete
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

		this.placePlayer();
		this.placeObstacleOnGrid();
	}

	/**
	 *
	 * @returns {{x:number, y:number}} return the players positions on the grid
	 */
	calculatePlayerPosition(row, col) {
		const x = col * this.#cellDimension + this.#cellDimension / 2;
		const y = row * this.#cellDimension + this.#cellDimension / 2;

		return {
			x,
			y,
		};
	}

	placePlayer = () => {
		const { x, y } = this.calculatePlayerPosition(
			this.playerPosition.row,
			this.playerPosition.col
		);

		// Add these font settings
		this.placeItemToGrid(this.#cellDimension);

		this.#context.fillText(this.playerCharacter, x, y);
	};

	removeItemFromPrevPosition = ({ row, col }) => {
		this.#context.clearRect(
			col * this.#cellDimension,
			row * this.#cellDimension,
			this.#cellDimension,
			this.#cellDimension
		);
	};

	placeItemToGrid(dimensions) {
		this.#context.font = `${dimensions * 0.8}px Arial`; // Scale font to cell size: ;
		this.#context.textAlign = "center";
		this.#context.textBaseline = "middle";
	}

	startGame() {
		// Set Canvas height
		this.#setCanvasWidthAndHeight();

		// Create game grid
		this.#generateGrid();
		this.#drawGridLines();
		this.isRunning = true;
		this.intervalId = setInterval(() => {
			this.moveObstacles();
		}, 2000);
	}

	#generateObstaclesNumberPerRow() {
		return Math.floor(Math.random() * 4) + 1;
	}

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

	placeObstacleOnGrid() {
		const obstacles = this.generateObstaclePosition();

		this.placeItemToGrid(this.#cellDimension);

		obstacles.forEach(({ col, obstacle }) => {
			const { x, y } = this.calculatePlayerPosition(this.totalNumOfRows, col);
			this.#context.fillText(obstacle, x, y);
		});
		this.#fallingObstacles.push(obstacles);
	}

	moveObstacles() {
		this.#fallingObstacles.forEach((obstacle) => {
			obstacle.forEach((item) => {
				this.removeItemFromPrevPosition({
					row: item.row,
					col: item.col,
				});

				item.row = item.row - 1;

				const { x, y } = this.calculatePlayerPosition(item.row, item.col);

				// Add these font settings
				this.placeItemToGrid(this.#cellDimension);

				this.#context.fillText(item.obstacle, x, y);
			});
		});
		// After moving all obstacles, place new Obstacles to the grid
		this.placeObstacleOnGrid();
		this.playerContactedObstacle();
	}

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
