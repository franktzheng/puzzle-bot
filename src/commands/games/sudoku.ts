import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { GameHandler } from '../../game-handler'

export default class SudokuCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'sudoku',
      group: 'games',
      memberName: 'sudoku',
      description: 'Play a game of Sudoku.',
    })
  }

  run(message: CommandMessage) {
    return GameHandler.handleGameCreation(message, 'Sudoku')
  }
}
