import type { NextPage } from 'next';
import { RefObject, useEffect, useRef } from 'react';

type Update = {
  id: string;
  action: 'kill' | 'resurrect';
};
type Coordinate = [number, number];
function getCoordinate(id: string): [number, number] {
  const splitId = id.replace('xy_', '').split('_');
  return [Number(splitId[0]), Number(splitId[1])];
}
function drawCell(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  resolution: number,
  cell: boolean,
  playerCoordinate: Coordinate,
  visibleWorld: VisibleWorld
) {
  // if (
  //   coordinate[0] >= visibleWorld.x[0] &&
  //   coordinate[0] <= visibleWorld.x[1] &&
  //   coordinate[1] >= visibleWorld.y[0] &&
  //   coordinate[1] <= visibleWorld.y[1]
  // ) {
  if (
    coordinate[0] !== playerCoordinate[0] ||
    coordinate[1] !== playerCoordinate[1]
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
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  resolution: number
) {
  ctx.beginPath();
  ctx.rect(
    coordinate[0] * resolution,
    coordinate[1] * resolution,
    resolution,
    resolution
  );
  ctx.fillStyle = 'red';
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

type VisibleWorld = {
  x: [number, number];
  y: [number, number];
};
class game {
  liveCells: Record<string, boolean>;
  world: number[][];
  state: boolean;
  canvas: RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
  ROWS: number;
  COLS: number;
  resolution: number;
  requestId: number;
  player: Coordinate;
  visibleWorld: VisibleWorld;

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
    this.ROWS = height / resolution;
    this.COLS = width / resolution;
    this.requestId = 0;
    this.player = [0, 0];
    this.visibleWorld = {
      x: [0, this.COLS],
      y: [0, this.ROWS],
    };
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
        cellUpdates.push(this.computeUpdates(cell, cellUpdateMemo, true));
      }
    }
    return cellUpdates.flat();
  }
  updateGameState() {
    const ctx = this.canvas?.current?.getContext('2d');
    const cellUpdateMemo = {};
    let cellUpdates = [];

    for (const liveCell in this.liveCells) {
      const coordinate = liveCell
        .replace('xy_', '')
        .split('_')
        .map((elem) => Number(elem));
      cellUpdates.push(this.computeUpdates(coordinate, cellUpdateMemo, false));
    }

    cellUpdates = cellUpdates.flat();

    for (const cellUpdate of cellUpdates) {
      // const coordinate = getCoordinate(cellUpdate.id);

      switch (cellUpdate.action) {
        case 'resurrect':
          this.liveCells[cellUpdate.id] = true;
          // if (ctx) {
          //   drawCell(
          //     ctx,
          //     coordinate,
          //     this.resolution,
          //     true,
          //     this.player,
          //     this.visibleWorld
          //   );
          // }
          break;
        case 'kill':
          delete this.liveCells[cellUpdate.id];
          // if (ctx) {
          //   drawCell(
          //     ctx,
          //     coordinate,
          //     this.resolution,
          //     false,
          //     this.player,
          //     this.visibleWorld
          //   );
          // }
          break;
      }
    }
    if (ctx) {
      console.log(this.visibleWorld);
      const arrayOfCoords = Array.from(
        Array(this.ROWS * this.COLS).map((el) => {})
      );
      // const arrayOfXCoords = Array.from(
      //   Array(this.visibleWorld.x[1] - this.visibleWorld.x[0] - 1)
      // ).map((x) => {
      //   counterX++;
      //   return counterX;
      // });
      // const arrayOfYCoords = Array.from(
      //   Array(this.visibleWorld.y[1] - this.visibleWorld.y[0] - 1)
      // ).map((x) => {
      //   counterY++;
      //   return counterY;
      // });

      // console.log({ arrayOfXCoords, arrayOfYCoords });
      // arrayOfXCoords.forEach((_, i) =>
      //   drawCell(
      //     ctx,
      //     [arrayOfXCoords[i], arrayOfYCoords[i]],
      //     this.resolution,
      //     this.liveCells[`xy_${arrayOfXCoords[i]}_${arrayOfYCoords[i]}`],
      //     this.player,
      //     this.visibleWorld
      //   )
      // );
    }
  }

  render() {
    if (this.state) {
      this.updateGameState();
      setTimeout(() => {
        requestAnimationFrame(this.render.bind(this));
      }, 100);
    }
  }
  startGame() {
    if (!this.state) {
      this.state = true;
      const ctx = this.canvas?.current?.getContext('2d');
      if (ctx) {
        drawPlayer(ctx, [0, 0], this.resolution);
      }
      this.world.forEach((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (ctx) {
            drawCell(
              ctx,
              [colIndex, rowIndex],
              this.resolution,
              cell ? true : false,
              this.player,
              this.visibleWorld
            );
          }
        })
      );

      this.render();
    }
  }
  endGame() {
    this.state = false;
  }
  advanceOneGen() {
    this.updateGameState();
  }
  moveWorldLeft() {
    const newMinX = this.visibleWorld.x[0] - 1;
    this.visibleWorld = {
      x: [newMinX, newMinX + this.COLS],
      y: [this.visibleWorld.y[0], this.visibleWorld.y[1]],
    };
  }
  reset() {
    this.liveCells = getLiveCells(this.world);
  }
}

const Home: NextPage = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = 800;
  const height = 800;
  const resolution = 50;
  const myGame = new game(width, height, resolution, canvas);

  useEffect(() => {
    function onKeyPress(e: KeyboardEvent) {
      switch (e.key) {
        case 'h':
          myGame.moveWorldLeft();
          break;

        default:
          break;
      }
    }
    addEventListener('keypress', onKeyPress);
    return () => {
      removeEventListener('keypress', onKeyPress);
    };
  }, []);

  return (
    <div>
      <canvas ref={canvas} width={width} height={height} />
      <button onClick={() => myGame.startGame()}>START</button>
      <button onClick={() => myGame.endGame()}>StopGame</button>
      <button onClick={() => myGame.reset()}>Reset</button>
      <button onClick={() => myGame.advanceOneGen()}>+Gen</button>
    </div>
  );
};

export default Home;
