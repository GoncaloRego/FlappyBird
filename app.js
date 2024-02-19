const canvas = document.querySelector('.game-canvas');
const customizationMenu = document.querySelector('.customization-menu');
const customizationMenuTitle = document.querySelector('#menu-title');
const customizationMenuCells = document.querySelectorAll('td');
const customizationMenuItems = document.querySelectorAll('.menu-item');

const canvasContext = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width = 600;
const CANVAS_HEIGHT = canvas.height = 700;

//#region Classes

class Player {
    constructor(sprite) {
        this.sprite = sprite;
        this.x = 20;
        this.y = CANVAS_HEIGHT / 3;
        this.width = 34;
        this.height = 24;
        this.frame = 0;
        this.playerIsJumping = false;
        this.impulseOriginY = 0;
        this.flapSpeed = 20;
        this.gravityForce = 1.5;

        this.sprites = [];
    }

    applySprites(choice) {
        if (choice === Strings.BlueBird) {
            this.sprites = [Strings.BlueBirdDownSprite, Strings.BlueBirdMidSprite, Strings.BlueBirdUpSprite];
        }
        else if (choice === Strings.RedBird) {
            this.sprites = [Strings.RedBirdDownSprite, Strings.RedBirdMidSprite, Strings.RedBirdUpSprite];
        }
        else if (choice === Strings.YellowBird) {
            this.sprites = [Strings.YellowBirdDownSprite, Strings.YellowBirdMidSprite, Strings.YellowBirdUpSprite];
        }

        this.sprite.src = this.sprites[0];
    }

    getData() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    reset() {
        this.x = 20;
        this.y = CANVAS_HEIGHT / 3;
        this.playerIsJumping = false;
        this.frame = 0;
    }

    impulse() {
        if (this.playerIsJumping === false) {
            this.impulseOriginY = this.y;
            this.playerIsJumping = true;
        }
    }

    update() {
        if (this.playerIsJumping === true) {
            this.y = Math.floor(this.y -= this.gravityForce);

            if (this.y <= this.impulseOriginY - this.height * 1.5) {
                this.playerIsJumping = false;
            }
        }
        else {
            this.y = Math.floor(this.y += this.gravityForce);
        }

        if (gameFrame % this.flapSpeed === 0) {
            if (this.frame >= this.sprites.length - 1) {
                this.frame = 0;
            }
            else {
                this.frame++;
            }

            this.sprite.src = this.sprites[this.frame];
            flapWingSound.play();
        }
    }

    draw() {
        canvasContext.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
}

class BaseFloor {
    constructor(sprite, speed) {
        this.sprite = sprite;
        this.width = baseFloorSize.width;
        this.height = baseFloorSize.height;
        this.x = 0;
        this.y = CANVAS_HEIGHT - this.height;
        this.speed = speed;
    }

    resetPosition() {
        this.x = 0;
        this.y = CANVAS_HEIGHT - this.height;
    }

    getData() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    update() {
        if (this.x <= -this.width) {
            this.x = 0;
        }
        else {
            this.x = Math.floor(this.x -= this.speed);
        }
    }

    draw() {
        canvasContext.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        canvasContext.drawImage(this.sprite, this.x + this.width, this.y, this.width, this.height);
    }
}

class Pipe {
    constructor(sprite, position, yRange, speed) {
        this.sprite = sprite;
        this.width = pipeData.width;
        this.height = pipeData.height;

        this.x = pipeData.x;
        this.y = yRange;
        this.startingPositionY = yRange;
        this.wasPassedByPlayer = false;

        this.position = position;
        this.angle = 0;
        this.angleSpeed = 0.1;
        this.curve = 0.50;
        this.speed = speed;
    }

    getData() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            wasPassedByPlayer: this.wasPassedByPlayer
        };
    }

    setWasPassedByPlayer() {
        this.wasPassedByPlayer = true;
    }

    update() {
        this.x = Math.floor(this.x -= this.speed);
        if (this.position === Strings.PipePositionBottom) {
            this.y -= this.curve * Math.sin(this.angle);
        }
        else if (this.position === Strings.PipePositionTop) {
            this.y += this.curve * Math.sin(this.angle);
        }
        this.angle += this.angleSpeed;
    }

    draw() {
        canvasContext.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
}

