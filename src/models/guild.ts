import { Schema, model, Document } from 'mongoose'

import { GAME_MAP } from '../core/game-map'

export function getDefaultGame() {
  return {
    easy: <number[]>[],
    medium: <number[]>[],
    hard: <number[]>[],
    easyASCII: <number[]>[],
    mediumASCII: <number[]>[],
    hardASCII: <number[]>[],
  }
}

export function getDefaultGameMap() {
  const gameMap = Object.keys(GAME_MAP).reduce(
    (map: { [game: string]: IGameLeaderboard }, gameName) => {
      map[gameName] = getDefaultGame()
      return map
    },
    {},
  )
  return new Map(Object.entries(gameMap))
}

const gameSchema = new Schema(
  {
    easy: {
      type: [Number],
      default: [],
    },
    medium: {
      type: [Number],
      default: [],
    },
    hard: {
      type: [Number],
      default: [],
    },
    easyASCII: {
      type: [Number],
      default: [],
    },
    mediumASCII: {
      type: [Number],
      default: [],
    },
    hardASCII: {
      type: [Number],
      default: [],
    },
  },
  { _id: false, versionKey: false },
)

const guildSchema = new Schema({
  guildID: {
    type: String,
    required: true,
    unique: true,
  },
  gameCompletionTimes: {
    type: Map,
    of: gameSchema,
    default: getDefaultGameMap(),
  },
})

export const Guild = model('Guild', guildSchema)

export interface IGuild extends Document {
  guildID: string
  gameCompletionTimes: Map<string, IGameLeaderboard>
}

export interface IGameLeaderboard {
  easy: number[]
  medium: number[]
  hard: number[]
  easyASCII: number[]
  mediumASCII: number[]
  hardASCII: number[]
}
