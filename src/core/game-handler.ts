import { CommandMessage } from 'discord.js-commando'
import { Message, MessageReaction, RichEmbed, TextChannel } from 'discord.js'
import moment from 'moment'

import { StateManager } from './state-manager'
import { getFirstFromPotentialArray } from '../utils/helpers'
import { Game } from './game'
import { Mongo } from './mongo'
import { PuzzleLabel } from './puzzle-label'

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
    const gameInstance = await StateManager.createGameInstance(
      guildID,
      gameName,
      args,
    )
    const loadingEmbed = createLoadingEmbed(gameName)
    const sentMessage = getFirstFromPotentialArray(
      await message.say(loadingEmbed),
    )
    await gameInstance.setup()
    const embed = await gameInstance.generateEmbed()
    // React to the message with starting emojis
    await reactToMessage(sentMessage, gameInstance.emojis)
    sentMessage.edit(embed)
    return sentMessage
  }

  // Same as above function but for reaction updates
  static async handleGameUpdate(messageReaction: MessageReaction) {
    const { message, emoji } = messageReaction
    const guildID = message.guild.id

    const [gameType, gameID] = parseGameTypeAndID(message)
    if (gameType === null) {
      // game is loading
      return
    }
    const gameInstance = StateManager.getGameInstance(guildID, gameID)
    if (!gameInstance) {
      // game no longer exists
      return
    }
    gameInstance.update(emoji.name)
    const embed = await gameInstance.generateEmbed()
    message.edit(embed)
    const { status, prompt } = gameInstance.getStatus()
    if (status === 'win') {
      const elapsedTime = gameInstance.getElapsedTimeInMilliseconds()
      const timeString = formatElapsedTime(elapsedTime)
      await Mongo.addCompletionTime(guildID, gameType, elapsedTime)
      await this.sendGameCompletionPrompt(
        message,
        prompt || `Congratulations, you win! You finished in ${timeString}.`,
      )
      StateManager.removeGameInstance(guildID, gameID)
    } else if (status === 'loss') {
      await this.sendGameCompletionPrompt(message, prompt || 'Sorry, you lose!')
      StateManager.removeGameInstance(guildID, gameID)
    }
  }

  static async sendGameCompletionPrompt(message: Message, prompt: string) {
    await message.edit({
      content: '',
      embed: { title: message.embeds[0].title, description: prompt },
    })
  }
}

function formatElapsedTime(elapsedTimeInMilliseconds: number): string {
  const showTimeInSeconds = elapsedTimeInMilliseconds < 60 * 1000
  const timeString =
    moment
      .utc(elapsedTimeInMilliseconds)
      .format(showTimeInSeconds ? 's.SS' : 'm:ss') +
    ' ' +
    (showTimeInSeconds ? 'seconds' : 'minutes')
  return timeString
}

function createLoadingEmbed(gameName: string) {
  const embed = new RichEmbed({
    title: PuzzleLabel.createLoading(gameName),
    description: 'Please be patient while we load your game!',
  })
  return embed
}

function parseGameTypeAndID({ embeds }: Message): [string, string] {
  if (!embeds[0]) {
    throw new Error('parseGameName(): message is missing embeds!')
  }
  return PuzzleLabel.parseGameTypeAndID(embeds[0].title)
}

async function reactToMessage(message: Message, emojis: string[]) {
  for (const emoji of emojis) {
    await message.react(emoji)
  }
}
