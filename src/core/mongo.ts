import mongoose from 'mongoose'
import signale from 'signale'

import { Guild, IGuild } from '../models/guild'

export class Mongo {
  static connect(mongoURI: string) {
    const db = mongoose.connection
    mongoose.connect(mongoURI, { useCreateIndex: true, useNewUrlParser: true })

    db.on('connected', () => {
      signale.start('Mongoose default connection open')
    })

    db.on('error', (err: any) => {
      signale.error(`Mongoose default connection error: ${err}`)
    })

    db.on('disconnected', () => {
      signale.error('Mongoose default connection disconnected')
    })
  }

  static disconnect() {
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close(() => {
        signale.error(
          'Mongoose default connection disconnected through app termination',
        )
      })
    }
  }

  static async doesGuildExist(guildID: string) {
    const numOfDocuments = await Guild.countDocuments({ guildID })
    return numOfDocuments > 0
  }

  static async createNewGuild(guildID: string) {
    const res = await Guild.create({ guildID })
    return res
  }

  static async addCompletionTime(
    guildID: string,
    gameName: string,
    completionTime: number,
  ) {
    const guild = <IGuild>await Guild.findOne({ guildID })
    const game = guild.gameCompletionTimes.get(gameName)
    if (!game) {
      guild.gameCompletionTimes.set(gameName, [completionTime])
    } else {
      guild.gameCompletionTimes.set(gameName, game.concat(completionTime))
    }
    const res = await guild.save()
    return res
  }
}
