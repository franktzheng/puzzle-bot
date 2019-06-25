import { config } from 'dotenv'
import path from 'path'
import { CommandoClient } from 'discord.js-commando'
import { GameHandler } from './game-command-handler'

// add .env file to process.env
config()
const { DISCORD_BOT_TOKEN } = process.env

const client = new CommandoClient({
  commandPrefix: '?',
  owner: ['201552205386350595'], // add your user id here
})

client.registry
  .registerDefaultTypes()
  .registerGroups([['games', 'Games']])
  .registerDefaultGroups()
  .registerDefaultCommands()
  .registerCommandsIn(path.join(__dirname, 'commands'))

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}! (${client.user.id})`)
})

client.on('messageReactionAdd', messageReaction => {
  const { users } = messageReaction
  users.forEach(
    user => user.id !== client.user.id && messageReaction.remove(user),
  )
  GameHandler.handleGameUpdate(messageReaction)
})

client.on('message', message => {
  message.react('1⃣')
})

client.on('error', console.error)

client.login(DISCORD_BOT_TOKEN)
