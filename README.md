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

## Setup

Follow the below steps if you plan to run the bot locally:

1. Clone this repository.
2. Make sure you have `node` and `npm` installed on your computer. If not, you can install it [here](https://nodejs.org/en/).
3. Create a file in the base directory called `.env`.
4. Create a Discord bot. You can do so in [Discord's Developer Portal](https://discordapp.com/developers/applications). Add the following line to `.env`:
```
DISCORD_BOT_TOKEN=<your bot token goes here!>
```
5. Install `ngrok` from [ngrok.com](https://ngrok.com/). This bot uses `ngrok` to expose `localhost` and use it to host images. Start an `ngrok` server on port 8080. If you have `ngrok` saved as an environment variable, you can run:
```
ngrok http 8080
```
After your server is started, add the following line to `.env`:
```
BASE_URL=<your ngrok url goes here! (i.e. http://173145df.ngrok.io)>
```
6. Create a MongoDB database. You can do this either through [Atlas](https://www.mongodb.com/cloud/atlas) or by hosting it locally. Add the connection string to the `.env`:
```
MONGO_URI=<your connection string goes here!>
```
7. You're good to go! Run the following to start the bot:
```
$ npm install && npm start
```