class Heart {
    constructor(sprite, randomY, speed) {
        this.sprite = sprite;
        this.width = 24;
        this.height = 24;

        this.x = CANVAS_WIDTH + 12;
        this.y = randomY;
        this.wasPassedByPlayer = false;
        this.speed = speed;
        this.angle = 0;
        this.angleSpeed = 0.05;
        this.curve = 0.5;
    }

    getData() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        };
    }

    update() {
        this.x = Math.floor(this.x -= this.speed);
        this.y += this.curve * Math.sin(this.angle);
        this.angle += this.angleSpeed;
    }

    draw() {
        canvasContext.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
}

//#endregion

//#region Menu variables

let menuCurrentItemSelections = [];

customizationMenuCells.forEach(cell => {
    cell.firstChild.addEventListener('click', e => addCustomMenuItem(cell, e));
});

//#endregion

//#region Game variables

const Strings = {
    SpaceKeyCode: "Space",
    BlueBird: "blue",
    YellowBird: "yellow",
    RedBird: "red",
    BlueBirdDownSprite: 'assets/players/bluebird-downflap.png',
    BlueBirdMidSprite: 'assets/players/bluebird-midflap.png',
    BlueBirdUpSprite: 'assets/players/bluebird-upflap.png',
    YellowBirdDownSprite: 'assets/players/yellowbird-downflap.png',
    YellowBirdMidSprite: 'assets/players/yellowbird-midflap.png',
    YellowBirdUpSprite: 'assets/players/yellowbird-upflap.png',
    RedBirdDownSprite: 'assets/players/redbird-downflap.png',
    RedBirdMidSprite: 'assets/players/redbird-midflap.png',
    RedBirdUpSprite: 'assets/players/redbird-upflap.png',
    PipePositionBottom: 'bottom',
    PipePositionTop: 'top',
    PipeRedChoice: 'red',
    PipeGreenChoice: 'green',
    PipeRedSprite: 'assets/environment/pipe-red.png',
    PipeGreenSprite: 'assets/environment/pipe-green.png',
    PipeRedRotatedSprite: 'assets/environment/pipe-red-rotated.png',
    PipeGreenRotatedSprite: 'assets/environment/pipe-green-rotated.png',
    ItemSelectedClass: 'item-selected',
    MenuBlueBird: 'menu-blue-bird',
    MenuYellowBird: 'menu-yellow-bird',
    MenuRedBird: 'menu-red-bird',
    MenuDayBackground: 'menu-day-background',
    MenuNightBackground: 'menu-night-background',
    MenuGreenPipe: 'menu-green-pipe',
    MenuRedPipe: 'menu-red-pipe',
    DayBackground: 'day',
    NightBackground: 'night',
    DayBackgroundSprite: 'assets/environment/background-day.png',
    NightBackgroundSprite: 'assets/environment/background-night.png'
}

const GAME_STATE = {
    MenuSelection: "menuSelection",
    StartMessage: "startMessage",
    Running: "running",
    ExtraLife: "extraLife",
    GameOver: "gameOver",
    Restarting: "restarting"
}

let gameState = GAME_STATE.MenuSelection;
let gameScore = 0;
let gameFrame = 1;
let gameSpeed = 1;
let pipeInterval;
let heartInterval;
let pipeIntervalTime = 2500;
let heartIntervalTime = 25000;
let distanceBetweenPipes = 100;
let heartInitialPositionY = 0;

let playerChoices = {
    bird: "blue",
    background: "day",
    pipe: "green"
}

const startMessageData = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    width: 184,
    height: 267
}

const gameOverMessageData = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    width: 192,
    height: 42
}

const baseFloorSize = {
    width: CANVAS_WIDTH,
    height: 112
}

