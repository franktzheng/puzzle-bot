import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { GameHandler } from '../../core/game-handler'
import { getGameDifficultyFromNumber } from '../../core/game'

export default class NormalPuzzleCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'puzzle',
      group: 'games',
      memberName: 'puzzle',
      description: 'Play a puzzle game.',
      args: [
        {
          key: 'game',
          prompt: 'Please choose a game to play (maze, hangman, or sudoku).',
          type: 'string',
          validate: (text: string) =>
            ['maze', 'hangman', 'sudoku'].includes(text.toLowerCase()),
        },
        {
          key: 'difficulty',
          prompt: 'Please select a difficulty.',
          type: 'integer',
          default: 1,
          validate: (text: number) => text >= 1 && text <= 3,
        },
      ],
    })
  }

  run(
    message: CommandMessage,
    { game, difficulty }: { game: string; difficulty: number },
  ) {
    const gameName = game[0].toUpperCase() + game.slice(1).toLowerCase()
    return GameHandler.handleGameCreation(message, gameName, {
      isASCII: false,
      difficulty: getGameDifficultyFromNumber(difficulty),
    })
  }
}
