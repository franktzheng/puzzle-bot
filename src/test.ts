import { generateMaze, getGridString } from './utils/generateMaze'

const grid = generateMaze(10, 10)
console.log(getGridString(grid, [0, 0]))
