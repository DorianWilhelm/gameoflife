import { Boundary, Cell, RevQuadTree } from "./revQuadTree.draft";
import { Coordinate, Update } from "./types";
import { createWorld, drawCell, getCoordinate } from "./utils";

export class GameOfLife {
    ctx: CanvasRenderingContext2D | null;
    world: number[][];
    running: boolean;
    width: number;
    height: number;
    ROWS: number;
    COLS: number;
    resolution: number;
    requestId: number;
    currentTreeNode: RevQuadTree;
    globalDick: Record<string, Cell>;
    activeRegion: Boundary;
    relativeToOrigin: Coordinate;
    redraw: boolean;

    constructor(
        ctx: CanvasRenderingContext2D | null,
        width: number,
        height: number,
        resolution: number,
        currentTreeNode: RevQuadTree,
        globalDick: Record<string, Cell>
    ) {
        this.currentTreeNode = currentTreeNode;
        this.activeRegion = new Boundary(
            [2 * width, 2 * height],
            width * 4,
            height * 4
        );
        this.globalDick = globalDick;
        this.ctx = ctx;
        this.world = createWorld(height, width, resolution);
        this.relativeToOrigin = [
            width / 2 / resolution,
            height / 2 / resolution,
        ];
        this.running = false;
        this.width = width;
        this.height = height;
        this.resolution = resolution;
        this.ROWS = height / resolution;
        this.COLS = width / resolution;
        this.requestId = 0;
        this.redraw = true;
    }
    checkUpdateRules(
        id: string,
        isAlive: boolean,
        count: number
    ): Update | undefined {
        if (isAlive) {
            if (count < 2 || count > 3) {
                return {
                    id: id,
                    action: "kill",
                };
            }
        } else {
            if (count == 3) {
                return {
                    id: id,
                    action: "resurrect",
                };
            }
        }
        return undefined;
    }
    computeUpdates(
        coordinate: number[],
        cellUpdateMemo: Record<string, boolean>,
        stop: boolean
    ): Update | Update[] {
        const id = `xy${coordinate[0]}_${coordinate[1]}`;

        function horAdj([row, column]: number[]) {
            const left = [row, column - 1];
            const right = [row, column + 1];
            return [left, right];
        }

        function vertAdj([row, column]: number[]) {
            const above = [row - 1, column];
            const below = [row + 1, column];
            return [above, below];
        }

        function backDiaAdj([row, column]: number[]) {
            const topleft = [row - 1, column - 1];
            const bottomright = [row + 1, column + 1];
            return [topleft, bottomright];
        }

        function forDiaAdj([row, column]: number[]) {
            const topright = [row - 1, column + 1];
            const bottomleft = [row + 1, column - 1];
            return [topright, bottomleft];
        }

        const activeAdjFuncs = [horAdj, vertAdj, backDiaAdj, forDiaAdj];

        const compositeAdjacencyFunction = function (coordinate: number[]) {
            const adjacents = [];

            for (const adjFunc of activeAdjFuncs) {
                adjacents.push(adjFunc(coordinate));
            }
            return adjacents.flat();
        };

        const neighborhood = compositeAdjacencyFunction(coordinate);

        let cellUpdates = [];

        if (stop) {
            if (cellUpdateMemo[id]) {
                return [];
            } else {
                cellUpdateMemo[id] = true;
            }
            let aliveCellsCounter = 0;
            for (const neighbor of neighborhood) {
                const id = `xy${neighbor[0]}_${neighbor[1]}`;
                if (this.globalDick[id]) {
                    aliveCellsCounter++;
                }
            }
            const isAlive = this.globalDick[id] ? true : false;
            const update = this.checkUpdateRules(
                id,
                isAlive,
                aliveCellsCounter
            );
            if (update) {
                return update;
            }
        } else {
            neighborhood.push(coordinate);
            for (const neighbor of neighborhood) {
                cellUpdates.push(
                    this.computeUpdates(neighbor, cellUpdateMemo, true)
                );
            }
        }
        return cellUpdates.flat();
    }
    updateGameState() {
        const cellUpdateMemo = {};
        let cellUpdates = [];
        const activeCells = this.currentTreeNode.query(this.activeRegion);

        for (const cell of activeCells) {
            cellUpdates.push(
                this.computeUpdates([cell.x, cell.y], cellUpdateMemo, false)
            );
        }

        cellUpdates = cellUpdates.flat();
        cellUpdates.forEach((update) => {
            const [x, y] = getCoordinate(update.id);
            if (update.action === "kill") {
                delete this.globalDick[update.id];
            } else {
                const cell = new Cell(x, y, true);
                this.globalDick[update.id] = cell;
                this.currentTreeNode.insert(cell);
            }
        });
        if (this.redraw) {
            Array.from({ length: this.ROWS }, (_, x) =>
                Array.from({ length: this.COLS }, (_, y) => {
                    const absX = x + this.relativeToOrigin[0];
                    const absY = y + this.relativeToOrigin[1];
                    drawCell(
                        this.ctx,
                        [x, y],
                        this.resolution,
                        this.globalDick[`xy${absX}_${absY}`] ? true : false
                    );
                })
            );
            this.redraw = false;
        } else {
            this.draw(cellUpdates);
        }
    }

