const ctx = document.getElementById('game').getContext('2d');

class Game {
	constructor(ctx, options) {
		this.ctx = ctx;
		this.startDialog = document.getElementById('startDialog');
		this.playGame = false;
		this.gameSpeed = 3;
		this.touchX = 0;
		this.height = ctx.canvas.height;
		this.width = ctx.canvas.width;
		this.canvasRect = ctx.canvas.getBoundingClientRect();
		this._coins = {
			height: options?.coins?.height || 30,
			count: options?.coins?.count || 3,
			width: options?.coins?.width || 30,
			color: options?.coins?.color || 'gold',
			space: options?.coins?.space || 100,
		}
		this.coins = {
			activated: false,
			collected: 0,
			count: this._coins.count,
			width: this._coins.width,
			color: this._coins.color,
			space: this._coins.space,
			height: this._coins.height,
			y: -this._coins.height,
			x: this.randomX,
			border: this.height - this._coins.height,
			startX: [],
			bounds: [],
		};
		this._roadLines = {
			width: options?.roadLines?.width || 30,
			height: options?.roadLines?.height || 100,
			count: options?.roadLines?.count || 4,
			space: options?.roadLines?.space || 100,
		}
		this.roadLines = {
			width: this._roadLines.width,
			height: this._roadLines.height,
			count: this._roadLines.count,
			space: this._roadLines.space,
			x: this.width / 2 - (this._roadLines.width / 2),
			y: -this._roadLines.height,
			border: this.height - this._roadLines.height,
		};
		this._enemies = {
			width: options?.enemies?.width || 30,
			height: options?.enemies?.height || 50,
			count: options?.enemies?.count || 5,
			space: options?.enemies?.space || 100,
		};
		this.enemies = {
			width: this._enemies.width,
			height: this._enemies.height,
			count: this._enemies.count,
			space: this._enemies.space,
			border: this.height - this._enemies.height,
			y: -this._enemies.height,
			x: this.randomX,
			activated: false,
			startX: [],
			bounds: [],
		}
		this._player = {
			width: options?.player.width || 30,
			height: options?.player.height || 50,
			position: options?.player.position || 35,
		}
		this.player = {
			width: this._player.width,
			height: this._player.height,
			position: this._player.position,
			x: this.width / 2 - (this._player.width / 2),
			y: this.height - this._player.height - (this.height / 100 * this._player.position),
			scaleX: this.width / this.canvasRect.width,
			score: 0,
			bounds: [],
		}

		this.ui = {
			x: 10,
			y: 10,
			width: 100,
			height: 10,
		}
	}

	get playerBounds() {
		return this.player.bounds;
	}

	set playerBounds(value) {
		this.player.bounds = value;
	}

	get enemiesBounds() {
		return this.enemies.bounds;
	}

	set enemiesBounds(value) {
		this.enemies.bounds[value.index] = value.bounds;
	}

	get coinsBounds() {
		return this.coins.bounds;
	}

	set coinsBounds(value) {
		this.coins.bounds[value.index] = value.bounds;
	}

	get randomY() {
		return Math.floor(Math.random() * this.ctx.canvas.height) + this.height;
	}

	get randomX() {
		return Math.floor(Math.random() * this.width)
	}

