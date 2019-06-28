import { RichEmbed, Attachment } from 'discord.js'
import moment from 'moment'
import { GameTitle } from './game-title'

// Object to represent a game. Main functions are update() and
// generateEmbed(). generateEmbed() is called to create an embed to send
// to the user that reflects the current state of the game. update() is called
// to update the state of the game based on the emoji the user reacted with.

export interface GameStatus {
  status: 'win' | 'loss' | 'pending'
  prompt?: string
}

export type GameDifficulty = 'easy' | 'medium' | 'hard'

export interface GameData {
  gameName: string
  difficulty: GameDifficulty
  gameID: string
  isASCII: boolean
}

export abstract class Game {
  startTime = moment()
  difficulty: GameDifficulty
  isASCII: boolean

  constructor(
    public gameID: string,
    {
      difficulty = 'easy',
      isASCII = false,
    }: { difficulty: GameDifficulty; isASCII: boolean },
  ) {
    this.difficulty = difficulty
    this.isASCII = isASCII
  }

  getElapsedTimeInMilliseconds(): number {
    return moment().diff(this.startTime)
  }

  createGameTitle(): string {
    return GameTitle.create({
      gameName: this.name,
      difficulty: this.difficulty,
      gameID: this.gameID,
      isASCII: this.isASCII,
    })
  }

  abstract name: string
  abstract emojis: string[]
  abstract setup(): Promise<void>
  abstract async generateEmbed(): Promise<any>
  abstract update(emoji: string): void
  abstract getStatus(): GameStatus
}

export function getGameDifficultyFromNumber(difficultyNumber: number) {
  if (difficultyNumber === 1) {
    return 'easy'
  } else if (difficultyNumber === 2) {
    return 'medium'
  } else if (difficultyNumber === 3) {
    return 'hard'
  }
  throw new Error(
    `getGameDifficultyFromNumber(): Invalid difficulty ${difficultyNumber}`,
  )
}
