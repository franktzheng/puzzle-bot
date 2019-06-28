import { Game } from './game'
import { Database } from './database'
import { GAME_MAP } from './game-map'

interface State {
  gameList: {
    [guildID: string]: {
      [gameID: string]: Game
    }
  }
  counter: number
}

// Stores global state
// The reason for this is to easily keep track of all games across all guilds
// in a single object. The state object has a list of game instances, and each
// game instance is a Game object (see ./game.ts).
export class StateManager {
  static state: State = {
    gameList: {},
    counter: 0,
  }

  static async createGameInstance(
    guildID: string,
    gameName: string,
    args: any = {},
  ): Promise<Game> {
    if (!this.state.gameList[guildID]) {
      this.state.gameList[guildID] = {}
      const isGuildInDatabase = await Database.doesGuildExist(guildID)
      if (!isGuildInDatabase) {
        await Database.createNewGuild(guildID)
      }
    }
    const gameID = (this.state.counter++).toString().padStart(8, '0')
    const GameClass = GAME_MAP[gameName]
    const gameInstance = new GameClass(gameID, args)
    this.state.gameList[guildID][gameID] = gameInstance
    return gameInstance
  }

  static getGameInstance(guildID: string, gameID: string): Game {
    if (!this.state.gameList[guildID]) {
      throw new Error(`getGameInstance(): invalid guild ID ${guildID}`)
    }
    return this.state.gameList[guildID][gameID]
  }

  static removeGameInstance(guildID: string, gameID: string): void {
    if (!this.state.gameList[guildID]) {
      throw new Error(`removeGameInstance(): invalid guild ID ${guildID}`)
    }
    delete this.state.gameList[guildID][gameID]
  }
}
