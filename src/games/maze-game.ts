import _ from 'lodash'
import { RichEmbed } from 'discord.js'
import Canvas from 'canvas'
import fs from 'fs'

import { UnionTree, Draw } from '../utils'
import { Game, GameStatus } from '../game'

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
  prevFileName: string = null
  ascii: boolean

  constructor(
    gameID: string,
    { difficulty, ascii }: { difficulty: number; ascii: boolean },
  ) {
    super(gameID)
    this.difficulty = difficulty
    this.ascii = ascii
  }

  async setup() {
    this.size = MAZE_SIZES[this.difficulty - 1]
    this.mazeGrid = generateMaze(...this.size)
  }

  async generateEmbed(): Promise<RichEmbed> {
    if (this.ascii) {
      const asciiArt = drawMazeASCII(this.mazeGrid, this.playerCoordinates)
      return new RichEmbed({
        title: `Puzzle - Maze - ${this.gameID}`,
        description: asciiArt,
      })
    }
    const buffer = drawMazeImage(this.mazeGrid, this.playerCoordinates)
    const fileName = `maze_${this.gameID}_${Math.floor(
      Math.random() * 10000000,
    )}.png`
    if (!fs.existsSync('./public/game-images')) {
      fs.mkdirSync('./public')
      fs.mkdirSync('./public/game-images')
    }
    fs.writeFileSync(`./public/game-images/${fileName}`, buffer)
    this.prevFileName &&
      fs.unlinkSync(`./public/game-images/${this.prevFileName}`)
    this.prevFileName = fileName
    return new RichEmbed({
      title: `Puzzle - Maze - ${this.gameID}`,
      description:
        'Try to reach the end of the maze.\n\nTo play an ASCII version:```?puzzle maze <difficulty> ascii```',
      image: { url: `${process.env.BASE_URL}/game-images/${fileName}` },
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
function drawMazeImage(
  mazeGrid: MazeGridTile[][],
  playerCoordinates: [number, number],
) {
  const numOfRows = mazeGrid.length
  const numOfColumns = mazeGrid[0].length

  const canvas = Canvas.createCanvas(300, 300)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#2C2F33'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const mazeMargin = 15
  const width = canvas.width - mazeMargin * 2
  const height = canvas.height - mazeMargin * 2
  const columnWidth = width / numOfColumns
  const rowHeight = width / numOfRows
  const mazeThickness = Math.round(20 / numOfRows)

  ctx.strokeStyle = 'white'
  ctx.lineWidth = mazeThickness
  ctx.beginPath()
  Draw.roundRect(ctx, mazeMargin, mazeMargin, width, height, mazeThickness * 3)
  ctx.stroke()
  ctx.closePath()

  for (let r = 0; r < numOfRows; r++) {
    for (let c = 0; c < numOfColumns; c++) {
      const x = c * columnWidth + mazeMargin
      const y = r * rowHeight + mazeMargin
      const gridTile = mazeGrid[r][c]
      ctx.fillStyle = 'white'
      if (gridTile.fillBottom && r !== numOfRows - 1) {
        ctx.fillRect(x, y + rowHeight, columnWidth, mazeThickness)
      }
      if (gridTile.fillRight && c !== numOfColumns - 1) {
        ctx.fillRect(x + columnWidth, y, mazeThickness, rowHeight)
      }
      if (r === playerCoordinates[0] && c === playerCoordinates[1]) {
        ctx.fillStyle = '#7289DA'
        ctx.beginPath()
        ctx.arc(
          x + columnWidth / 2,
          y + rowHeight / 2,
          columnWidth / 4,
          0,
          2 * Math.PI,
        )
        ctx.fill()
        ctx.closePath()
      }
    }
  }
  return canvas.toBuffer()
}
