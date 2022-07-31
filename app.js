const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const rows = 5;
const cols = 5;
const tileWidth = canvas.width / cols;
const tileHeight = canvas.height / rows;

let board;
let puzzleImg = new Image(canvas.width, canvas.height);
puzzleImg.src = 'rick-astley.jpg';

puzzleImg.onload = () => {
	board = new Board(rows, cols, canvas.width, canvas.height, puzzleImg);
	board.shuffle(500);
	board.paint();
}

/**
 * Represents the whole puzzle board
 */
class Board {
	constructor(rows, cols, width, height, img) {
		this.rows = rows;
		this.cols = cols;
		this.img = img;
		this.width = width;
		this.height = height;
		this.tiles = [];

		this.tileWidth = width / cols;
		this.tileHeight = height / rows;

		this.aspectRatio = img.naturalWidth / img.width;
		this.naturalTileWidth = this.aspectRatio * width / cols;
		this.naturalTileHeight = this.aspectRatio * height / rows;

		for (let row = 0; row < rows; ++row) {
			this.tiles.push([]);
			for (let col = 0; col < cols; ++col) {
				this.tiles[row].push(new Tile(row, col, false));
			}
		}
		this.tiles[rows - 1][cols - 1].isEmpty = true;
		this.emptyTile = { 'x': rows - 1, 'y': cols - 1 };
	}
	
	/**
	 * draws all tiles
	 */
	paint() {
		ctx.fillRect(0, 0, this.width, this.height);
		this.tiles.forEach((row, i) => {
			row.forEach((tile, j) => {
				if (!tile.isEmpty) ctx.drawImage(this.img, tile.realX * this.naturalTileWidth, tile.realY * this.naturalTileHeight, this.naturalTileWidth, this.naturalTileHeight, i * this.tileWidth, j * this.tileHeight, this.tileWidth, this.tileHeight);
			})
		});

		// draw horizontal gridlines
		for (let row = 0; row < rows + 1; ++row) {
			if (row == 0) ctx.fillRect(0, row * this.tileHeight, this.width, 2);	// top-most grid line
			else if (row == rows) ctx.fillRect(0, row * this.tileHeight - 2, this.width, 2);	// bottom-most grid line
			else ctx.fillRect(0, row * this.tileHeight - 1, this.width, 2);
		}

		// draw vertical gridlines
		for (let row = 0; row < rows + 1; ++row) {
			if (row == 0) ctx.fillRect(row * this.tileWidth, 0, 2, this.width);	// left-most grid line
			else if (row == rows) ctx.fillRect(row * this.tileWidth - 2, 0, 2, this.width);	// right-most grid line
			else ctx.fillRect(row * this.tileWidth - 1, 0, 2, this.width);
		}
	}

	/**
	 * shuffles the puzzle
	 */
	shuffle(moves) {
		let lastPiece = { 'x': this.emptyTile.x, 'y': this.emptyTile.y };
		for (let i = 0; i < moves; ++i) {
			// neighbours of the empty cell
			let neighbours = this.getNeighbours(this.emptyTile.x, this.emptyTile.y);

			// remove the previous location so that the previous move is not undone in the process
			let lastIndex = neighbours.findIndex(elem => elem.coords.x === lastPiece.x && elem.coords.y === lastPiece.y)
			if (lastIndex != -1) neighbours.splice(lastIndex, 1);

			// swap randomly selected tile with the empty tile
			let selection = neighbours[Math.floor(Math.random() * neighbours.length)];
			let selectedTile = this.tiles[selection.coords.x][selection.coords.y];
			this.tiles[selection.coords.x][selection.coords.y] = this.tiles[this.emptyTile.x][this.emptyTile.y];
			this.tiles[this.emptyTile.x][this.emptyTile.y] = selectedTile;
			this.emptyTile.x = selection.coords.x;
			this.emptyTile.y = selection.coords.y;
		}
	}

	/**
	 * gets neighbouring tiles
	 */
	getNeighbours(x, y) {
		let neighbours = [];
		if (x - 1 >= 0) neighbours.push({
			'tile': this.tiles[x - 1][y],
			'coords': {
				'x': x - 1,
				'y': y,
			},
		});
		if (x + 1 < this.cols) neighbours.push({
			'tile': this.tiles[x + 1][y],
			'coords': {
				'x': x + 1,
				'y': y,
			},
		});
		if (y - 1 >= 0) neighbours.push({
			'tile': this.tiles[x][y - 1],
			'coords': {
				'x': x,
				'y': y - 1,
			},
		});
		if (y + 1 < this.rows) neighbours.push({
			'tile': this.tiles[x][y + 1],
			'coords': {
				'x': x,
				'y': y + 1,
			},
		});
		return neighbours;
	}

	/**
	 * moves a tile to the empty spot
	 */
	moveTile(x, y) {
		// clicked on the empty space
		if (this.tiles[x][y].isEmpty) return;

		let neighbouringTiles = this.getNeighbours(x, y);
		let emptyTile = neighbouringTiles.find(tileObj => tileObj.tile.isEmpty);

		// no empty space found in the neighbouring tiles
		if (emptyTile === undefined) return;

		// found the empty tile; swap positions with the clicked tile
		let tempEmptyTile = this.tiles[emptyTile.coords.x][emptyTile.coords.y];
		this.tiles[emptyTile.coords.x][emptyTile.coords.y] = this.tiles[x][y];
		this.tiles[x][y] = tempEmptyTile;

		// update empty positions
		this.emptyTile.x = x;
		this.emptyTile.y = y;
	}

	/**
	 * check if the puzzle is solved
	 */
	isSolved() {
		return this.tiles.every((row, i) => {
			return row.every((tile, j) => {
				return tile.realX == i && tile.realY == j;
			});
		});
	}
}

/**
 * Respresents a single tile in the puzzle
 */
class Tile {
	constructor(realX, realY, isEmpty) {
		this.realX = realX;
		this.realY = realY;
		this.isEmpty = isEmpty;
	}
}

/**
 * Canvas onclick event handler to move tiles
 */
canvas.addEventListener('click', e => {
	let rect = canvas.getBoundingClientRect();
	let x = e.clientX - rect.left;
	let y = e.clientY - rect.top;
	let tileX = Math.floor(x / tileWidth);
	let tileY = Math.floor(y / tileHeight);

	board.moveTile(tileX, tileY);
	board.paint();
});
