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

  get id() {
    // :string
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
  static children: Array<Child> = ['neChild', 'nwChild', 'swChild', 'seChild'];

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
  chunk: Record<string, Cell>; // :Record<string, Cell>

  constructor(boundary: Boundary, parent = null, isLeaf = false, height = 0) {
    this.boundary = boundary;
    this.isLeaf = isLeaf;
    this.parent = parent;
    this.chunk = {};
    this.height = height;

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

  climbable(height = 2) {
    // :boolean
    if (height) {
      if (this.parent) {
        return this.parent.climb(height - 1);
      } else {
        return false;
      }
    }

    return true;
  }

  growUp(levels = 2, canGrow = false) {
    // :RevQuadTree
    if (canGrow) {
    }

    if (this.climbable(levels)) {
      if (levels) {
        this.parent = new RevQuadTree(new Boundary());
        this.parent['neChild'] = this;
        return this.parent.growUp(levels - 1);
      } else {
        this.parent = new RevQuadTree(new Boundary());
        this.parent['swChild'] = this;
        return this.parent;
      }
    }

    return this.parent.parent;
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
