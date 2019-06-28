import { GameDifficulty, GameData } from './game'

export class GameTitle {
  static create({ gameName, difficulty, gameID, isASCII }: GameData) {
    if (gameName.includes(' - ') || gameID.includes(' - ')) {
      throw new Error(
        `EmbedTitle.create(): game name ${gameName} or id ${gameID} includes " - "`,
      )
    }
    return `Puzzle - ${
      isASCII ? 'ASCII' : 'Normal'
    } - ${gameName} (${difficulty}) - ${gameID}`
  }

  static parse(title: string): GameData {
    const regex = /Puzzle - (ASCII|Normal) - (.*) \((.*)\) - ([0-9]{8}|Loading)/i
    const [, gameType, gameName, difficulty, gameID] = title.match(regex)
    if (!gameName || !difficulty || !gameID || !gameType) {
      throw new Error(
        `parseGameName(): no game name, difficulty, or id found in title "${title}"`,
      )
    }
    const isASCII = gameType === 'ASCII'
    return { gameName, gameID, isASCII, difficulty: <GameDifficulty>difficulty }
  }
}
