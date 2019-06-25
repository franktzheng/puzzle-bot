import { RichEmbed } from 'discord.js'

export abstract class Game {
  abstract emojis: string[]
  abstract startTime: number
  abstract setup(): Promise<void>
  abstract generateEmbed(): RichEmbed
  abstract update(emoji: string): void
  abstract getStatus(): 'win' | 'loss' | 'pending'
  constructor(public gameID: string) {}
}
