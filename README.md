# 🏺 Mancala - The World's Oldest Game

A beautiful, interactive HTML5 implementation of the classic board game Mancala with AI opponent.

## 🎮 Play Online

Visit the [GitHub Pages site](https://aishwaryasingh51.github.io/mancala/) to play now!

## ✨ Features

- 🎨 **Modern UI Design** - Beautiful gradients, animations, and responsive layout
- 🤖 **Smart AI Opponent** - Challenging AI with strategic gameplay
- 🎯 **Interactive Gameplay** - Smooth animations and visual feedback
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ⌨️ **Keyboard Controls** - Play with number keys 1-6, N for new game, H for hints
- 🎵 **Sound Effects** - Optional audio feedback (can be toggled)
- 💡 **Hint System** - Get suggestions for your next move
- 📖 **Built-in Rules** - Learn how to play with the integrated tutorial

## 🎯 How to Play

### Objective
Collect more stones in your store than your opponent.

### Rules
1. **Setup**: Each player has 6 pits with 4 stones each, plus one store
2. **Turn**: Click any of your pits (bottom row) to pick up all stones
3. **Distribute**: Drop stones counter-clockwise, one per pit
4. **Stores**: Include your store but skip opponent's store
5. **Extra Turn**: If your last stone lands in your store, play again
6. **Capture**: If your last stone lands in an empty pit on your side, capture that stone plus all stones in the opposite pit
7. **Game End**: When all pits on one side are empty, the game ends

### Controls
- **Mouse**: Click on your pits to make moves
- **Keyboard**: Use keys 1-6 to select pits, N for new game, H for hint
- **New Game**: Start over at any time
- **Hint**: Get AI suggestions for your best move

## 🛠️ Technical Details

### Built With
- **HTML5** - Semantic structure and accessibility
- **CSS3** - Modern styling with flexbox, grid, and animations
- **Vanilla JavaScript** - Game logic, AI, and DOM manipulation
- **Web Audio API** - Sound effects
- **CSS Animations** - Smooth stone movements and UI feedback

### AI Strategy
The AI opponent uses a strategic algorithm that considers:
- Moves that grant extra turns
- Capture opportunities  
- Defensive moves to prevent human captures
- Stone count optimization

### Performance
- Lightweight (no external dependencies)
- Smooth 60fps animations
- Optimized for mobile devices
- Fast load times

## 📁 Project Structure

```
mancala/
├── index.html          # Main game page
├── styles.css          # All styling and animations
├── script.js           # Game logic and AI
└── README.md           # This file
```

## 🚀 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/aishwaryasingh51/mancala.git
   ```

2. Open `index.html` in your web browser

3. Start playing!

No build process or dependencies required - it's pure HTML, CSS, and JavaScript.

## 🎨 Customization

The game is designed to be easily customizable:

- **Colors**: Modify CSS custom properties for theme changes
- **Animations**: Adjust timing and easing in CSS animations
- **AI Difficulty**: Modify the scoring system in `findBestAIMove()`
- **Sounds**: Customize frequencies and durations in `SoundManager`

## 🎪 Easter Eggs

Try the Konami code (↑↑↓↓←→←→BA) for a fun surprise!

## 📱 Browser Compatibility

- Chrome 60+ ✅
- Firefox 55+ ✅  
- Safari 12+ ✅
- Edge 79+ ✅
- Mobile browsers ✅

## 📜 License

MIT License - feel free to use this code for your own projects!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve the AI strategy
- Add new themes or animations

## 🏆 Credits

Created with ❤️ for the love of classic board games.

Mancala is one of the oldest known games, with evidence of play from 6th-7th century CE and possibly much earlier.
