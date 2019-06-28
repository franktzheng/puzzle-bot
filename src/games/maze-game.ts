import _ from 'lodash'
import { UnionTree } from '../utils'
import { Game, GameStatus } from '../game'
import { RichEmbed } from 'discord.js'

interface MazeEdge {
  x: number
  y: number
  direction: 'S' | 'E'
}

interface MazeGridTile {
  fillBottom: boolean
  fillRight: boolean
}

const MAZE_SIZES: [number, number][] = [[8, 10], [16, 20], [24, 30]]

export class MazeGame extends Game {
  emojis = ['⬅', '⬆', '⬇', '➡']

  size: [number, number]
  difficulty: number
  mazeGrid: MazeGridTile[][] = []
  playerCoordinates: [number, number] = [0, 0]

  constructor(gameID: string, { difficulty }: { difficulty: number }) {
    super(gameID)
    this.difficulty = difficulty
  }

  async setup() {
    this.size = MAZE_SIZES[this.difficulty - 1]
    this.mazeGrid = generateMaze(...this.size)
  }

  async generateEmbed(): Promise<RichEmbed> {
    const asciiArt = drawMazeASCII(this.mazeGrid, this.playerCoordinates)
    return new RichEmbed({
      title: `Puzzle - Maze - ${this.gameID}`,
      description: asciiArt,
    })
  }

  getStatus(): GameStatus {
    if (
      this.playerCoordinates[0] === this.mazeGrid.length - 1 &&
      this.playerCoordinates[1] === this.mazeGrid[0].length - 1
    ) {
      return { status: 'win' }
    }
    return { status: 'pending' }
  }

  update(emoji: string) {
    const [r, c] = this.playerCoordinates
    const [numOfRows, numOfColumns] = this.size
    switch (emoji) {
      case '⬅':
        if (c !== 0 && !this.mazeGrid[r][c - 1].fillRight) {
          this.playerCoordinates[1] = c - 1
        }
        break
      case '⬆':
        if (r !== 0 && !this.mazeGrid[r - 1][c].fillBottom) {
          this.playerCoordinates[0] = r - 1
        }
        break
      case '⬇':
        if (!this.mazeGrid[r][c].fillBottom && r !== numOfColumns - 1) {
          this.playerCoordinates[0] = r + 1
        }
        break
      case '➡':
        if (!this.mazeGrid[r][c].fillRight && c !== numOfColumns - 1) {
          this.playerCoordinates[1] = c + 1
        }
        break
    }
  }
}

// Uses Kruskal's algorithm
// http://weblog.jamisbuck.org/2011/1/3/maze-generation-kruskal-s-algorithm
function generateMaze(width: number, height: number) {
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
    const [x2, y2] = direction === 'E' ? [x1 - 1, y1] : [x1, y1 - 1]
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
  }

  return grid
}

export function drawMazeASCII(
  grid: MazeGridTile[][],
  playerCoordinates: [number, number],
) {
  let gridString = '```\n '
  gridString += '_'.repeat(2 * grid[0].length - 1)
  gridString += '\n'
  grid.forEach((row, rowIndex) => {
    const isLastRow = rowIndex === grid.length - 1
    const isFirstRow = rowIndex === 0
    gridString += isFirstRow ? ' ' : '|'
    row.forEach((gridItem, colIndex) => {
      const isLastColumn = colIndex === grid[0].length - 1
      const matchesCoordinates =
        playerCoordinates[0] === rowIndex && playerCoordinates[1] === colIndex
      const { fillBottom, fillRight } = gridItem

      gridString += fillBottom
        ? matchesCoordinates
          ? '⍶'
          : isLastRow && isLastColumn
          ? ' '
          : '_'
        : matchesCoordinates
        ? 'α'
        : ' '
      gridString +=
        fillRight || isLastColumn ? '|' : isLastRow || fillBottom ? '_' : ' '
    })
    gridString += '\n'
  })
  return gridString + '```'
}
