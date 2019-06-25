import { Game } from './game'
import { SudokuGame } from './games'

interface State {
  gameList: {
    [guildID: string]: {
      [gameID: string]: Game
    }
  }
  counter: number
}

interface GameMap {
  [gameName: string]: { new (gameID: string): Game }
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

  static gameMap: GameMap = {
    Sudoku: SudokuGame,
  }

  static createGameInstance(guildID: string, gameName: string): Game {
    if (!this.state.gameList[guildID]) {
      this.state.gameList[guildID] = {}
    }
    const gameID = (this.state.counter++).toString().padStart(8, '0')
    const GameClass = this.gameMap[gameName]
    const gameInstance = new GameClass(gameID)
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