    draw(cellUpdates: Update[]) {
        const screen = new Boundary(
            this.relativeToOrigin,
            this.width / this.resolution,
            this.height / this.resolution
        );
        cellUpdates.forEach((update) => {
            const [x, y] = getCoordinate(update.id);
            const cell: Cell = {
                id: update.id,
                x: x,
                y: y,
                state: update.action === "kill" ? false : true,
            };
            if (screen.contains(cell)) {
                console.log("i am part of the screen which is:", screen);
                drawCell(
                    this.ctx,
                    [cell.x, cell.y],
                    this.resolution,
                    cell.state
                );
            }
        });

        // for (let i = 0; i < this.ROWS; i++) {
        //     for (let j = 0; j < this.COLS; j++) {
        //         const absoluteX = this.relativeToOrigin[0] + i;
        //         const absoluteY = this.relativeToOrigin[1] + j;
        //         drawCell(
        //             this.ctx,
        //             [absoluteX, absoluteY],
        //             this.resolution,
        //             Math.floor(Math.random() * 2) === 1 ? true : false
        //             // this.globalDick[`xy${absoluteX}_${absoluteY}`]
        //             //     ? true
        //             //     : false
        //         );
        //     }
        // }
    }

    render() {
        if (this.running) {
            this.updateGameState();
            // this.draw();
        }
    }
    startGame(startingPattern: Cell[]) {
        if (!this.running) {
            this.running = true;
            // this.world.forEach((row, rowIndex) =>
            //     row.map((cell, colIndex) => {
            //         if (this.ctx) {
            //             drawCell(
            //                 this.ctx,
            //                 [colIndex, rowIndex],
            //                 this.resolution,
            //                 cell ? true : false
            //             );
            //         }
            //     })
            // );

            startingPattern.forEach((cell) => {
                this.globalDick[cell.id] = cell;
                this.currentTreeNode.insert(cell);
                // drawCell(
                //     this.ctx,
                //     [cell.x, cell.y],
                //     this.resolution,
                //     cell.state
                // );
            });
        }
    }
    endGame() {
        this.running = false;
    }
    advanceOneGen() {
        this.updateGameState();
    }
    moveLeft() {
        this.relativeToOrigin = [
            this.relativeToOrigin[0] - 1,
            this.relativeToOrigin[1],
        ];
        this.redraw = true;
    }
    moveRight() {
        this.relativeToOrigin = [
            this.relativeToOrigin[0] + 1,
            this.relativeToOrigin[1],
        ];
        this.redraw = true;
    }
    moveUp() {
        this.relativeToOrigin = [
            this.relativeToOrigin[0],
            this.relativeToOrigin[1] - 1,
        ];
        this.redraw = true;
    }
    moveDown() {
        this.relativeToOrigin = [
            this.relativeToOrigin[0],
            this.relativeToOrigin[1] + 1,
        ];
        this.redraw = true;
    }
}
