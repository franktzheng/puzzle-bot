import { CommandMessage } from 'discord.js-commando'
import { Message, MessageReaction, RichEmbed, TextChannel } from 'discord.js'
import moment from 'moment'

import { StateManager } from './state-manager'
import { getFirstFromPotentialArray } from '../utils/helpers'
import { Game } from './game'
import { Mongo } from './mongo'

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

    const [gameName, gameID] = parseGameNameAndID(message)
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
      await Mongo.addCompletionTime(guildID, gameName, elapsedTime)
      await message.channel.send(
        prompt || `Congratulations, you win! You finished in ${timeString}`,
      )
      StateManager.removeGameInstance(guildID, gameID)
    } else if (status === 'loss') {
      message.channel.send(prompt || 'Sorry, you lose!')
      StateManager.removeGameInstance(guildID, gameID)
    }
  }

  static async handleGameWin(gameInstance: Game, channel: TextChannel) {
    const elapsedTime = gameInstance.getElapsedTimeInMilliseconds()
    const showTimeInSeconds = elapsedTime < 60 * 1000
    const timeString =
      moment.utc(elapsedTime).format(showTimeInSeconds ? 's.SSS' : 'm:ss') +
      ' ' +
      showTimeInSeconds
        ? 'seconds'
        : 'minutes'
    await channel.send(
      prompt || `Congratulations, you win! You finished in ${timeString}`,
    )
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
    title: `Puzzle - ${gameName} - Loading...`,
    description: 'Please be patient while we load your game!',
  })
  return embed
}

function parseGameNameAndID({ embeds }: Message): [string, string] {
  if (!embeds[0]) {
    throw new Error('parseGameName(): message is missing embeds!')
  } else if (embeds[0].title.includes('Loading')) {
    return null
  }
  const gameIDRegex = /Puzzle - (.*) - ([0-9]{8})/i
  const [, gameName, gameID] = embeds[0].title.match(gameIDRegex)
  if (!gameID || !gameName) {
    throw new Error(
      `parseGameName(): no game ID or name found in title "${embeds[0].title}"`,
    )
  }
  return [gameName, gameID]
}

async function reactToMessage(message: Message, emojis: string[]) {
  for (const emoji of emojis) {
    await message.react(emoji)
  }
}
