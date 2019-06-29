import { config } from 'dotenv'
import path from 'path'
import express from 'express'
import { CommandoClient } from 'discord.js-commando'
import signale from 'signale'

import { GameHandler } from './core/game-handler'
import { Database } from './core/database'

// add .env file to process.env
config()
const { DISCORD_BOT_TOKEN, MONGO_URI } = process.env

// MongoDB connection
Database.connect(MONGO_URI)

// Express server for hosting images
const app = express()
const PORT = process.env.PORT || 8080
app.use(express.static('public'))
app.get('/', (_req, res) => res.send('Test'))
app.listen(PORT, () => signale.start(`App listening on port ${PORT}`))

// Discord.js client
const client = new CommandoClient({
  commandPrefix: '??',
  owner: ['201552205386350595'], // add your user id here
})

client.registry
  .registerDefaultTypes()
  .registerGroups([['games', 'Games'], ['other', 'Other']])
  .registerCommandsIn(path.join(__dirname, 'commands'))

client.once('ready', () => {
  client.user.setActivity('??help')
  signale.start(`Logged in as ${client.user.tag}! (${client.user.id})`)
})

client.on('messageReactionAdd', messageReaction => {
  const { users, message } = messageReaction
  if (
    message.member.id === client.user.id &&
    users.size > 1 && // only count when the reaction is NOT the bot's reaction
    message.embeds[0] &&
    message.embeds[0].title.includes('Puzzle')
  ) {
    users.forEach(
      user => user.id !== client.user.id && messageReaction.remove(user),
    )
    GameHandler.handleGameUpdate(messageReaction)
  }
})

client.on('error', console.error)

client.login(DISCORD_BOT_TOKEN)
