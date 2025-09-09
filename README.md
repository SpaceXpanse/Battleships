# SpaceXpanse: Battleships /Prototype/ 
## The classic game of Battleship, but with a twist
Open-source  
*Non-profit - Foundation operated*  
Simple multiplayer online game in the ROD blockchain  

* Developed on top of [**libspex's headless Ships game**](https://github.com/SpaceXpanse/libspex/tree/dev/ships) with the help from various development tools.
* Made with Unity
* Simplistic gameplay: Two players can choose to compete with each other's tactical combat, strategic skills and shear luck for a prize that they agreed upon in the beginning.
* Ability to compare players' scores through Leaderboard
* Owning NFTs to straighten spaceship's attack and defense capabilities /TBA/
* In-game communication in real time through [**Metalog**](https://github.com/SpaceXpanse/Whitepaper/blob/main/README.md#community) /TBD/

Dive into the strategic depths of naval space warfare with the classic game of Battleship, but with a few twists, where cunning tactics and shrewd guesswork reign supreme in outer space.

**SpaceXpanse: Battleships** is an iconic two-player board game that brings the thrill of space combat to your fingertips. Each player commands a fleet of ships hidden on a grid-based battlefield. The objective? 
To strategically pinpoint and strike your opponent's fleet before they do the same to you.

At the heart of **SpaceXpanse: Battleships** lies a battle of wits and deduction. Players take turns calling out coordinates on the grid, aiming to strike their adversary's vessels. The challenge intensifies as you employ strategic reasoning to deduce the location of your opponent's ships based on their hits and misses.

The game will offer a variety of spaceship types, each with a distinct size and shape, ranging from the compact glider to the formidable space destroyer. Success hinges on your ability to anticipate your opponent's moves while safeguarding the secrecy of your own fleet.

Prepare to unleash your inner commander as you deploy your attacks with calculated precision. Will you choose to blanket an area with shots, hoping to catch a hidden vessel in the crossfire, or will you methodically zero in
on a suspected ship's location? The thrill lies in the uncertainty, the tension of each salvo, and the elation of a successful hit.

**SpaceXpanse: Battleships** is a game of strategy, deduction, and a touch of luck. It's a timeless contest that has entertained generations, fostering intense rivalries and moments of exhilarating triumph. Whether you're engaging in a friendly ace-off or strategizing against a formidable adversary, **SpaceXpanse: Battleships** promises an engaging and immersive experience that has stood the test of time. So set sail, marshal your fleet, and navigate your way to victory in this thrilling game of naval space warfare.

## This prototype is made with:

Web: Vanilla JavaScript, HTML, CSS, Native RPC for ROD blockchain integration

Tools: Autodesk 3ds Max, Adobe Photoshop, Ableton Live

## ROD Blockchain Integration Features

This prototype includes native ROD blockchain integration with the following features:

- **Bitcoin-Compatible**: Uses ROD blockchain's Bitcoin/Namecoin foundation
- **Name Operations**: Player registration using `name_new` and `name_update` operations
- **Leaderboard System**: Scores stored using Namecoin-style name-value database
- **RPC Integration**: Direct JSON-RPC communication with ROD blockchain node
- **Error Handling**: Graceful handling of blockchain operation failures
- **Offline Mode**: Fallback to local storage when blockchain is unavailable
- **Secure Credential Management**: Encrypted storage of RPC credentials
- **Proxy Server**: Local RPC proxy to handle browser authentication limitations

## Game flow:

![image](https://user-images.githubusercontent.com/52622303/73218894-8eb4c200-4163-11ea-9f11-51eda48dd695.png)

## How to run

### Quick Start:
```bash
npm install
npm start
```

Then open `http://localhost:3000` in your web browser.

### Manual Setup:
Simply open `index.html` in a web browser. The game includes:

- **ROD Blockchain Mode**: Configure RPC connection to use blockchain features
- **Offline Mode**: Play without blockchain connection using local storage

### For ROD blockchain integration:

1. **Install Dependencies**: Run `npm install` to get development server
2. **Start RPC Proxy**: Run `node rpc-proxy.js` to handle browser authentication
3. **Configure RPC**: Set up ROD blockchain node RPC credentials through the UI
4. **Run Game**: Start the development server with `npm start`

### File Structure:

- `index.html` - Main game interface with blockchain registration
- `rod-blockchain.js` - ROD blockchain integration with native RPC calls
- `registration.js` - User registration and name management
- `game.js` - Core game logic and mechanics
- `rpc-proxy.js` - Local proxy server for browser authentication
- `credential-manager.js` - Secure credential storage and management
- `rod-credentials-integration.js` - Credential integration with blockchain
- `init.js` - Unified initialization system
- `config.js` - Configuration management
- `package.json` - Project dependencies and scripts

## ROD Blockchain Configuration

The game uses Bitcoin-compatible RPC methods:
- `name_new` - Register new player names
- `name_update` - Update leaderboard scores
- `name_show` - Retrieve registered data
- `getnetworkinfo` - Check blockchain connection status
- Standard Bitcoin JSON-RPC methods

## Security Features

- **Encrypted Credentials**: RPC credentials stored encrypted with PBKDF2
- **Proxy Authentication**: Browser authentication handled through local proxy
- **Input Validation**: Secure handling of user input and blockchain operations
- **Error Recovery**: Graceful fallback to offline mode on blockchain failures

## Testing

Open the browser's developer console to see blockchain integration status and debug information.

Run comprehensive tests:
```bash
# Test blockchain integration
node test-blockchain-integration.js

# Test game functionality
node test-game-functionality.js
```


## Credits:

Main button and selection click sounds: https://www.premiumbeat.com/blog/free-sci-fi-hud-computer-sfx/

Battleship sunk sound: http://soundbible.com/1472-Depth-Charge.html