const pipeData = {
    x: CANVAS_WIDTH,
    y: 0,
    width: 52,
    height: 320
}

//#endregion

//#region Sprites

let playerSprite = new Image();
let background = new Image();
let pipe = new Image();
let pipeRotated = new Image();
const baseFloor = new Image();
baseFloor.src = 'assets/environment/base.png';
const heartSprite = new Image();
heartSprite.src = 'assets/environment/heart.png'
const gameOverMessage = new Image();
gameOverMessage.src = 'assets/messages/gameover.png';
const startMessage = new Image();
startMessage.src = 'assets/messages/message.png';

canvasContext.font = "24px flappyBird";
canvasContext.textAlign = 'center';

//#endregion

//#region Game Objects

const player = new Player(playerSprite);
const base = new BaseFloor(baseFloor, gameSpeed);

let pipes = [];
let hearts = [];
let extraLives = [];

//#endregion

//#region Sounds

const flapWingSound = new Audio('assets/audio/wing.wav');
flapWingSound.volume = 0.1;
const impulseSound = new Audio('assets/audio/swoosh.wav');
impulseSound.volume = 0.1;
const scoreSound = new Audio('assets/audio/point.wav');
scoreSound.volume = 0.3;
const deathSound = new Audio('assets/audio/hit.wav');
deathSound.volume = 0.3;
const extraLifeSound = new Audio('assets/audio/extraLife.mp3');
extraLifeSound.volume = 0.3;

//#endregion

//#region Menu functions

// Adds or removes the selected menu item to the list of selected items
function addCustomMenuItem(cell, e) {
    if (menuCurrentItemSelections.length < 3) {
        if (!menuCurrentItemSelections.includes(cell.firstChild) && !itemTypeWasAlreadySelected(e)) {
            menuCurrentItemSelections.push(cell.firstChild);
            cell.classList.add(Strings.ItemSelectedClass);
        }
        else if (menuCurrentItemSelections.includes(cell.firstChild)) {
            let index = menuCurrentItemSelections.indexOf(cell.firstChild);
            cell.classList.remove(Strings.ItemSelectedClass);
            menuCurrentItemSelections.splice(index, 1);
        }
    }
}

// Checks if the type of item (bird, background, pipe) was already selected
function itemTypeWasAlreadySelected(e) {
    let count = 0;
    menuCurrentItemSelections.forEach(item => {
        if (item.classList[0] === e.target.classList[0]) {
            count++;
        }
    });

    return count >= 1;
}

// Checks if all the necessary items from the menu were selected
function checkMenuItemsSelected() {
    if (menuCurrentItemSelections.length >= 3) {
        setTimeout(() => {
            customizationMenu.hidden = true;
            customizationMenuTitle.hidden = true;
            gameState = GAME_STATE.StartMessage;
            canvas.addEventListener('click', loadLevel);
        }, 250);
    }
}

// Applies the player choices from the menu to the game
function applyPlayerMenuChoices() {
    menuCurrentItemSelections.forEach(item => {
        if (item.id == Strings.MenuBlueBird) {
            playerChoices.bird = Strings.BlueBird;
        }
        else if (item.id == Strings.MenuRedBird) {
            playerChoices.bird = Strings.RedBird;
        }
        else if (item.id == Strings.MenuYellowBird) {
            playerChoices.bird = Strings.YellowBird;
        }

        if (item.id == Strings.MenuDayBackground) {
            playerChoices.background = Strings.DayBackground;
            background.src = Strings.DayBackgroundSprite;
            gameSpeed = 1;
        }
        else if (item.id == Strings.MenuNightBackground) {
            playerChoices.background = Strings.NightBackground;
            background.src = Strings.NightBackgroundSprite;
            gameSpeed = 2;
        }

        if (item.id == Strings.MenuGreenPipe) {
            playerChoices.pipe = Strings.PipeGreenChoice;
        }
        else if (item.id == Strings.MenuRedPipe) {
            playerChoices.pipe = Strings.PipeRedChoice;
        }
    });

    player.applySprites(playerChoices.bird);
}

