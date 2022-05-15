import { Cell } from "./revQuadTree.draft";
import { Update } from "./types";

export function getCoordinate(id: string): number[] {
    return id
        .replace("xy", "")
        .split("_")
        .map((elem) => Number(elem));
}

export function drawCell(
    ctx: CanvasRenderingContext2D | null,
    coordinate: number[],
    resolution: number,
    cell: boolean
) {
    if (ctx) {
        ctx.beginPath();
        ctx.rect(
            coordinate[0] * resolution,
            coordinate[1] * resolution,
            resolution,
            resolution
        );
        ctx.fillStyle = cell ? "green" : "white";
        ctx.fill();
        ctx.stroke();
    }
}

export function drawPlayer(
    ctx: CanvasRenderingContext2D | null,
    coordinate: number[],
    resolution: number
) {
    if (ctx) {
        ctx.beginPath();
        ctx.rect(
            coordinate[0] * resolution,
            coordinate[1] * resolution,
            resolution,
            resolution
        );
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.stroke();
    }
}

export function createWorld(
    height: number,
    width: number,
    resolution: number
): Cell[] {
    const world: Cell[] = [];
    for (let colIndex = 0; colIndex < height / resolution; colIndex++) {
        for (let rowIndex = 0; rowIndex < width / resolution; rowIndex++) {
            if (Math.floor(Math.random() * 2) > 0.5) {
                world.push(new Cell(colIndex, rowIndex, true));
            }
        }
    }
    return world;
}

export function getLiveCells(grid: number[][]) {
    const world: Record<string, boolean> = {};
    grid.forEach((row, rowIndex) =>
        row.forEach((_, colIndex) => {
            world[`xy${colIndex}_${rowIndex}`] = _ === 1 ? true : false;
        })
    );
    return world;
}

export function applyCellupdates(
    cellUpdates: Update[],
    liveCells: Record<string, boolean>,
    ctx: CanvasRenderingContext2D | null,
    resolution: number
) {
    for (const cellUpdate of cellUpdates) {
        const id: string = cellUpdate.id;
        const coordinate = getCoordinate(id);

        switch (cellUpdate.action) {
            case "resurrect":
                liveCells[id] = true;
                drawCell(ctx, coordinate, resolution, true);
                break;
            case "kill":
                delete liveCells[id];
                drawCell(ctx, coordinate, resolution, false);
                break;
        }
    }
}