	#hasCollision(rect1, rect2) {
		return rect1.x < rect2.x + rect2.width &&
			rect1.x + rect1.width > rect2.x &&
			rect1.y < rect2.y + rect2.height &&
			rect1.y + rect1.height > rect2.y;
	}

	#checkCollision(rect1, rects) {
		for (let i = 0; i < rects.length; i++) {
			if (this.#hasCollision(rect1, rects[i])) return true;
		}
		return false;
	}

	#createGameOverMessage() {
		return `
			<h2>Игра окончена</h2>
			<p>Вы набрали ${this.player.score} очков</p>
			<p>Вы собрали ${this.coins.collected} монет</p>
			<button type="button" onclick="startGame()">Начать заново</button>
		`
	}

	#createStartMessage() {
		return `
			<h2>Добро пожаловать в игру</h2>
			<p>Управление: стрелки влево и вправо</p>
			<p>Цель: собрать как можно больше монет</p>
			<button type="button" onclick="startGame()">Начать игру</button>
		`
	}

	#gameOver() {
		this.startDialog.innerHTML = this.#createGameOverMessage();
		this.startDialog.showModal();
		this.#destroyEventListeners();
		this.coins.collected = 0;
		this.player.score = 0;
		this.playGame = false;
	}

	start() {
		this.startDialog.innerHTML = this.#createStartMessage();
		this.enemies.activated = false;
		this.coins.activated = false;
		this.coins.y = -this.height;
		this.enemies.y = -this.height;
		this.#createEventListerners();
		this.playGame = true;
		window.requestAnimationFrame(this.drawFrame.bind(this));
	}

	drawFrame() {
		this.#clearField();
		this.#drawBackground();
		this.#drawLines();
		this.#drawCoins();
		this.#drawEnemyCars();
		this.#drawPlayer(this.touchX);
		this.#drawUI();
		if(this.playGame) window.requestAnimationFrame(this.drawFrame.bind(this));
	}

	// ROAD LINES
	#drawLine(startPosition) {
		this.ctx.fillStyle = 'white';
		let localY = 0;

		if (startPosition >= this.roadLines.border)
			localY = -this.roadLines.height + (startPosition - this.roadLines.border) - this.roadLines.space;
		else
			localY = startPosition;

		this.ctx.fillRect(this.roadLines.x, localY, this.roadLines.width, this.roadLines.height);
	}
	#drawLines() {
		if (this.roadLines.y <= this.roadLines.border) this.roadLines.y += this.gameSpeed;
		else this.roadLines.y = -this.roadLines.height - this.roadLines.space;

		for (let i = 0; i < this.roadLines.count; i++) {
			this.#drawLine(i * (this.roadLines.height + this.roadLines.space) + this.roadLines.y);
		}
	}

	// COINS
	#drawCoin(startPosition, startX, index) {
		this.ctx.fillStyle = 'gold';
		let localY = 0;
		let localX = startX;
		if (startPosition >= this.coins.border) {
			localY = -this.coins.height + (startPosition - this.coins.border) - this.coins.space;
			if (localY <= -this.coins.height) this.coins.startX[index] = this.randomX;
		}
		else {
			localY = startPosition;
		}

		this.ctx.fillRect(localX, localY, this.coins.width, this.coins.height);
		this.coinsBounds = {
			index,
			bounds: {
				x: localX,
				y: localY,
				width: this.coins.width,
				height: this.coins.height
			}
		}
	}
	#drawCoins() {
		if (this.coins.y <= this.coins.border) this.coins.y += this.gameSpeed;
		else this.coins.y = -this.coins.height - this.coins.space;

		for (let i = 0; i < this.coins.count; i++) {
			if (!this.coins.activated) {
				this.coins.startX[i] = this.randomX;
			}
			this.#drawCoin(i * (this.coins.height + this.coins.space) + this.coins.y, this.coins.startX[i], i);
		}

		this.coins.activated = true;
	}

	// ENEMIES
	#drawEnemyCar(startPosition, startX, index) {
		this.ctx.fillStyle = 'green';
		let localY = 0;
		let localX = startX;
		if (startPosition >= this.enemies.border) {
			localY = -this.enemies.height + (startPosition - this.enemies.border) - this.enemies.space;
			if (localY <= -this.enemies.height) this.enemies.startX[index] = this.randomX;
		}
		else {
			localY = startPosition;
		}

		this.ctx.fillRect(localX, localY, this.enemies.width, this.enemies.height);
		this.enemiesBounds = {
			index,
			bounds: {
				x: localX,
				y: localY,
				width: this.enemies.width,
				height: this.enemies.height
			}
		}
	}
	#drawEnemyCars() {
		if (this.enemies.y <= this.enemies.border) this.enemies.y += this.gameSpeed;
		else this.enemies.y = -this.enemies.height - this.enemies.space;
		for (let i = 0; i < this.enemies.count; i++) {
			if (!this.enemies.activated) {
				this.enemies.startX[i] = this.randomX;
			}
			this.#drawEnemyCar(i * (this.enemies.height + this.enemies.space) + this.enemies.y, this.enemies.startX[i], i);
		}

		this.enemies.activated = true;
	}

	// PLAYER
	#drawPlayer(x) {
		this.ctx.fillStyle = 'red';
		let localX = (x - this.canvasRect.left) * this.player.scaleX - this.player.width / 2;
		this.playerBounds = {
			x: localX,
			y: this.player.y,
			width: this.player.width,
			height: this.player.height
		}
		this.ctx.fillRect(localX, this.player.y, this.player.width, this.player.height);

		if (this.#checkCollision(this.playerBounds, this.enemiesBounds)) this.#gameOver();
		if (this.#checkCollision(this.playerBounds, this.coinsBounds)) this.coins.collected++;
		this.player.score++;
	}

	// UI
	#drawUI() {
		this.ctx.fillStyle = 'blue';
		this.ctx.fillRect(this.x, this.y, this.width, this.ui.height);
		this.ctx.font = '20px Arial';
		this.ctx.fillStyle = 'white';
		this.ctx.fillText('Coins: ' + this.coins.collected, this.ui.x + 10, this.ui.y + 30);
		this.ctx.fillText('Score: ' + this.player.score, this.ui.x + 200, this.ui.y + 30);
	}

	// FIELD
	#drawBackground() {
		// draw background
		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, this.width, this.height);
	}

	#clearField() {
		this.ctx.clearRect(0, 0, this.width, this.height);
	}

	#onTouchMove(e) {
		this.touchX = e.touches[0].clientX
	}

	#onKeyDown(e) {
		if (e.key === 'ArrowLeft') this.touchX -= this.gameSpeed;
		if (e.key === 'ArrowRight') this.touchX += this.gameSpeed;
	}

	#createEventListerners() {
		document.addEventListener('touchmove', (e) => this.#onTouchMove(e));
		document.addEventListener('keydown', (e) => this.#onKeyDown(e));
	}

	#destroyEventListeners() {
		document.removeEventListener('touchmove', (e) => this.#onTouchMove(e));
		document.removeEventListener('keydown', (e) => this.#onKeyDown(e));
	};
};

const game = new Game(ctx);

const startGame = () => {
	const startDialog = document.getElementById('startDialog');
	startDialog.close();
	game.start();
}
