class CellState {
    isAlive; // :boolean
    birth; // :?DateTime
    death; // :?DateTime
}

class Cell {
    x; // :number
    y; // :number
    state; // :?CellState

    constructor(x,y, state){
        this.x = x;
        this.y = y;
        this.state = state;
    }

    get id(){ // :string
        return `xy${x}_${y}`
    }
}


class Boundary {
    static edges = ['top', 'right', 'bottom', 'left']

    center; // :Coordinate
    width; // :number
    height; // :number

    // single x or y component of rectangular boundary edges
    top; // :number
    right; // :number
    bottom; // :number
    left; // :number

    constructor(center, width, height){
        this.center = center;
        this.width = width;
        this.height = height;

        const [x, y] = center;
        this.top = y+height/2
        this.right = x+width/2
        this.bottom = y-height/2
        this.left = x-width/2
    }

    contains(cell){
        return (
            cell.x <= this.left && cell.x >= this.right &&
            cell.y <= this.top && cell.y >= this.bottom
        )
    }

    intersects(boundary){ // :boolean
        return (
            (
                boundary.left >= this.left && boundary.right <= this.right ||
                boundary.left <= this.left && boundary.right >= this.right
            ) && (
                boundary.top >= this.top && boundary.bottom <= this.bottom ||
                boundary.top <= this.bottom && boundary.top >= this.bottom
            )
        )
    }
}


class RevQuadTree {
    static canopy; // :RevQuadTree
    static children = ['neChild', 'nwChild', 'swChild', 'seChild']

    static 

    static setCanopy(node){
        if(!RevQuadTree.canopy){
            if(!node.parent){
                RevQuadTree.canopy = this;
            } else {
                RevQuadTree.setCanopy(this.parent)
            }
        } 
    }

    boundary; // :Boundary
    parent; // :revQuadTree
    neChild; // :revQuadTree
    nwChild; // :revQuadTree
    swChild; // :revQuadTree
    seChild; // :revQuadTree
    height; // :number
    isLeaf; // :boolean
    chunk; // :Record<string, Cell>
    
    constructor(boundary, parent = null, isLeaf = false){
        this.boundary = boundary;
        this.isLeaf = isLeaf;
        this.parent = parent

        if(this.isLeaf){
            this.chunk = {}
        }

        RevQuadTree.setCanopy(this)
    }

    growDown(){ // :RevQuadTree
    }

    climbable(height = 2){ // :boolean
        if(height){
            if(this.parent){
                return this.parent.climb(height-1)
            }
            else {
                return false
            }
        }
        
        return true;
    }

    growUp(levels = 2, canGrow = false){ // :RevQuadTree
        if(canGrow){}

        if( this.climbable(levels) ){
            if(start){
                this.parent = new RevQuadTree(
                    new Boundary()
                )
                this.parent['neChild'] = this
                return this.parent.grow(start = false)
            }
            else {
                this.parent = new RevQuadTree(
                    new Boundary()
                )
                this.parent['swChild'] = this
                return this.parent;
            }
        }

        return this.parent.parent
    }

    insert(cell){ // :boolean
        const contains = this.boundary.contains(cell);

        if(contains && this.isLeaf){
            this.chunk[cell.id] = cell;
            return true;
        }
        else if (contains){
            return (
                this.nwChild.insert(cell) ||
                this.neChild.insert(cell) ||
                this.swChild.insert(cell) ||
                this.seChild.insert(cell)
            )
        }

        return false;
    }

    query(boundary){ // :Array<Cell>
        const intersects = this.boundary.instersects(boundary);
        const bucket = [];

        if(intersects && !this.isLeaf){

            for(const child of RevQuadTree.children){
                bucket.push(...this[child].query(boundary) )
            }

            return bucket;
        }
        else if (intersects){
            return Object.values(this.chunk);
        }

        return bucket;
    }

    purgeDeadCells(boundary){ // :void
        const intersects = this.boundary.instersects(boundary);

        if(intersects && !this.isLeaf){
            for(const child of RevQuadTree.children){
                this[child].purgeDeadCells(boundary)
            }
        }
        else if (intersects) {
            for(const cell of this.chunk){
                if(cell.state.isAlive){
                    continue;
                } else {
                    delete this.chunk[cell.id]
                }
            }
            return true;
        }

        return false
    }
}
