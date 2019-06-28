import { CommandMessage } from 'discord.js-commando'
import { Message, MessageReaction, RichEmbed, TextChannel } from 'discord.js'
import moment from 'moment'
import signale from 'signale'

import { StateManager } from './state-manager'
import { getFirstFromPotentialArray } from '../utils/helpers'
import { Game } from './game'
import { Database } from './database'
import { GameTitle } from './game-title'

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
    signale.star(`New ${gameName} game being created in guild ${guildID}`)

    try {
      const gameInstance = await StateManager.createGameInstance(
        guildID,
        gameName,
        args,
      )

      const loadingEmbed = createLoadingEmbed(gameName, gameInstance)
      const sentMessage = getFirstFromPotentialArray(
        await message.say(loadingEmbed),
      )

      await gameInstance.setup()
      const embed = await gameInstance.generateEmbed()
      await reactToMessage(sentMessage, gameInstance.emojis)
      sentMessage.edit(embed)
      signale.success(`${gameName} game successfully created!`)
      return sentMessage
    } catch (err) {
      signale.error(`Error creating ${gameName} game!`)
      signale.error(err)
      throw new Error(err)
    }
  }

  // Same as above function but for reaction updates
  static async handleGameUpdate(messageReaction: MessageReaction) {
    const { message, emoji } = messageReaction
    const guildID = message.guild.id
    const gameData = GameTitle.parse(message.embeds[0].title)
    const { gameName, gameID, difficulty, isASCII } = gameData
    const gameInstance = StateManager.getGameInstance(guildID, gameID)

    if (gameInstance) {
      gameInstance.update(emoji.name)
      const embed = await gameInstance.generateEmbed()
      message.edit(embed)

      const { status, prompt } = gameInstance.getStatus()
      if (status === 'win') {
        const elapsedTime = gameInstance.getElapsedTimeInMilliseconds()
        const timeString = formatElapsedTime(elapsedTime)
        await Database.addCompletionTime(guildID, gameData, elapsedTime)
        await this.sendGameCompletionPrompt(
          message,
          prompt || `Congratulations, you win! You finished in ${timeString}.`,
        )
        StateManager.removeGameInstance(guildID, gameID)
      } else if (status === 'loss') {
        await this.sendGameCompletionPrompt(
          message,
          prompt || 'Sorry, you lose!',
        )
        StateManager.removeGameInstance(guildID, gameID)
      }
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

function createLoadingEmbed(gameName: string, gameInstance: Game) {
  return new RichEmbed({
    title: GameTitle.create({
      gameName,
      difficulty: gameInstance.difficulty,
      gameID: gameInstance.gameID,
      isASCII: gameInstance.isASCII,
    }),
    description: 'Please be patient while we load your game.',
  })
}

async function reactToMessage(message: Message, emojis: string[]) {
  for (const emoji of emojis) {
    await message.react(emoji)
  }
}
