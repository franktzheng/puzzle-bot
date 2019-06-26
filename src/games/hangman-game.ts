import { Game } from '../game'

import randomWords from 'random-words'
import { RichEmbed } from 'discord.js'
import { chunkArray } from '../helpers'

const HANGMAN_EMOJIS = ['⬅', '⬆', '⬇', '➡', '✅']

interface HangmanLetter {
  value: string
  isUsed: boolean
}

export class HangmanGame extends Game {
  static readonly ROW_SIZE = 5

  emojis = HANGMAN_EMOJIS

  word: string[] = []
  guessedWord: string[] = []
  numOfWrongAnswers = 0
  letterTable: HangmanLetter[][] = []
  selection: [number, number] = [0, 0]

  constructor(gameID: string) {
    super(gameID)
  }

  async setup() {
    this.word = randomWords().split('')
    this.guessedWord = [...Array(this.word.length)].map(() => null)
    this.letterTable = this.generateLetterTable()
  }

  generateEmbed(): RichEmbed {
    let letterTable = '|'
    for (let r = 0; r < this.letterTable.length; r++) {
      for (let c = 0; c < this.letterTable[r].length; c++) {
        const letter = this.letterTable[r][c].isUsed
          ? '-'
          : this.letterTable[r][c].value
        if (r === this.selection[0] && c === this.selection[1]) {
          letterTable += `-${letter}-|`
        } else {
          letterTable += ` ${letter} |`
        }
      }
      letterTable += '\n|'
    }
    letterTable = letterTable.slice(0, letterTable.length - 2)

    const picture = `
     _________
    |         |
    |         ${this.numOfWrongAnswers > 0 ? 'O' : ' '}
    |        ${this.numOfWrongAnswers > 2 ? '/' : ' '}${
      this.numOfWrongAnswers > 1 ? '|' : ' '
    }${this.numOfWrongAnswers > 3 ? '\\' : ' '}
    |        ${this.numOfWrongAnswers > 4 ? '/' : ' '} ${
      this.numOfWrongAnswers > 5 ? '\\' : ' '
    }
    |
    |
____|___________`

    const guessedWord = this.guessedWord
      .map(letter => (letter ? ` ${letter} ` : '___'))
      .join(' ')

    const asciiArt = `\`\`\`\n${letterTable}${picture}\n\n${guessedWord}\`\`\``

    return new RichEmbed({
      title: `Puzzle - Hangman - ${this.gameID}`,
      description: asciiArt,
    })
  }

  getStatus() {
    if (this.numOfWrongAnswers > 5) {
      return 'loss'
    } else if (this.word.join('') === this.guessedWord.join('')) {
      return 'win'
    }
    return 'pending'
  }

  update(emoji: string) {
    const [r, c] = this.selection
    const rowSize = this.letterTable[r].length
    const columnSize = this.letterTable[this.letterTable.length - 1][c]
      ? this.letterTable.length
      : this.letterTable.length - 1
    switch (emoji) {
      case '⬅':
        this.selection[1] = (c + rowSize - 1) % rowSize
        break
      case '⬆':
        this.selection[0] = (r + columnSize - 1) % columnSize
        break
      case '⬇':
        this.selection[0] = (r + 1) % columnSize
        break
      case '➡':
        this.selection[1] = (c + 1) % rowSize
        break
      case '✅':
        this.selectLetter(this.selection)
        break
    }
  }

  selectLetter([r, c]: [number, number]) {
    const selectedLetter = this.letterTable[r][c]

    if (!this.letterTable[r][c]) {
      throw new Error(`selectLetter(): invalid coordinates (${r}, ${c})`)
    } else if (selectedLetter.isUsed) {
      return
    }

    const selectedLetterValue = selectedLetter.value.toLowerCase()

    if (this.word.includes(selectedLetterValue)) {
      this.word.map((letter, index) => {
        if (letter === selectedLetterValue) {
          this.guessedWord[index] = letter
        }
      })
    } else {
      this.numOfWrongAnswers++
    }
    selectedLetter.isUsed = true
  }

  generateLetterTable(): HangmanLetter[][] {
    const letters = [...Array(26)]
      .map((_value, index) => String.fromCharCode(index + 65))
      .map(letter => ({ value: letter, isUsed: false }))
    const letterTable = chunkArray(letters, HangmanGame.ROW_SIZE)
    return letterTable
  }
}
