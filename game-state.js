class GameState {
	constructor() {
		/**
		 * @description Determine if the game is running or not
		 * @type {boolean}
		 */
		this.isRunning = false;
		/**@type {number} */ this.score = 0;
		/**@type {number | null} */ this.intervalId = null;
	}
}

export default GameState;
