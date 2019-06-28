import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { GameHandler } from '../../core/game-handler'
import { getGameDifficultyFromNumber } from '../../core/game'

export default class SudokuCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'sudoku',
      group: 'games',
      memberName: 'sudoku',
      description: 'Play a game of Sudoku.',
      args: [
        {
          key: 'difficulty',
          prompt: 'Please specify a difficulty.',
          type: 'integer',
          default: 1,
        },
      ],
    })
  }

  run(message: CommandMessage, { difficulty }: { difficulty: number }) {
    return GameHandler.handleGameCreation(message, 'Sudoku', {
      difficulty: getGameDifficultyFromNumber(difficulty),
    })
  }
}
