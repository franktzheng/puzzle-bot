import _ from 'lodash'

interface MazeEdge {
  x: number
  y: number
  direction: 'S' | 'E'
}

interface MazeGridTile {
  fillBottom: boolean
  fillRight: boolean
}

function moveCoordinates([x, y]: [number, number], direction: 'S' | 'E') {
  if (direction === 'E') {
    return [x - 1, y]
  }
  return [x, y - 1]
}

// Uses Kruskal's algorithm
// http://weblog.jamisbuck.org/2011/1/3/maze-generation-kruskal-s-algorithm
class UnionTree {
  parent: UnionTree | null = null

  getRoot(): UnionTree {
    return this.parent ? this.parent.getRoot() : this
  }

  connect(tree: UnionTree) {
    tree.getRoot().parent = this
  }

  isConnected(tree: UnionTree) {
    return tree.getRoot() === this.getRoot()
  }
}

export function getGridString(
  grid: MazeGridTile[][],
  coordinates: [number, number],
) {
  let gridString = ' '
  gridString += '_'.repeat(6 * grid[0].length - 1)
  gridString += '\n'
  grid.forEach((row, rowIndex) => {
    const isLastRow = rowIndex === grid.length - 1
    gridString += '|'
    row.forEach(gridItem => {
      const { fillRight } = gridItem
      gridString += '   '
      gridString += fillRight ? '  |' : '   '
    })
    gridString += '\n|'
    row.forEach((gridItem, colIndex) => {
      const matchesCoordinates =
        coordinates[0] === rowIndex && coordinates[1] === colIndex
      const { fillRight } = gridItem
      gridString += matchesCoordinates ? ' uw' : '   '
      gridString += matchesCoordinates
        ? fillRight
          ? 'u |'
          : 'u  '
        : fillRight
        ? '  |'
        : '   '
    })
    gridString += '\n|'
    row.forEach((gridItem, colIndex) => {
      const isLastColumn = colIndex === grid[0].length - 1
      const { fillBottom, fillRight } = gridItem
      gridString += fillBottom || isLastRow ? '___' : '   '
      gridString +=
        fillRight || isLastColumn
          ? fillBottom
            ? '__|'
            : '  |'
          : isLastRow
          ? '___'
          : fillBottom
          ? '___'
          : '   '
    })
    gridString += '\n'
  })
  return gridString
}

export function generateMaze(width: number, height: number) {
  const widthArray = [...Array(width)]
  const heightArray = [...Array(height)]

  let edges: MazeEdge[] = _.flatMap(widthArray, (_value, x) => {
    return _.flatMap(heightArray, (_value, y) => {
      const possibleEdges: MazeEdge[] = []
      if (y > 0) {
        possibleEdges.push({ x, y, direction: 'S' })
      }
      if (x > 0) {
        possibleEdges.push({ x, y, direction: 'E' })
      }
      return possibleEdges
    })
  })
  edges = _.shuffle(edges)
  const grid: MazeGridTile[][] = widthArray.map(() =>
    heightArray.map(() => ({ fillBottom: true, fillRight: true })),
  )
  const sets = widthArray.map(() => heightArray.map(() => new UnionTree()))

  while (edges.length > 0) {
    const { x: x1, y: y1, direction } = edges.pop()!
    const [x2, y2] = moveCoordinates([x1, y1], direction)
    const set1 = sets[x1][y1]
    const set2 = sets[x2][y2]

    if (!set1.isConnected(set2)) {
      set1.connect(set2)
      if (direction === 'S') {
        grid[x2][y2].fillRight = false
      } else {
        grid[x2][y2].fillBottom = false
      }
    }
    // grid[x1][y1].fillRight = true
    // grid[x1][y1].fillBottom = true
  }

  return grid
}
