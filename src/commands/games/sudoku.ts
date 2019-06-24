import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'

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
    return message.say('This has not been implemented yet!')
  }
}
