import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { RichEmbed } from 'discord.js'

import { Database } from '../../core/database'
import { IGameLeaderboard, IGuild } from '../../models/guild'

export default class LeaderboardCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'help',
      group: 'other',
      memberName: 'help',
      description: 'Displays a list of commands and games!',
    })
  }

  // It's hardcoded since I'm running out of time!
  async run(message: CommandMessage) {
    const guild = await Database.getGuild(message.guild.id)
    return message.say(
      new RichEmbed({
        title: `❓ Puzzle Bot Help ❔`,
        description:
          'Arguments are surrounded with `<` and `>`. Optional arguments are prefixed with `?`. Difficulty of games ranges from 1-3.',
        fields: [
          {
            name: 'Information',
            value:
              '`??help` - ❓ - Display a list of available commands and games.\n' +
              '`??leaderboard` - 🏆 - Check out the leaderboards and see how fast you were against others.',
          },
          {
            name: 'Games',
            value:
              '`??puzzle maze <?difficulty>` - 🚶 - Traverse your way through a mind-bending maze.\n' +
              '`??puzzle sudoku <?difficulty>` - 🔢 - Test your mind with a classic game of Sudoku.\n' +
              '`??puzzle hangman <?difficulty>` - 💀 - Save someone from dying by guessing an unknown word.',
          },
          {
            name: 'ASCII Games',
            value:
              '`??ascii maze <?difficulty>` - 🚶 - Same as `??puzzle maze` but with ASCII art! Better for slow Wi-Fi.\n' +
              '`??ascii sudoku <?difficulty>` - 🔢 - Same as `??puzzle sudoku` but with ASCII art! Better for slow Wi-Fi.\n' +
              '`??ascii hangman <?difficulty>` - 💀 - Same as `??puzzle hangman` but with ASCII art! Better for slow Wi-Fi.',
          },
        ],
      }),
    )
  }
}
