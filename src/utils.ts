import { Cell } from "./revQuadTree.draft";
import { ParseResult } from "./rle";
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
): number[][] {
    return Array.from({ length: height / resolution }, () =>
        Array.from({ length: width / resolution }, () =>
            Math.floor(Math.random() * 0)
        )
    );
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
    console.log("i applied the updates");
}

export function transformToCells(pattern: ParseResult): Cell[] {
    const updates: Update[] = [];
    for (let i = 0; i < pattern.x.length; i++) {
        const xEl = pattern.x[i];
        const yEl = pattern.y[i];
        const id = `xy${xEl}_${yEl}`;
        const action = "resurrect";
        updates.push({ id, action });
    }
    return updates.map((el, i) => {
        const [x, y] = getCoordinate(updates[i].id);
        const state = el.action === "resurrect" ? true : false;

        const cell: Cell = {
            id: updates[i].id,
            x: x,
            y: y,
            state,
        };
        return cell;
    });
}
