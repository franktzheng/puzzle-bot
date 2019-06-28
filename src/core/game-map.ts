import { SudokuGame, HangmanGame } from '../games'
import { MazeGame } from '../games/maze-game'
import { Game } from './game'

interface GameMap {
  [gameName: string]: { new (...args: any[]): Game }
}

export const GAME_MAP: GameMap = {
  Sudoku: SudokuGame,
  Hangman: HangmanGame,
  Maze: MazeGame,
}
