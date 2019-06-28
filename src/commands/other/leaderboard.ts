import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'

export default class LeaderboardCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'leaderboard',
      group: 'games',
      memberName: 'leaderboard',
      description: 'Show leaderboards for different games!',
    })
  }

  run(message: CommandMessage) {
    return message.say('hi')
  }
}
