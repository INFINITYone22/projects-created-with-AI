# Conway's Game of Life

A web-based implementation of Conway's Game of Life, a cellular automaton devised by mathematician John Conway in 1970.

## About the Game

Conway's Game of Life is a zero-player game, meaning its evolution is determined by its initial state, with no further input from humans. It takes place on a 2D grid where each cell can be in one of two states: alive or dead.

### Rules

The game evolves in discrete time steps (generations), following these rules:

1. **Underpopulation**: Any live cell with fewer than two live neighbors dies
2. **Survival**: Any live cell with two or three live neighbors continues to live
3. **Overpopulation**: Any live cell with more than three live neighbors dies
4. **Reproduction**: Any dead cell with exactly three live neighbors becomes a live cell

These simple rules lead to fascinating patterns and behaviors that can be observed over time.

## Features

- Interactive grid where you can toggle cells by clicking
- Controls to start, stop, and reset the simulation
- Random grid generation
- Adjustable simulation speed
- Displays current generation number and population count
- Responsive design that adjusts to window size
- Toroidal grid (edges wrap around)

## How to Use

1. Open `index.html` in a web browser
2. Click on cells to toggle them between alive and dead states
3. Click "Random" to generate a random pattern
4. Click "Start" to begin the simulation
5. Adjust the speed slider to change how fast generations evolve
6. Click "Stop" to pause the simulation
7. Click "Reset" to clear the grid

## Implementation Details

This implementation uses:
- HTML5 Canvas for rendering the grid
- JavaScript for game logic and interactions
- CSS for styling

The code is organized into clear functions for each aspect of the simulation:
- Grid initialization and reset
- Drawing the grid
- Counting neighbors
- Updating the grid based on Conway's rules
- Game loop using requestAnimationFrame
- Event handling for user interactions

## Patterns to Try

Try creating these classic patterns:
- **Glider**: A pattern that moves diagonally across the grid
- **Blinker**: A simple oscillator that alternates between horizontal and vertical orientations
- **Glider Gun**: Creates a continuous stream of gliders
- **Random Soup**: Start with a random arrangement and watch complex patterns emerge 