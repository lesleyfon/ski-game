export class Player {
	playerCharacter = "⛷️";
	/**@type {{row: number, col: number}} */ playerPosition = { row: 0, col: 0 };

	/**
	 * @description Using arrow function so that the `this` refers to the class
	 * @param {KeyboardEvent} event
	 */
	movePlayer = (event, gameProps) => {
		const { totalNumOfRows, placePlayer, removePlayerFromPrevPosition, totalGridCols } =
			gameProps;
		// TODO: Ideally, i would love for this to be in the player class;

		const MOVEMENT_MAP = {
			ArrowDown: {
				isValid: () => this.playerPosition.row < totalNumOfRows - 1,
				move: () => (this.playerPosition.row += 1),
			},
			ArrowUp: {
				isValid: () => this.playerPosition.row > 0,
				move: () => (this.playerPosition.row -= 1),
			},
			ArrowRight: {
				isValid: () => this.playerPosition.col < totalGridCols,
				move: () => (this.playerPosition.col += 1),
			},
			ArrowLeft: {
				isValid: () => this.playerPosition.col > 0,
				move: () => (this.playerPosition.col -= 1),
			},
		};

		const movement = MOVEMENT_MAP[event.key];
		if (!movement) return;

		removePlayerFromPrevPosition({
			...this.playerPosition,
		});

		if (movement.isValid()) {
			movement.move();
		}

		placePlayer();
	};
}
