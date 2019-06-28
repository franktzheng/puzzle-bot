import { RichEmbed } from 'discord.js'
import _ from 'lodash'
import fs from 'fs'
import Canvas from 'canvas'

import { Game, GameStatus } from '../game'
import HANGMAN_WORDS from '../data/hangman-words.json'
import { chunkArray } from '../utils/helpers'
import { Draw } from '../utils/draw'

const HANGMAN_EMOJIS = ['⬅', '⬆', '⬇', '➡', '✅']

export interface HangmanLetter {
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
  prevFileName: string = null
  ascii: boolean = false

  difficulty: number

  constructor(
    gameID: string,
    { difficulty, ascii }: { difficulty: number; ascii: boolean },
  ) {
    super(gameID)
    this.difficulty = difficulty
    this.ascii = ascii
  }

  async setup() {
    this.word = getWord(this.difficulty).split('')
    this.guessedWord = [...Array(this.word.length)].map(() => null)
    this.letterTable = generateLetterTable()
  }

  async generateEmbed(): Promise<RichEmbed> {
    if (!this.ascii) {
      const buffer = drawHangmanImage(
        _.flatten(this.letterTable),
        this.guessedWord,
        this.numOfWrongAnswers,
        this.selection,
      )
      const fileName = `hangman_${this.gameID}_${Math.floor(
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
        title: `Puzzle - Hangman - ${this.gameID}`,
        description:
          'Try to guess the unknown word.\n\nTo play an ASCII version:```?puzzle hangman <difficulty> ascii```',
        image: { url: `${process.env.BASE_URL}/game-images/${fileName}` },
      })
    }

    const asciiArt = drawHangmanASCII(
      this.letterTable,
      this.selection,
      this.numOfWrongAnswers,
      this.guessedWord,
    )
    return new RichEmbed({
      title: `Puzzle - Hangman - ${this.gameID}`,
      description: asciiArt,
    })
  }

  getStatus(): GameStatus {
    if (this.numOfWrongAnswers > 5) {
      this.prevFileName &&
        fs.unlinkSync(`./public/game-images/${this.prevFileName}`)
      return {
        status: 'loss',
        prompt: `Sorry, you lose! The word was "${this.word.join('')}".`,
      }
    } else if (this.word.join('') === this.guessedWord.join('')) {
      this.prevFileName &&
        fs.unlinkSync(`./public/game-images/${this.prevFileName}`)
      return { status: 'win' }
    }
    return { status: 'pending' }
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
}

function getWord(difficulty: number): string {
  let wordList: string[]
  switch (difficulty) {
    case 1:
      wordList = HANGMAN_WORDS.easy
      break
    case 2:
      wordList = HANGMAN_WORDS.medium
      break

    case 3:
      wordList = HANGMAN_WORDS.hard
      break
    default:
      throw new Error('getWord(): invalid hangman difficulty!')
  }
  const word = wordList[Math.floor(Math.random() * wordList.length)]
  return word
}

function generateLetterTable(): HangmanLetter[][] {
  const letters = [...Array(26)]
    .map((_value, index) => String.fromCharCode(index + 65))
    .map(letter => ({ value: letter, isUsed: false }))
  const letterTable = chunkArray(letters, HangmanGame.ROW_SIZE)
  return letterTable
}

function drawHangmanASCII(
  letterTable: HangmanLetter[][],
  selection: [number, number],
  numOfWrongAnswers: number,
  guessedWord: string[],
): string {
  let letterTableString = '|'
  for (let r = 0; r < letterTable.length; r++) {
    for (let c = 0; c < letterTable[r].length; c++) {
      const letter = letterTable[r][c].isUsed ? '-' : letterTable[r][c].value
      if (r === selection[0] && c === selection[1]) {
        letterTableString += `-${letter}-|`
      } else {
        letterTableString += ` ${letter} |`
      }
    }
    letterTableString += '\n|'
  }
  letterTableString = letterTableString.slice(0, letterTableString.length - 2)
  const hangmanString = `
     _________
    |         |
    |         ${numOfWrongAnswers > 0 ? 'O' : ' '}
    |        ${numOfWrongAnswers > 2 ? '/' : ' '}${
    numOfWrongAnswers > 1 ? '|' : ' '
  }${numOfWrongAnswers > 3 ? '\\' : ' '}
    |        ${numOfWrongAnswers > 4 ? '/' : ' '} ${
    numOfWrongAnswers > 5 ? '\\' : ' '
  }
    |
    |
____|____________`
  const guessedWordString = guessedWord
    .map(letter => (letter ? ` ${letter} ` : '___'))
    .join(' ')
  return `\`\`\`\n${letterTableString}${hangmanString}\n\n${guessedWordString}\`\`\``
}

function drawHangmanImage(
  letters: HangmanLetter[],
  guessedLetters: string[],
  numOfWrongAnswers: number,
  selection: [number, number],
) {
  const canvas = Canvas.createCanvas(300, 300)
  const ctx = canvas.getContext('2d')

  // ALPHABET

  ctx.fillStyle = '#2C2F33'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const tileWidth = 25
  const tileMargin = 5
  const tableMargin = 15
  const numOfColumns = 5

  for (let r = 0; r < letters.length / numOfColumns; r++) {
    for (
      let c = 0;
      c < Math.min(letters.length - r * numOfColumns, numOfColumns);
      c++
    ) {
      const letter = letters[r * numOfColumns + c]

      const x = c * (tileWidth + tileMargin) + tableMargin
      const y = r * (tileWidth + tileMargin) + tableMargin

      ctx.beginPath()
      Draw.roundRect(ctx, x, y, tileWidth, tileWidth, tileWidth / 3)
      ctx.fillStyle =
        selection[0] === r && selection[1] === c
          ? letter.isUsed
            ? '#4f545c'
            : '#4e5d94'
          : letter.isUsed
          ? '#99AAB5'
          : '#7289DA'
      ctx.fill()
      ctx.closePath()

      // letter
      ctx.fillStyle = 'white'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `bold ${0.5 * tileWidth}px Arial`
      ctx.fillText(letter.value, x + tileWidth / 2, y + tileWidth / 2)
    }
  }

  // GALLOW

  const gallowThickness = 5

  ctx.fillStyle = '#202225'
  // left vertical
  ctx.fillRect(200, 25, gallowThickness, 160)
  // bottom horizontal
  ctx.fillRect(180, 185, 45, gallowThickness)
  // right vertical
  ctx.fillRect(255, 25, gallowThickness, 30)
  // top horizontal
  ctx.fillRect(200, 25, 60, gallowThickness)

  // PERSON

  const bodyMargin = 5
  const bodyThickness = 1
  const headRadius = 12
  const bodyX = 255 + gallowThickness / 2

  if (numOfWrongAnswers > 0) {
    ctx.fillStyle = '#99AAB5'
    ctx.strokeStyle = '#99AAB5'
    ctx.lineWidth = bodyThickness
    ctx.beginPath()
    ctx.arc(bodyX, headRadius + 55 + bodyMargin, headRadius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()
  }

  if (numOfWrongAnswers > 1) {
    ctx.beginPath()
    ctx.lineTo(bodyX, 2 * headRadius + 55)
    ctx.lineTo(bodyX, 2 * headRadius + 55 + 30)
    ctx.stroke()
    ctx.closePath()
  }

  if (numOfWrongAnswers > 5) {
    ctx.beginPath()
    ctx.lineTo(bodyX, 2 * headRadius + 55 + 30)
    ctx.lineTo(bodyX + 10, 2 * headRadius + 55 + 30 + 30)
    ctx.stroke()
    ctx.closePath()
  }

  if (numOfWrongAnswers > 4) {
    ctx.beginPath()
    ctx.lineTo(bodyX, 2 * headRadius + 55 + 30)
    ctx.lineTo(bodyX - 10, 2 * headRadius + 55 + 30 + 30)
    ctx.stroke()
    ctx.closePath()
  }

  if (numOfWrongAnswers > 3) {
    ctx.beginPath()
    ctx.lineTo(bodyX, 2 * headRadius + 55 + 10)
    ctx.lineTo(bodyX + 10, 2 * headRadius + 55 + 30)
    ctx.stroke()
    ctx.closePath()
  }

  if (numOfWrongAnswers > 2) {
    ctx.beginPath()
    ctx.lineTo(bodyX, 2 * headRadius + 55 + 10)
    ctx.lineTo(bodyX - 10, 2 * headRadius + 55 + 30)
    ctx.stroke()
    ctx.closePath()
  }

  // GUESSED WORD
  ctx.fillStyle = '#202225'
  ctx.fillRect(0, 210, canvas.width, canvas.height - 210)

  const guessedLettersMargin = 15
  const widthAvailable = canvas.width - guessedLettersMargin * 2
  const letterWidth = widthAvailable / (1.25 * guessedLetters.length - 0.25)
  const letterMargin = 0.25 * letterWidth
  ctx.fillStyle = '#99AAB5'
  guessedLetters.forEach((letter, index) => {
    const x = index * (letterWidth + letterMargin) + guessedLettersMargin
    const y = 210 + (canvas.height - 210) / 2
    ctx.fillRect(x, y + letterWidth / 2, letterWidth, 4)

    // letter
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.font = `bold ${0.9 * letterWidth}px Arial`
    ctx.fillText(letter || ' ', x + letterWidth / 2, y + (4 * letterWidth) / 10)
  })
  return canvas.toBuffer()
}
