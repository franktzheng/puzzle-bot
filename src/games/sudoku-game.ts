import { RichEmbed } from 'discord.js'
import rp from 'request-promise'
import Canvas from 'canvas'
import fs from 'fs'

import { Game, GameStatus, GameDifficulty } from '../core/game'
import { Draw } from '../utils'

const SUDOKU_EMOJIS = [
  '🇦',
  '🇧',
  '🇨',
  '🇩',
  '🇪',
  '🇫',
  '🇬',
  '🇭',
  '🇮',
  '1⃣',
  '2⃣',
  '3⃣',
  '4⃣',
  '5⃣',
  '6⃣',
  '7⃣',
  '8⃣',
  '9⃣',
  '❌',
]

const SUDOKU_EMOJI_MAP: { [emoji: string]: number | string } = {
  '🇦': 'A',
  '🇧': 'B',
  '🇨': 'C',
  '🇩': 'D',
  '🇪': 'E',
  '🇫': 'F',
  '🇬': 'G',
  '🇭': 'H',
  '🇮': 'I',
  '1⃣': 1,
  '2⃣': 2,
  '3⃣': 3,
  '4⃣': 4,
  '5⃣': 5,
  '6⃣': 6,
  '7⃣': 7,
  '8⃣': 8,
  '9⃣': 9,
}

interface SudokuTile {
  value: number
  isUserInput: boolean
}

interface SudokuAPIResponse {
  response: boolean
  size: number
  squares: { x: number; y: number; value: number }[]
}

export class SudokuGame extends Game {
  static readonly SIZE = 9

  emojis = SUDOKU_EMOJIS
  name = 'Maze'

  board: SudokuTile[][] | null = null
  userInput: [number, number] = [null, null]
  inputIndex = 0
  prevFileName: string = null

  async setup() {
    this.board = await generateBoard(SudokuGame.SIZE, this.difficulty)
  }

