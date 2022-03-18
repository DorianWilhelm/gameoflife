import { GameOfLife } from "./gameOfLife";
import { Boundary, Cell, RevQuadTree } from "./revQuadTree.draft";
import { parserle } from "./rle";
import { transformToCells } from "./utils";
import billiardTable from "./patterns/billiardTable";

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

const cells = transformToCells(
    parserle(billiardTable.pattern, billiardTable.x, billiardTable.y)
);
startButton.textContent = "Start Game";
startButton.onclick = function () {
    myGame.startGame(cells);
};

const tree = new RevQuadTree(new Boundary([400, 400], 800, 800), null, true, 0);
const myGame = new GameOfLife(ctx, width, height, resolution, tree, globalDick);
function onKeyPress(e: KeyboardEvent) {
    switch (e.key) {
        case "h":
            myGame.moveLeft();
            break;
        case "j":
            myGame.moveDown();
            break;
        case "k":
            myGame.moveUp();
            break;
        case "l":
            myGame.moveRight();
            break;
        default:
            break;
    }
}
document.addEventListener("keypress", onKeyPress);
function gameLoop(tree: RevQuadTree, game: GameOfLife) {
    myGame.render();
    setTimeout(() => {
        requestAnimationFrame(gameLoop.bind(null, tree, game));
    }, 100);
}
gameLoop(tree, myGame);
