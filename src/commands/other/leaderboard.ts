import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { RichEmbed } from 'discord.js'

import { Database } from '../../core/database'
import { IGameLeaderboard, IGuild } from '../../models/guild'

export default class LeaderboardCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'leaderboard',
      group: 'other',
      memberName: 'leaderboard',
      description: 'Show leaderboards for different games!',
    })
  }

  async run(message: CommandMessage) {
    const guild = await Database.getGuild(message.guild.id)
    const title = `🏆 Leaderboard for ${message.guild.name} 🏆`
    if (!guild) {
      return message.say(
        new RichEmbed({
          title,
          description: 'No times to display.',
        }),
      )
    }
    const fields = getLeaderboardFields(guild)
    return message.say(new RichEmbed({ title, fields }))
  }
}

function getLeaderboardFields(guild: IGuild) {
  // converts from an ES6 map to object
  const gameCompletionTimes: {
    [gameName: string]: IGameLeaderboard
  } = Object.assign(
    {},
    ...[...guild.gameCompletionTimes.entries()].map(([k, v]) => ({ [k]: v })),
  )

  const fields = Object.entries(gameCompletionTimes)
    .map(([gameName, leaderboard]) => {
      // @ts-ignore
      leaderboard = leaderboard._doc
      return createLeaderboardField(gameName, leaderboard)
    })
    .filter(field => field)
  return fields
}

function createLeaderboardField(
  gameName: string,
  gameLeaderboard: IGameLeaderboard,
) {
  const leaderboardString = Object.entries(gameLeaderboard)
    .map(([category, completionTimes]) => {
      category = formatCategory(category)
      const rankingString = formatCompletionTimes(completionTimes).join('\n')
      return rankingString && `*${category}*\n${rankingString}\n`
    })
    .filter(times => times)
  if (!leaderboardString.length) {
    return undefined
  }
  const field = {
    name: gameName,
    value: leaderboardString.join('\n'),
    inline: true,
  }
  return field
}

function formatCompletionTimes(completionTimes: number[]) {
  const formattedTimes = completionTimes
    .slice()
    .sort()
    .map((time: number) => {
      if (time < 60000) {
        return `${(time / 1000).toFixed(2)} s`
      }
      return `${Math.floor(time / 60000)} min ${((time / 1000) % 60).toFixed(
        2,
      )} s`
    })
    .filter((time, index) => index < 3)
    .map((time, index) => {
      if (index === 0) {
        return `🥇 ${time}`
      } else if (index === 1) {
        return `🥈 ${time}`
      } else {
        return `🥉 ${time}`
      }
    })
  return formattedTimes
}

function formatCategory(category: string) {
  switch (category) {
    case 'easy':
      return 'Easy Normal'
    case 'medium':
      return 'Medium Normal'
    case 'hard':
      return 'Hard Normal'
    case 'easyASCII':
      return 'Easy ASCII'
    case 'mediumASCII':
      return 'Medium ASCII'
    case 'hardASCII':
      return 'Hard ASCII'
    default:
      throw new Error(`formatCategory(): invalid category ${category}`)
  }
}
