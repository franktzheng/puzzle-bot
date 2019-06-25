import { CommandMessage } from 'discord.js-commando'
import { Message, MessageReaction } from 'discord.js'

import { StateManager } from './state-manager'
import { getFirstFromPotentialArray } from './helpers'

export class GameHandler {
  static async handleGameCreation(
    message: CommandMessage,
    gameName: string,
  ): Promise<Message> {
    const guildID = message.guild.id
    const gameInstance = StateManager.createGameInstance(guildID, gameName)
    const embed = gameInstance.generateEmbed()
    const sentMessage = getFirstFromPotentialArray(await message.say(embed))
    await this.reactToMessage(sentMessage, gameInstance.emojis)
    return sentMessage
  }

  static async handleGameUpdate(messageReaction: MessageReaction) {
    const { message, emoji } = messageReaction
    const guildID = message.guild.id
    const gameID = this.parseGameID(message)
    const gameInstance = StateManager.getGameInstance(guildID, gameID)
    gameInstance.update(emoji.name)
    const embed = gameInstance.generateEmbed()
    return message.edit(embed)
  }

  static parseGameID({ embeds }: Message): string {
    if (!embeds[0]) {
      throw new Error('parseGameName(): message is missing embeds!')
    }
    const gameIDRegex = /Puzzle - (?:.*) - ([0-9]{8})/i
    const gameID = embeds[0].title.match(gameIDRegex)[2]
    return gameID
  }

  static async reactToMessage(message: Message, emojis: string[]) {
    for (const emoji of emojis) {
      await message.react(emoji)
    }
  }
}
