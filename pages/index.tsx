import type { NextPage } from 'next';
import { RefObject, useRef } from 'react';

type Update = {
  id: string;
  action: 'kill' | 'resurrect';
};
function drawCells(
  ctx: CanvasRenderingContext2D,
  coordinate: number[],
  resolution: number,
  cell: boolean
) {
  ctx.beginPath();
  ctx.rect(
    coordinate[0] * resolution,
    coordinate[1] * resolution,
    resolution,
    resolution
  );
  ctx.fillStyle = cell ? 'green' : 'white';
  ctx.fill();
  ctx.stroke();
}

function createWorld(height: number, width: number, resolution: number) {
  const grid = new Array(height / resolution)
    .fill(null)
    .map(() => new Array(width / resolution).fill(null));
  return grid.map((row) => row.map((col) => Math.floor(Math.random() * 4)));
}

function getLiveCells(grid: number[][]) {
  const world: Record<string, boolean> = {};
  grid.forEach((row, rowIndex) =>
    row.forEach((_, colIndex) => {
      const randomize = Math.floor(Math.random() * 2);
      if (randomize) {
        world[`xy_${colIndex}_${rowIndex}`] = true;
      }
    })
  );
  return world;
}
class game {
  liveCells: Record<string, boolean>;
  world: number[][];
  state: boolean;
  canvas: RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
  resolution: number;
  requestId: number;

  constructor(
    width: number,
    height: number,
    resolution: number,
    canvas: RefObject<HTMLCanvasElement>
  ) {
    this.world = createWorld(height, width, resolution);
    this.liveCells = getLiveCells(this.world);
    this.state = false;
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.resolution = resolution;
    this.requestId = 0;
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
          action: 'kill',
        };
      }
    } else {
      if (count == 3) {
        return {
          id: id,
          action: 'resurrect',
        };
      }
    }
  }
  computeUpdates(
    coordinate: number[],
    hoodRadius: number,
    cellUpdateMemo: Record<string, boolean>,
    stop: boolean
  ): Update | Update[] {
    const id = `xy_${coordinate[0]}_${coordinate[1]}`;

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
        const id = `xy_${neighbor[0]}_${neighbor[1]}`;
        if (this.liveCells[id]) {
          aliveCellsCounter++;
        }
      }
      const isAlive = this.liveCells[id] ? true : false;
      const update = this.checkUpdateRules(id, isAlive, aliveCellsCounter);
      if (update) {
        return update;
      }
    } else {
      neighborhood.push(coordinate);
      for (const cell of neighborhood) {
        cellUpdates.push(this.computeUpdates(cell, 0, cellUpdateMemo, true));
      }
    }
    return cellUpdates.flat();
  }
  poop() {
    const ctx = this.canvas?.current?.getContext('2d');
    const cellUpdateMemo = {};
    let cellUpdates = [];

    for (const liveCell in this.liveCells) {
      const coordinate = liveCell
        .replace('xy_', '')
        .split('_')
        .map((elem) => Number(elem));
      cellUpdates.push(
        this.computeUpdates(coordinate, 0, cellUpdateMemo, false)
      );
    }

    cellUpdates = cellUpdates.flat();

    console.log('woah');
    console.log('cellUpdates!!!: ', cellUpdates);

    for (const cellUpdate of cellUpdates) {
      const id: string = cellUpdate.id;
      console.log('hi i am going over my updates now');

      const coordinate = id
        .replace('xy_', '')
        .split('_')
        .map((elem) => Number(elem));

      switch (cellUpdate.action) {
        case 'resurrect':
          this.liveCells[id] = true;
          if (ctx) {
            drawCells(ctx, coordinate, this.resolution, true);
          }
          break;
        case 'kill':
          delete this.liveCells[id];
          if (ctx) {
            drawCells(ctx, coordinate, this.resolution, false);
          }
          break;
      }
    }
  }

  render() {
    this.poop();
    setTimeout(() => {
      requestAnimationFrame(this.render.bind(this));
    }, 10);
  }
  startGame() {
    this.state = true;
    const ctx = this.canvas?.current?.getContext('2d');
    this.world.forEach((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (ctx) {
          drawCells(
            ctx,
            [colIndex, rowIndex],
            this.resolution,
            cell === 1 ? true : false
          );
        }
      })
    );

    this.render();
  }
  endGame() {
    this.state = false;
  }
  reset() {
    this.liveCells = getLiveCells(this.world);
  }
}

const Home: NextPage = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = 800;
  const height = 800;
  const resolution = 10;
  const myGame = new game(width, height, resolution, canvas);

  return (
    <div>
      <canvas ref={canvas} width={width} height={height} />
      <button onClick={() => myGame.startGame()}>START</button>
      <button onClick={() => myGame.endGame()}>StopGame</button>
      <button onClick={() => myGame.reset()}>Reset</button>
    </div>
  );
};

export default Home;
