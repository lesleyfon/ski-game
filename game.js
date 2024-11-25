import { Player } from "./player.js";

class Game extends Player {
	/**@type {number} */ #canvasWidth;
	/**@type {number} */ #canvasHeight;

	/**@type {HTMLCanvasElement} */ #canvasDocument;
	/**@type {number} */ #cellDimension;
	/**@type {number} */ totalNumOfRows;

	/** @type {Array<Array<{row: number, col: number}>>} */ #canvasGrid = [];

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
		this.#cellDimension = this.#canvasWidth / 10; // Dynamically generate this number to get cell width base on the canvas width. And there should be ten cols in a row
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
					this.#cellDimension * 10,
					this.#cellDimension * 10
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
		const { x, y } = this.calculatePlayerPosition(row, col);

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
