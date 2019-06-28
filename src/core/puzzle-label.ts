export class PuzzleLabel {
  static create(gameName: string, difficulty: number, gameID: string) {
    if (gameName.includes(' - ') || gameID.includes(' - ')) {
      throw new Error(
        `EmbedTitle.create(): game name ${gameName} or id ${gameID} includes " - "`,
      )
    } else if (difficulty > 3 || difficulty < 1) {
      throw new Error(`EmbedTitle.create(): invalid difficulty ${difficulty}`)
    }
    const difficultyString = ['Easy', 'Medium', 'Hard'][difficulty - 1]
    return `Puzzle - ${gameName} (${difficultyString}) - ${gameID}`
  }

  static createLoading(gameName: string) {
    return `Puzzle - ${gameName} - Loading...`
  }

  static parseGameTypeAndID(title: string): [string, string] {
    const regex = /Puzzle - (.*) - ([0-9]{8}|Loading)/i
    const [, gameType, gameID] = title.match(regex)
    if (gameID === 'Loading') {
      return [null, null]
    } else if (!gameID || !gameType) {
      throw new Error(
        `parseGameName(): no game ID or name found in title "${title}"`,
      )
    }
    return [gameType, gameID]
  }
}
