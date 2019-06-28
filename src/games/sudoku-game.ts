import { RichEmbed } from 'discord.js'
import rp from 'request-promise'

import { Game, GameStatus, GameDifficulty } from '../core/game'
import { GameTitle } from '../core/game-title'

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

const SUDOKU_EMOJI_MAP: { [emoji: string]: number } = {
  '🇦': 1,
  '🇧': 2,
  '🇨': 3,
  '🇩': 4,
  '🇪': 5,
  '🇫': 6,
  '🇬': 7,
  '🇭': 8,
  '🇮': 9,
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
  userInput: [number, number, number] = [null, null, null]
  inputIndex = 0

  async setup() {
    this.board = await generateBoard(SudokuGame.SIZE, this.difficulty)
  }

  // generate image based on current tile and board state
  async generateEmbed(): Promise<RichEmbed> {
    const title = this.createGameTitle()
    const boardString = drawSudokuASCII(this.userInput, this.board)
    return new RichEmbed({
      title,
      description: boardString,
    })
  }

  update(emoji: string) {
    if (this.emojis.includes(emoji)) {
      if (emoji === '❌') {
        this.inputIndex > 0 && this.inputIndex--
        this.userInput[this.inputIndex] = null
      } else {
        const value = SUDOKU_EMOJI_MAP[emoji]
        this.userInput[this.inputIndex] = value
        if (this.inputIndex === 2) {
          const [c, r, value] = this.userInput
          this.insertValue([c - 1, r - 1], value)
          this.userInput = [null, null, null]
        }
        // if input index is 2, reset it to 0
        this.inputIndex = (this.inputIndex + 1) % 3
      }
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
  userInput: [number, number, number],
  board: SudokuTile[][] | null,
): string {
  const [rowNumber, c] = userInput
  const r = String.fromCharCode(64 + rowNumber)
  const currentSelection = (rowNumber === null ? '?' : r) + ' ' + (c || '?')
  let boardString = `Current selection: ${currentSelection}\n\n\`\`\` ___________________________________\n|`
  for (let r = 0; r < SudokuGame.SIZE; r++) {
    for (let c = 0; c < SudokuGame.SIZE; c++) {
      const tile = board[r][c]
      boardString += ' '
      boardString += tile.value || ' '
      boardString += ' |'
    }
    boardString += '\n|___|___|___|___|___|___|___|___|___|\n|'
  }
  boardString = boardString.slice(0, boardString.length - 1)
  boardString += '```'
  return boardString
}