//#endregion

//#region Game management functions

// Instantiates pipes and a random Y position between a certain range
function instantiatePipes() {
    let pipeYRange = Math.random() * 130 + 10;
    let heartHeight = 24;

    heartInitialPositionY = -pipeYRange + pipeData.height + distanceBetweenPipes / 2 - heartHeight / 2;

    if (playerChoices.pipe === Strings.PipeGreenChoice) {
        pipe.src = Strings.PipeGreenSprite;
        pipeRotated.src = Strings.PipeGreenRotatedSprite;
    }
    else if (playerChoices.pipe === Strings.PipeRedChoice) {
        pipe.src = Strings.PipeRedSprite;
        pipeRotated.src = Strings.PipeRedRotatedSprite;
    }

    let bottomPipe = new Pipe(pipe, Strings.PipePositionBottom, -pipeYRange + pipeData.height + distanceBetweenPipes, gameSpeed);
    let topPipe = new Pipe(pipeRotated, Strings.PipePositionTop, -pipeYRange, gameSpeed);
    pipes.push(bottomPipe);
    pipes.push(topPipe);
}

// Removes pipes that are no longer on screen
function removePipesPassed() {
    for (let i = 0; i < pipes.length; i++) {
        if (pipes[i].getData().x + pipes[i].getData().width < 0) {
            pipes.shift();
            pipes.shift();
        }
    }
}

// Instantiates hearts between the pipes
function instantiateHearts() {
    let heart = new Heart(heartSprite, heartInitialPositionY, gameSpeed)
    hearts.push(heart);
}

// Adds an impulse force to the player
function impulsePlayer(key) {
    if (key.code == Strings.SpaceKeyCode) {
        impulseSound.currentTime = 0;
        impulseSound.play();
        player.impulse();
    }
}

// Checks if the player has extra lives left
function playerHasLivesLeft() {
    return extraLives.length >= 1;
}

// Adds 1 to the score everytime player passes between two pipe
function updateScore() {
    for (let i = 0; i < pipes.length; i++) {
        if (!pipes[i].getData().wasPassedByPlayer && player.getData().x >= pipes[i].x + pipes[i].width) {
            gameScore += 0.5;
            pipes[i].setWasPassedByPlayer();
            scoreSound.play();
        }
    }
}

// Checks if the player collided with a heart sprite
function checkForExtraLivesCollected() {
    for (let i = 0; i < hearts.length; i++) {
        if (player.getData().x < hearts[i].getData().x + hearts[i].getData().width
            && player.getData().x + player.getData().width > hearts[i].getData().x
            && player.getData().y < hearts[i].getData().y + hearts[i].getData().height
            && player.getData().y + player.getData().height > hearts[i].getData().y) {
            extraLives.push(hearts[i]);
            extraLifeSound.play();
            break;
        }
    }
    for (let i = 0; i < hearts.length; i++) {
        if (extraLives.includes(hearts[i])) {
            hearts.splice(i, 1);
        }
    }
}

// Checks if the player collided with pipes or is outside Y limits
function checkForGameOver() {
    let playerCollided = false;

    if (player.getData().y + player.getData().height > base.getData().y
        || player.getData().y - player.getData().height / 2 < 0) {
        playerCollided = true;
    }

    for (let i = 0; i < pipes.length; i++) {
        if (player.getData().x < pipes[i].getData().x + pipes[i].getData().width
            && player.getData().x + player.getData().width > pipes[i].getData().x
            && player.getData().y < pipes[i].getData().y + pipes[i].getData().height
            && player.getData().y + player.getData().height > pipes[i].getData().y) {
            playerCollided = true;
            break;
        }
    }

    if (playerCollided === true) {
        if (playerHasLivesLeft() === false) {
            gameState = GAME_STATE.GameOver;
        }
        else {
            gameState = GAME_STATE.ExtraLife;
        }
    }
}

