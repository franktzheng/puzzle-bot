import { CommandMessage } from 'discord.js-commando'
import { Message, MessageReaction } from 'discord.js'

import { StateManager } from './state-manager'
import { getFirstFromPotentialArray } from './helpers'

// This class is just here to organize these functions
export class GameHandler {
  // This creates a new game. Hopefully the code is somewhat self-explanatory.
  // See StateManager if it doesn't make sense.
  static async handleGameCreation(
    message: CommandMessage,
    gameName: string,
  ): Promise<Message> {
    const guildID = message.guild.id
    const gameInstance = StateManager.createGameInstance(guildID, gameName)
    await gameInstance.setup()
    const embed = gameInstance.generateEmbed()
    const sentMessage = getFirstFromPotentialArray(await message.say(embed))
    // React to the message with starting emojis
    await this.reactToMessage(sentMessage, gameInstance.emojis)
    return sentMessage
  }

  // Same as above function
  static async handleGameUpdate(messageReaction: MessageReaction) {
    const { message, emoji } = messageReaction
    const guildID = message.guild.id
    const gameID = this.parseGameID(message)
    const gameInstance = StateManager.getGameInstance(guildID, gameID)
    gameInstance.update(emoji.name)
    const embed = gameInstance.generateEmbed()
    message.edit(embed)
    const status = gameInstance.getStatus()
    if (status === 'win') {
      message.channel.send('Congratulations, you win!')
      StateManager.removeGameInstance(guildID, gameID)
    } else if (status === 'loss') {
      message.channel.send('Sorry, you lose!')
      StateManager.removeGameInstance(guildID, gameID)
    } else {
    }
  }

  static parseGameID({ embeds }: Message): string {
    if (!embeds[0]) {
      throw new Error('parseGameName(): message is missing embeds!')
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
