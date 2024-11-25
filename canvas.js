class CanvasConfig {
	constructor(width, height) {
		/**@type {number} */ this.width = width;
		/**@type {number} */ this.height = height;
		/**@type {HTMLCanvasElement} */ this.canvasDocument =
			document.getElementById("game-canvas");
		/**@type {CanvasRenderingContext2D} */ this.context = this.canvasDocument.getContext("2d");
		/**@type {number} */ this.cellDimension = null;
	}

	/**
	 * Sets the canvas dimensions based on predefined width and height values
	 * @private
	 * @description Initializes the game canvas with dimensions calculated from window size and preset width
	 * @throws {TypeError} If canvas element is not found in the DOM
	 * @returns {void}
	 */
	initialize() {
		this.canvasDocument.width = this.width;
		this.canvasDocument.height = this.height;
	}
}

export default CanvasConfig;
