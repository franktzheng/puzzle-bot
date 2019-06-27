import { CommandMessage } from 'discord.js-commando'
import { Message, MessageReaction, RichEmbed } from 'discord.js'

import { StateManager } from './state-manager'
import { getFirstFromPotentialArray } from './helpers'

// This class is just here to organize these functions
export class GameHandler {
  // This creates a new game. Hopefully the code is somewhat self-explanatory.
  // See StateManager if it doesn't make sense.
  static async handleGameCreation(
    message: CommandMessage,
    gameName: string,
    args: any = {},
  ): Promise<Message> {
    const guildID = message.guild.id
    const gameInstance = StateManager.createGameInstance(
      guildID,
      gameName,
      args,
    )
    const loadingEmbed = this.createLoadingEmbed(gameName)
    const sentMessage = getFirstFromPotentialArray(
      await message.say(loadingEmbed),
    )
    await gameInstance.setup()
    const gameEmbed = gameInstance.generateEmbed()
    // React to the message with starting emojis
    await this.reactToMessage(sentMessage, gameInstance.emojis)
    sentMessage.edit(gameEmbed)
    return sentMessage
  }

  // Same as above function but for reaction updates
  static async handleGameUpdate(messageReaction: MessageReaction) {
    const { message, emoji } = messageReaction
    const guildID = message.guild.id
    const gameID = this.parseGameID(message)
    const gameInstance = StateManager.getGameInstance(guildID, gameID)
    if (!gameInstance) {
      // game no longer exists
      return
    }
    gameInstance.update(emoji.name)
    const embed = gameInstance.generateEmbed()
    message.edit(embed)
    const { status, prompt } = gameInstance.getStatus()
    if (status === 'win') {
      message.channel.send(prompt || 'Congratulations, you win!')
      StateManager.removeGameInstance(guildID, gameID)
    } else if (status === 'loss') {
      message.channel.send(prompt || 'Sorry, you lose!')
      StateManager.removeGameInstance(guildID, gameID)
    }
  }

  static createLoadingEmbed(gameName: string) {
    const embed = new RichEmbed({
      title: `Puzzle - ${gameName} - Loading...`,
      description: 'Please be patient while we load your game!',
    })
    return embed
  }

  static parseGameID({ embeds }: Message): string {
    if (!embeds[0]) {
      throw new Error('parseGameName(): message is missing embeds!')
    } else if (embeds[0].title.includes('Loading')) {
      return null
    }
    const gameIDRegex = /Puzzle - (?:.*) - ([0-9]{8})/i
    const gameID = embeds[0].title.match(gameIDRegex)[1]
    if (!gameID) {
      throw new Error(
        `parseGameName(): no game ID found in title "${embeds[0].title}"`,
      )
    }
    return gameID
  }

  static async reactToMessage(message: Message, emojis: string[]) {
    for (const emoji of emojis) {
      await message.react(emoji)
    }
  }
}
