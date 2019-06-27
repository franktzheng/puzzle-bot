import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { GameHandler } from '../../game-handler'

export default class SudokuCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'hangman',
      group: 'games',
      memberName: 'hangman',
      description: 'Play a game of Hangman.',
      args: [
        {
          key: 'difficulty',
          prompt: 'Please specify a difficulty.',
          type: 'integer',
          default: 1,
        },
        {
          key: 'mode',
          prompt: 'Please select a mode (ascii or image).',
          type: 'string',
          default: 'image',
        },
      ],
    })
  }

  run(
    message: CommandMessage,
    { difficulty, mode }: { difficulty: number; mode: string },
  ) {
    const ascii = mode === 'ascii'
    return GameHandler.handleGameCreation(message, 'Hangman', {
      difficulty,
      ascii,
    })
  }
}
