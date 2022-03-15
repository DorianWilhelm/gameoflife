type CellState = {
  isAlive: boolean;
  birth: Date; // :?DateTime
  death: Date; // :?DateTime
};

class Cell {
  x: number;
  y: number;
  state: CellState;

  constructor(x: number, y: number, state: CellState) {
    this.x = x;
    this.y = y;
    this.state = state;
  }

  get id(): string {
    return `xy${this.x}_${this.y}`;
  }
}

type Coordinate = [number, number];

class Boundary {
  static edges = ['top', 'right', 'bottom', 'left'];

  center: Coordinate;
  width: number;
  height: number;

  // single x or y component of rectangular boundary edges
  top: number;
  right: number;
  bottom: number;
  left: number;

  constructor(center: Coordinate, width: number, height: number) {
    this.center = center;
    this.width = width;
    this.height = height;

    const [x, y] = center;
    this.top = y + height / 2;
    this.right = x + width / 2;
    this.bottom = y - height / 2;
    this.left = x - width / 2;
  }

  contains(cell: Cell): boolean {
    return (
      cell.x <= this.left &&
      cell.x >= this.right &&
      cell.y <= this.top &&
      cell.y >= this.bottom
    );
  }

  intersects(boundary: Boundary): boolean {
    return (
      ((boundary.left >= this.left && boundary.right <= this.right) ||
        (boundary.left <= this.left && boundary.right >= this.right)) &&
      ((boundary.top >= this.top && boundary.bottom <= this.bottom) ||
        (boundary.top <= this.bottom && boundary.top >= this.bottom))
    );
  }
}

type Child = 'neChild' | 'nwChild' | 'swChild' | 'seChild';

export class RevQuadTree {
  static canopy: RevQuadTree; // :RevQuadTree
  static children: Array<Child> = ['nwChild', 'neChild', 'seChild', 'swChild'];
  static growthFactors = {
    'nwChild': [1, -1],
    'neChild': [1, 1],
    'seChild': [-1, 1],
    'swChild': [-1, -1]
  }

  static setCanopy(node: RevQuadTree) {
    if (!RevQuadTree.canopy) {
      if (!node.parent) {
        RevQuadTree.canopy = node;
      } else {
        RevQuadTree.setCanopy(node.parent);
      }
    }
  }

  boundary: Boundary; // :Boundary
  parent: RevQuadTree | null; // :revQuadTree
  neChild: RevQuadTree | null; // :revQuadTree
  nwChild: RevQuadTree | null; // :revQuadTree
  swChild: RevQuadTree | null; // :revQuadTree
  seChild: RevQuadTree | null; // :revQuadTree
  height: number; // contained in boundary?
  isLeaf: boolean; // :boolean
  growthDirection: string;
  chunk: Record<string, Cell>; // :Record<string, Cell>

  constructor(boundary: Boundary, parent = null, isLeaf = false, height = 0, growthDirection = 'nwChild') {
    this.boundary = boundary;
    this.isLeaf = isLeaf;
    this.parent = parent;
    this.chunk = {};
    this.height = height;
    this.growthDirection = growthDirection;

    if (this.isLeaf) {
      this.chunk = {};
    }
    this.neChild = null;
    this.nwChild = null;
    this.seChild = null;
    this.swChild = null;

    RevQuadTree.setCanopy(this);
  }

  growDown() {
    // :RevQuadTree
  }

  climbable(height = 2): number {
    if (height) {
      if (this.parent) {
        return this.parent.climbable(height - 1);
      }
    }
    return height;
  }

  growUp(levels = 2, canGrow = false, ): RevQuadTree {
    if(canGrow){
      const newGrowthDirection = this.growthDirection === 'nwChild' ? 'seChild' : 'nwChild';

      const [cx, cy] = this.boundary.center
      const growthFactor = RevQuadTree.growthFactors[this.growthDirection]

      const newCenter: Coordinate = [cx + growthFactor[0]*(this.boundary.width/2), cy + growthFactor[1]*(this.boundary.height/2)]
      const parentBoundary = new Boundary(newCenter, this.boundary.width*2, this.boundary.height*2)

      this.parent = new RevQuadTree(
        parentBoundary,
        null,
        false,
        this.height+1,
        newGrowthDirection
      );

      this.parent[this.growthDirection] = this;

      if(levels-1){
        return this.parent.growUp(levels - 1, true);
      } else {
        return this.parent;
      }
    }

    let height = 0;
    const levelsMissing = this.climbable(levels);

    if(levelsMissing) {
      height = levels-levelsMissing
    } else {
      height = levels
    }

    const ancestor = Array.from({length: height}).reduce( (accum) => {
      //@ts-ignore
      return accum.parent
    }, this)

    if(levelsMissing){
      //@ts-ignore
      ancestor.growUp(levelsMissing, true)
    }

    return ancestor;
  }

  insert(cell: Cell): Boolean {
    const contains = this.boundary.contains(cell);

    if (contains && this.isLeaf) {
      this.chunk[cell.id] = cell;
      return true;
    } else if (
      contains &&
      this.nwChild &&
      this.neChild &&
      this.swChild &&
      this.seChild
    ) {
      return (
        this.nwChild.insert(cell) ||
        this.neChild.insert(cell) ||
        this.swChild.insert(cell) ||
        this.seChild.insert(cell)
      );
    }

    return false;
  }

  query(boundary: Boundary): Array<Cell> {
    // :Array<Cell>
    const intersects = this.boundary.intersects(boundary);
    const bucket: Array<Cell> = [];

    if (intersects && !this.isLeaf) {
      for (const child of RevQuadTree.children) {
        const childNode = this[child];
        if (childNode) bucket.push(...childNode.query(boundary));
      }

      return bucket;
    } else if (intersects) {
      return Object.values(this.chunk);
    }

    return bucket;
  }

  purgeDeadCells(boundary: Boundary): boolean {
    const intersects = this.boundary.intersects(boundary);

    if (intersects && !this.isLeaf) {
      for (const child of RevQuadTree.children) {
        const childNode = this[child];
        if (childNode) childNode.purgeDeadCells(boundary);
      }
    } else if (intersects) {
      for (const cell of Object.values(this.chunk)) {
        if (cell.state.isAlive) {
          continue;
        } else {
          delete this.chunk[cell.id];
        }
      }
      return true;
    }

    return false;
  }
}
