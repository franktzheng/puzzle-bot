import mongoose from 'mongoose'
import signale from 'signale'

import { Guild, IGuild, getDefaultGame } from '../models/guild'
import { GameDifficulty, GameData } from './game'

export class Database {
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

  static async getGuild(guildID: string) {
    const res = await Guild.findOne({ guildID })
    return <IGuild>res
  }

  static async addCompletionTime(
    guildID: string,
    { gameName, difficulty, isASCII }: GameData,
    completionTime: number,
  ) {
    if (isASCII) {
      difficulty += 'ASCII'
    }

    const guild = <IGuild>await Guild.findOne({ guildID })
    const currentGame = guild.gameCompletionTimes.get(gameName)
    if (!currentGame) {
      guild.gameCompletionTimes.set(
        gameName,
        Object.assign(getDefaultGame(), { [difficulty]: completionTime }),
      )
    } else {
      const currentGameDifficulty = currentGame[difficulty]
      if (currentGameDifficulty.length === 3) {
        currentGameDifficulty.sort()
        const largest = currentGameDifficulty[2]
        if (completionTime < largest) {
          currentGameDifficulty[2] = completionTime
        }
      } else {
        currentGameDifficulty.push(completionTime)
      }
      guild.gameCompletionTimes.set(
        gameName,
        Object.assign(currentGame, {
          [difficulty]: currentGameDifficulty,
        }),
      )
    }
    const res = await guild.save()
    return res
  }
}
