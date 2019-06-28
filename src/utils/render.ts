import Canvas from 'canvas'
import { Draw } from './draw'
import { HangmanLetter } from '../games'

export class Render {
  static hangman(
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
      ctx.fillText(
        letter || ' ',
        x + letterWidth / 2,
        y + (4 * letterWidth) / 10,
      )
    })
    return canvas.toBuffer()
  }
}
