import { Player } from "./player.js";

class Game extends Player {
	/**@type {number} */ #canvasWidth;
	/**@type {number} */ #canvasHeight;

	/**@type {HTMLCanvasElement} */ #canvasDocument;
	/**@type {number} */ #cellDimension;
	/**@type {number} */ totalNumOfRows;
	/**@type {number} */ totalGridCols = 10;

	/** @type {Array<Array<{row: number, col: number}>>} */ #canvasGrid = [];
	/** @type {[]string} */ #obstacles = ["🪨", "🌲", "💣"];
	constructor() {
		super();
		this.#canvasDocument = document.getElementById("game-canvas");
		const fullPageWidth = window.innerHeight;
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
		const context = this.#canvasDocument.getContext("2d");
		context.clearRect(0, 0, this.#canvasWidth, this.#canvasHeight);

		for (let row = 0; row < this.totalNumOfRows; row += 1) {
			for (let col = 0; col < this.#cellDimension; col += 1) {
				context.fillStyle = "white";
				context.stroke = "#000000";
				context.lineWidth = 0.5;

				/**@description  draws a rectangle that is filled according to the current fill style*/
				context.fillRect(
					col * this.#cellDimension,
					row * this.#cellDimension,
					this.#cellDimension * this.totalGridCols,
					this.#cellDimension * this.totalGridCols
				);
				context.strokeRect(
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
		const context = this.#canvasDocument.getContext("2d");

		const { x, y } = this.calculatePlayerPosition(
			this.playerPosition.row,
			this.playerPosition.col
		);

		// Add these font settings
		context.font = `${this.#cellDimension * 0.8}px Arial`; // Scale font to cell size
		context.fillStyle = "black"; // Set text color
		context.textAlign = "center";
		context.textBaseline = "middle";

		context.fillText(this.playerCharacter, x, y);
	};

	removePlayerFromPrevPosition = ({ row, col }) => {
		const context = this.#canvasDocument.getContext("2d");

		context.clearRect(
			col * this.#cellDimension,
			row * this.#cellDimension,
			this.#cellDimension,
			this.#cellDimension
		);
	};

	startGame() {
		// Set Canvas height
		this.#setCanvasWidthAndHeight();

		// Create game grid
		this.#generateGrid();
		this.#drawGridLines();
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
			const col = Math.floor(Math.random() * this.totalGridCols) + 1;
			if (!alreadyTakenPosition.has(col)) {
				alreadyTakenPosition.add(col);

				const obstacleIdx = Math.floor(Math.random() * this.#obstacles.length);

				obstaclePosition.push({
					row: 10,
					col,
					obstacle: this.#obstacles[obstacleIdx],
				});
				count += 1;
			}
		}
		return obstaclePosition;
	}

	placeObstacleOnGrid() {
		const context = this.#canvasDocument.getContext("2d");
		const obstacles = this.generateObstaclePosition();

		for (let i = 0; i < obstacles.length; i += 1) {
			const currObstacle = obstacles[i];

			const { col, obstacle } = currObstacle;
			const { x, y } = this.calculatePlayerPosition(this.totalNumOfRows, col);

			// Add these font settings
			context.font = `${this.#cellDimension * 0.8}px Arial`; // Scale font to cell size
			context.fillStyle = "black"; // Set text color
			context.textAlign = "center";
			context.textBaseline = "middle";

			context.fillText(obstacle, x, y);
		}
	}
	// --- END OF CLASS ---
}

const game = new Game();

game.startGame();

document.addEventListener("keyup", (event) => {
	game.movePlayer(event, {
		totalNumOfRows: game.totalNumOfRows,
		placePlayer: game.placePlayer,
		removePlayerFromPrevPosition: game.removePlayerFromPrevPosition,
	});
});
