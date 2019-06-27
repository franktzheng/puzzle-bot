import { RichEmbed, Attachment } from 'discord.js'

// Object to represent a game. Main functions are update() and
// generateEmbed(). generateEmbed() is called to create an embed to send
// to the user that reflects the current state of the game. update() is called
// to update the state of the game based on the emoji the user reacted with.

export interface GameStatus {
  status: 'win' | 'loss' | 'pending'
  prompt?: string
}

export abstract class Game {
  startTime = Date.now()
  constructor(public gameID: string) {}

  abstract emojis: string[]
  abstract setup(): Promise<void>
  abstract async generateEmbed(): Promise<any>
  abstract update(emoji: string): void
  abstract getStatus(): GameStatus
}
