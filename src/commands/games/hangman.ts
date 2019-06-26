import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { GameHandler } from '../../game-handler'

export default class SudokuCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'hangman',
      group: 'games',
      memberName: 'hangman',
      description: 'Play a game of Hangman.',
    })
  }

  run(message: CommandMessage) {
    return GameHandler.handleGameCreation(message, 'Hangman')
  }
}
