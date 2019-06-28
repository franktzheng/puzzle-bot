import { RichEmbed, Attachment } from 'discord.js'
import moment from 'moment'

// Object to represent a game. Main functions are update() and
// generateEmbed(). generateEmbed() is called to create an embed to send
// to the user that reflects the current state of the game. update() is called
// to update the state of the game based on the emoji the user reacted with.

export interface GameStatus {
  status: 'win' | 'loss' | 'pending'
  prompt?: string
}

export abstract class Game {
  startTime = moment()
  constructor(public gameID: string) {}
  getElapsedTimeInMilliseconds(): number {
    return moment().diff(this.startTime)
  }

  abstract emojis: string[]
  abstract setup(): Promise<void>
  abstract async generateEmbed(): Promise<any>
  abstract update(emoji: string): void
  abstract getStatus(): GameStatus
}
