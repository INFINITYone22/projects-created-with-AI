# Procedural Maze Runner

A simple maze game built with Python and Pygame where mazes are procedurally generated.

## Features

*   Procedurally generated mazes using Recursive Backtracking or Prim's algorithm.
*   Player navigation through the maze.
*   Selectable difficulty levels (Easy, Medium, Hard) affecting maze size and cell size.
*   Optional features: Timer, Fog of War, Hints.
*   Basic sound effects for movement, winning, losing, etc.

## Requirements

*   Python 3.x
*   Pygame library (`pip install pygame`)
*   NumPy library (`pip install numpy`)

## How to Run

1.  Make sure you have Python, Pygame, and NumPy installed.
2.  Clone this repository or download the `maze_runner.py` file.
3.  Navigate to the project directory in your terminal.
4.  Run the script using:
    ```bash
    python maze_runner.py
    ```

## Controls

### Main Menu
*   **Enter/Space:** Start Game
*   **S:** Go to Settings
*   **Esc:** Quit

### Settings Menu
*   **Up/Down Arrows:** Navigate options
*   **Enter/Space/Left/Right Arrows:** Change selected option value
*   **Esc/B:** Go back to previous menu (Main Menu or Pause Menu)

### In-Game
*   **Arrow Keys / WASD:** Move Player
*   **H:** Show Hint (if enabled)
*   **Esc:** Pause Game

### Pause Menu
*   **R/Esc:** Resume Game
*   **S:** Go to Settings
*   **M:** Go back to Main Menu
*   **Q:** Quit Game

### Win/Lose Screen
*   **Enter/Space/R:** Play Again / Try Again
*   **M:** Go back to Main Menu
*   **Esc:** Quit