  // generate image based on current tile and board state
  async generateEmbed(): Promise<RichEmbed> {
    const title = this.createGameTitle()

    if (this.isASCII) {
      const asciiArt = drawSudokuASCII(this.board, this.userInput)
      return new RichEmbed({
        title,
        description:
          'Fill in the digits.\n\nTo play the Normal version:```??puzzle sudoku <difficulty>```\n' +
          asciiArt,
      })
    }

    const buffer = drawSudokuImage(this.board, this.userInput)
    const fileName = `sudoku_${this.gameID}_${Math.floor(
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
      title,
      description:
        'Fill in the digits.\n\nTo play the ASCII version:```??ascii sudoku <difficulty>```',
      image: { url: `${process.env.BASE_URL}/game-images/${fileName}` },
    })
  }

  update(emoji: string): boolean {
    if (this.emojis.includes(emoji)) {
      if (emoji === '❌') {
        this.inputIndex > 0 && this.inputIndex--
        this.userInput[this.inputIndex] = null
      } else {
        const value = SUDOKU_EMOJI_MAP[emoji]
        if (this.inputIndex === 0) {
          if (typeof value === 'string') {
            this.userInput[this.inputIndex] = value.charCodeAt(0) - 64
          } else {
            return false
          }
        } else if (this.inputIndex === 1) {
          if (typeof value !== 'string') {
            this.userInput[this.inputIndex] = value
          } else {
            return false
          }
        } else if (this.inputIndex === 2) {
          if (typeof value !== 'string') {
            const [c, r] = this.userInput
            this.insertValue([c - 1, r - 1], value)
            this.userInput = [null, null]
          } else {
            return false
          }
        }
        this.inputIndex = (this.inputIndex + 1) % 3
      }
      return true
    }
  }

  getStatus(): GameStatus {
    const requiredDigits = [...Array(SudokuGame.SIZE)].map(
      (_value, index) => index + 1,
    )
    const correctSum = requiredDigits.reduce((sum, cur) => sum + cur, 0)
    const containsAllRequiredDigits = (arr: SudokuTile[]) => {
      return (
        JSON.stringify(arr.map(tile => tile.value).sort()) ===
        JSON.stringify(requiredDigits)
      )
    }
    const getTileSum = (arr: SudokuTile[]) =>
      arr.reduce((sum, cur) => sum + cur.value, 0)

    // row
    for (const row of this.board) {
      const rowSum = getTileSum(row)
      if (rowSum !== correctSum || !containsAllRequiredDigits(row)) {
        return { status: 'pending' }
      }
    }

    // column
    for (let c = 0; c < SudokuGame.SIZE; c++) {
      const col: SudokuTile[] = []
      for (const row of this.board) {
        col.push(row[c])
      }
      if (getTileSum(col) !== correctSum || !containsAllRequiredDigits(col)) {
        return { status: 'pending' }
      }
    }

    // square
    const numOfSquares = Math.sqrt(SudokuGame.SIZE)
    const squareSize = numOfSquares
    for (let sc = 0; sc < numOfSquares; sc++) {
      for (let sc = 0; sc < numOfSquares; sc++) {
        let square: SudokuTile[] = []
        for (let r = 0; r < squareSize; r++) {
          const row = sc * squareSize + r
          const colStartAndEnd = [sc * squareSize, (sc + 1) * squareSize]
          square = square.concat(this.board[row].slice(...colStartAndEnd))
        }
        if (
          getTileSum(square) !== correctSum ||
          !containsAllRequiredDigits(square)
        ) {
          return { status: 'pending' }
        }
      }
    }
    return { status: 'win' }
  }

  insertValue([r, c]: [number, number], value: number | null) {
    if (this.board[r][c] && !this.board[r][c].isUserInput) {
      return
    }
    this.board[r][c] = { value, isUserInput: true }
  }
}

async function fetchSudokuData(
  difficulty: GameDifficulty,
): Promise<SudokuAPIResponse> {
  const level = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3
  const res = await rp({
    url: 'http://www.cs.utep.edu/cheon/ws/sudoku/new/',
    qs: {
      level,
      size: 9,
    },
  })
  return JSON.parse(res)
}

async function generateBoard(size: number, difficulty: GameDifficulty) {
  try {
    const res = await fetchSudokuData(difficulty)
    const board: SudokuTile[][] = [...Array(size)].map(_x =>
      [...Array(size)].map(_y => ({
        value: null,
        isUserInput: false,
      })),
    )
    res.squares.forEach(({ x, y, value }) => {
      board[x][y].value = value
    })
    return board
  } catch (err) {
    console.log('Error fetching from sudoku api!')
    throw new Error(err)
  }
}

function drawSudokuASCII(
  board: SudokuTile[][] | null,
  userInput: [number, number],
): string {
  const [rowNumber, c] = userInput
  const r = String.fromCharCode(64 + rowNumber)
  const currentSelection = (rowNumber === null ? '?' : r) + (c || '?')
  let boardString = `\`\`\`Current selection: ${currentSelection}\n\n    1 2 3   4 5 6   7 8 9  \n  +-------+-------+-------+\nA |`
  for (let r = 0; r < SudokuGame.SIZE; r++) {
    for (let c = 0; c < SudokuGame.SIZE; c++) {
      const tile = board[r][c]
      boardString += ' '
      boardString += tile.value || ' '
      if (c % 3 === 2) {
        boardString += ' |'
      }
    }
    const nextRowLetter = String.fromCharCode(r + 66)
    if (r % 3 === 2) {
      boardString += `\n  +-------+-------+-------+\n${nextRowLetter} |`
    } else {
      boardString += `\n${nextRowLetter} |`
    }
  }
  boardString = boardString.slice(0, boardString.length - 4)
  boardString += '```'
  return boardString
}

function drawSudokuImage(board: SudokuTile[][], userInput: [number, number]) {
  const canvas = Canvas.createCanvas(300, 300)
  const ctx = canvas.getContext('2d')

  const [rowNumber, columnNumber] = userInput

  ctx.fillStyle = '#2C2F33'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const bottomMargin = 10

  const numOfColumns = board[0].length + 1
  const numOfRows = board.length + 1
  const width = canvas.width
  const height = canvas.height - bottomMargin
  const xMargin = (width - height) / 2
  const size = height / numOfRows
  const tileWidth = 18

  for (let r = 0; r < numOfRows; r++) {
    for (let c = 0; c < numOfColumns; c++) {
      const x = c * size + xMargin + (size - tileWidth) / 2 - 5
      const y = r * size + (size - tileWidth) / 2

      if (r > 0 && c > 0) {
        ctx.fillStyle =
          r === rowNumber && c === columnNumber
            ? '#ffffff'
            : (Math.floor((r - 1) / 3) + Math.floor((c - 1) / 3)) % 2 === 0
            ? r === rowNumber || c === columnNumber
              ? '#A2A6AD'
              : '#7289DA'
            : r === rowNumber || c === columnNumber
            ? '#696F79'
            : '#4e5d94'
        ctx.beginPath()
        Draw.roundRect(ctx, x, y, tileWidth, tileWidth, 5)
        ctx.fill()
        ctx.closePath()
      }

      const symbol =
        r === 0 && c === 0
          ? ' '
          : r === 0
          ? c
          : c === 0
          ? String.fromCharCode(r + 64)
          : board[r - 1][c - 1].value || ' '
      ctx.fillStyle =
        (r === rowNumber && c === columnNumber) ||
        (r !== 0 && c !== 0 && board[r - 1][c - 1].isUserInput)
          ? 'black'
          : 'white'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `bold ${0.75 * tileWidth}px Arial`
      ctx.fillText(
        symbol.toString(),
        x + tileWidth / 2 + (c === 0 ? 5 : 0),
        y + tileWidth / 2 + 1 + (r === 0 ? 5 : 0),
      )
    }
  }
  return canvas.toBuffer()
}
