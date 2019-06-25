import { RichEmbed } from 'discord.js'

import { Game } from '../game'

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

export interface SudokuTile {
  value: number
  isUserInput: boolean
}

export class SudokuGame extends Game {
  static readonly SIZE = 9

  emojis = SUDOKU_EMOJIS
  startTime = Date.now()

  board = SudokuGame.generateBoard(SudokuGame.SIZE)
  userInput: [number, number, number] = [null, null, null]
  inputIndex = 0

  constructor(gameID: string) {
    super(gameID)
  }

  // generate image based on current tile and board state
  generateEmbed(): RichEmbed {
    let boardString = `${this.userInput.toString()}\n\`\`\``
    for (let r = 0; r < SudokuGame.SIZE; r++) {
      for (let c = 0; c < SudokuGame.SIZE; c++) {
        const tile = this.board[0][0]
        boardString += tile.value || ' '
      }
      boardString += '\n'
    }
    boardString += '```'
    return new RichEmbed({
      title: `Sudoku - ${this.gameID}`,
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
          this.insertValue([c, r], value)
          this.userInput = [null, null, null]
        }
        // if input index is 2, reset it to 0
        this.inputIndex = (this.inputIndex + 1) % 3
      }
    }
  }

  insertValue([r, c]: [number, number], value: number | null) {
    this.board[r][c] = { value, isUserInput: true }
  }

  static generateBoard(size: number): SudokuTile[][] {
    // TODO
    // currently generates 9x9 array of { isBlank: true }
    const board: SudokuTile[][] = [...Array(size)].map(_x =>
      [...Array(size)].map(_y => ({
        value: 9,
        isUserInput: false,
      })),
    )
    return board
  }
}