// Removes the green background from the items selected previously on the menu
function resetPlayerChoices() {
    menuCurrentItemSelections = [];
    customizationMenuCells.forEach(cell => {
        if (cell.classList.contains(Strings.ItemSelectedClass)) {
            cell.classList.remove(Strings.ItemSelectedClass);
        };
    });
}

// "Moves" the game back to the menu selection and changes the game state
function handleGameOver() {
    setTimeout(() => {
        customizationMenu.hidden = false;
        customizationMenuTitle.hidden = false;
        gameState = GAME_STATE.MenuSelection;
    }, 1000);

    deathSound.play();
    clearInterval(pipeInterval);
    clearInterval(heartInterval);
    resetPlayerChoices();

    gameState = GAME_STATE.Restarting;
}

// Loads the game and all the necessary objects
function loadLevel() {
    document.addEventListener("keydown", impulsePlayer);
    applyPlayerMenuChoices();
    base.resetPosition();
    player.reset();
    gameScore = 0;
    pipes = [];
    hearts = [];

    if (gameState != GAME_STATE.ExtraLife) {
        extraLives = [];
    }

    clearInterval(pipeInterval);
    clearInterval(heartInterval);

    pipeInterval = setInterval(instantiatePipes, pipeIntervalTime / gameSpeed);

    if (playerChoices.background === Strings.NightBackground) {
        heartInterval = setInterval(instantiateHearts, heartIntervalTime / gameSpeed);
    }

    canvas.removeEventListener('click', loadLevel);
    gameState = GAME_STATE.Running;
}

// Calls the update method of each object of the game
function updateObjects() {
    player.update();
    pipes.forEach(pipe => {
        pipe.update();
    });
    hearts.forEach(heart => {
        heart.update();
    });
    base.update();
}

// Calls the draw method of each object of the game
function drawObjects() {
    canvasContext.drawImage(background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    canvasContext.drawImage(background, 0 + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    player.draw();
    pipes.forEach(pipe => {
        pipe.draw();
    });
    hearts.forEach(heart => {
        heart.draw();
    });

    for (let i = 0; i < extraLives.length; i++) {
        canvasContext.drawImage(heartSprite, 10 + 24 * i, 10, 24, 24);
    }

    base.draw();

    canvasContext.fillText(gameScore, CANVAS_WIDTH / 2, 30);
}

// Main method that controls everything that happens during the game
function updateGame() {
    canvasContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === GAME_STATE.MenuSelection) {
        checkMenuItemsSelected();
    }
    else if (gameState === GAME_STATE.StartMessage) {
        canvasContext.drawImage(startMessage, startMessageData.x - startMessageData.width / 2, startMessageData.y - startMessageData.height / 2, startMessageData.width, startMessageData.height);
    }
    else if (gameState === GAME_STATE.Running) {

        updateObjects();
        drawObjects();

        checkForExtraLivesCollected();
        checkForGameOver();
        removePipesPassed();
        updateScore();

        gameFrame++;
    }
    else if (gameState === GAME_STATE.ExtraLife) {
        let currentScore = gameScore;
        loadLevel();
        gameScore = currentScore;
        extraLives.pop();
        drawObjects();
        deathSound.play();

        gameState = GAME_STATE.Running;
    }
    else if (gameState === GAME_STATE.GameOver) {
        canvasContext.drawImage(gameOverMessage, gameOverMessageData.x - gameOverMessageData.width / 2, gameOverMessageData.y - gameOverMessageData.height / 2, gameOverMessageData.width, gameOverMessageData.height);
        drawObjects();
        handleGameOver();
    }
    else if (gameState === GAME_STATE.Restarting) {
        drawObjects();
        canvasContext.drawImage(gameOverMessage, gameOverMessageData.x - gameOverMessageData.width / 2, gameOverMessageData.y - gameOverMessageData.height / 2, gameOverMessageData.width, gameOverMessageData.height);
    }

    requestAnimationFrame(updateGame);
}

//#endregion

updateGame();
