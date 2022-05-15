import { GameOfLife } from "./gameOfLife";
import { Boundary, Cell, RevQuadTree } from "./revQuadTree.draft";
import { createWorld } from "./utils";

const app = document.querySelector("#app")!;
const globalDick: Record<string, Cell> = {};

const width = 800;
const height = 800;
const resolution = 10;

const canvas = app.appendChild(document.createElement("canvas"));
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext("2d");

const startButton = app.appendChild(document.createElement("button"));
const stopButton = app.appendChild(document.createElement("button"));

stopButton.textContent = "Stop Game";
stopButton.onclick = function () {
    myGame.endGame();
};

const cells: Cell[] = createWorld(height, width, resolution);

startButton.textContent = "Start Game";
startButton.onclick = function () {
    myGame.startGame(cells);
};

const tree = new RevQuadTree(new Boundary([40, 40], 800, 800), null, true, 0);
const myGame = new GameOfLife(ctx, width, height, resolution, tree, globalDick);

function gameLoop(tree: RevQuadTree, game: GameOfLife) {
    myGame.render();
    setTimeout(() => {
        requestAnimationFrame(gameLoop.bind(null, tree, game));
    }, 100);
}
gameLoop(tree, myGame);
