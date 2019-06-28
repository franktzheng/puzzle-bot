# Puzzle Bot ![Discord Hack Week](https://img.shields.io/badge/Discord%20Hack%20Week-2019-%23000000.svg)

_Built for Discord Hack Week 2019_

A bot that let's you play puzzle games from right within Discord! Challenge your friends and compete for the top spot on the leaderboards.

Add the bot to your server with [this link](https://discordapp.com/api/oauth2/authorize?client_id=592782977327562987&permissions=11328&scope=bot).

## Commands

Arguments are surrounded with `<` and `>`. Optional arguments are prefixed with `?`.

### Information

* `?puzzle help` - ❓ - A list of available commands and games.
* `?puzzle leaderboard` - 🏆 - Check out the leaderboards and see how fast you were against others.

### Games

Difficulty of puzzles range from 1-3.

* `?puzzle maze <?difficulty>` - 🚶‍♂️ - Traverse your way through a mind-bending maze.
* `?puzzle sudoku <?difficulty>` - 🔢 - Test your mind with a classic game of Sudoku.
* `?puzzle hangman <?difficulty>` - 💀 - Save someone from dying by guessing an unknown word.

### ASCII Games

Slow Wi-Fi connection? Play the ASCII version of a game instead by adding `ascii` before the game name.

* `?puzzle ascii maze <?difficulty>`
* `?puzzle ascii sudoku <?difficulty>`
* `?puzzle ascii hangman <?difficulty>`
