const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// задаем ширину и высоту холста
canvas.width = 320;
canvas.height = 720;

// переменные для игры
let speed = 3; // начальная скорость игры
let score = 0; // начальное количество очков
let gameOver = false; // флаг для отслеживания окончания игры

// фон
class Background {
  constructor(image, speed) {
    this.image = new Image();
    this.image.src = image;
    this.x = 0;
    this.y = 0;
    this.speed = speed;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, canvas.width, canvas.height);
    ctx.drawImage(
      this.image,
      this.x,
      this.y - canvas.height,
      canvas.width,
      canvas.height
    );
  }

  update() {
    this.y += this.speed;
    if (this.y > canvas.height) {
      this.y = 0;
    }
  }
}

// класс для игрока
class Player {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  // отрисовка игрока
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // движение на стрелки клавиатуры
  update() {
    if (keys.ArrowUp && this.y > 0) {
      this.y -= speed;
    }

    if (keys.ArrowDown && this.y < canvas.height - this.height) {
      this.y += speed;
    }

    if (keys.ArrowLeft && this.x > 0) {
      this.x -= speed;
    }

    if (keys.ArrowRight && this.x < canvas.width - this.width) {
      this.x += speed;
    }

    // Обработка касания пальцем
    canvas.addEventListener('touchstart', (e) => {
      // Определить координаты касания на экране
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;

      // Определить, в каком направлении двигаться
      if (touchY < this.y && this.y > 0) {
        this.y -= speed;
      }

      if (touchY > this.y + this.height && this.y < canvas.height - this.height) {
        this.y += speed;
      }

      if (touchX < this.x && this.x > 0) {
        this.x -= speed;
      }

      if (touchX > this.x + this.width && this.x < canvas.width - this.width) {
        this.x += speed;
      }
    });
  }

  // проверка на коллизию
  carIntersect(obstacle) {
    return (
      this.x < obstacle.x + obstacle.width &&
      this.x + this.width > obstacle.x &&
      this.y < obstacle.y + obstacle.height &&
      this.y + this.height > obstacle.y
    );
  }
}

// класс для машинок-препятствий
class Obstacle {
  constructor(x, y, speed, color, width, height) {
    this.x = x;
    this.y = y;
    this.speed = speed; // скорость движения препятствия
    this.color = color;
    this.width = width || 50;
    this.height = height || 100;
  }

  // отрисовка
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // обновление координат
  update() {
    // движение
    this.y += this.speed;

    // если препятствие выходит за пределы холста, создаем новое
    if (this.y > canvas.height) {
      this.y = -200; // отображение за верхней границей
      this.x = Math.random() * (canvas.width - this.width); // случайная позиция по горизонтали
    }

    // коллизия с игроком
    if (player.carIntersect(this)) {
      gameOver = true;
    }
  }
}

class Coin {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.speed = speed;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    this.y += this.speed;

    // если препятствие выходит за пределы холста, создаем новое
    if (this.y > canvas.height) {
      this.y = -200; // начинаем отображать препятствие за верхней границей
      this.x = Math.random() * (canvas.width - this.width); // случайно выбираем горизонтальную позицию
    }
  }

  // проверка на столкновение машинки-игрока с монеткой
  playerCoinIntersect(player) {
    return (
      this.x < player.x + player.width &&
      this.x + this.width > player.x &&
      this.y < player.y + player.height &&
      this.y + this.height > player.y
    );
  }
}

// создаем игрока, массив препятствий и массив монеток
const player = new Player(160, 500, 50, 100, "red");

const background = new Background("./assets/images/road.png", speed);

const obstacles = [
  new Obstacle(Math.random() * (canvas.width - 50), -200, speed / 2, "blue"),
  new Obstacle(Math.random() * (canvas.width - 50), -400, speed / 3, "green"),
  new Obstacle(
    Math.random() * (canvas.width - 50),
    -600,
    speed / 2.5,
    "purple"
  ),
];

const coins = [
  new Coin(Math.random() * (canvas.width - 50), -100, 30, 30, "gold"),
  new Coin(Math.random() * (canvas.width - 50), -300, 30, 30, "gold"),
  new Coin(Math.random() * (canvas.width - 50), -500, 30, 30, "gold"),
];
// очки за монетки
let coinsCollected = 0;

// обработка клавиш клавиатуры
const keys = {};

document.addEventListener("keydown", (event) => {
  keys[event.code] = true;
});

document.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

// отображение текущего счета
function showScore() {
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Coins: ${coinsCollected}`, 10, 60);
}

// оповищение о конце игры
function showGameOver() {
  ctx.fillStyle = "white";
  ctx.font = "60px Arial";
  ctx.fillText("Game Over", 45, 300);
}

// основной игровой цикл
function gameLoop() {
  // очищаем канвас
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  background.draw();
  background.update();
  // обновляем и отрисовываем игрока
  player.update();
  player.draw();

  coins.forEach((coin, index) => {
    coin.update();
    coin.draw();
    // коллизия с монеткой
    if (coin.playerCoinIntersect(player)) {
      coinsCollected++;
      coin.y = -500; // убираем монетку
    }
  });

  // обновляем и отрисовываем каждое препятствие
  obstacles.forEach((obstacle) => {
    obstacle.update();
    obstacle.draw();
  });
  // обновляем и отрисовываем каждую монетку

  if (!gameOver) {
    speed += 0.001; // увеличение скорости игры
    score += 1; // добавление очков прохождения
    showScore();
    requestAnimationFrame(gameLoop);
  } else {
    // отображаем надпись "Game Over"
    showGameOver();
  }
}


