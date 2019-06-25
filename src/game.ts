import { RichEmbed } from 'discord.js'

export abstract class Game {
  abstract emojis: string[]
  abstract startTime: number
  abstract generateEmbed(): RichEmbed
  abstract update(emoji: string): void
  constructor(public gameID: string) {}
}
