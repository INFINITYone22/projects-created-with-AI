# Forest Fire Simulation

An interactive simulation that models how fire spreads through a forest, with adjustable parameters like tree density, wind direction, wind strength, and fire spread rate.

## Features

- **Dynamic Forest Generation**: Create forests with varying tree densities
- **Wind Effects**: Adjust wind direction and strength to see how it affects fire spread
- **Fire Spread Control**: Modify how quickly fire jumps from tree to tree
- **Interactive Interface**: Click on trees to manually start fires
- **Real-time Statistics**: Track the number of trees, burning trees, and burned trees
- **Responsive Design**: Works on different screen sizes

## How to Use

1. Open `index.html` in a web browser
2. Adjust the simulation parameters using the controls:
   - **Tree Density**: Controls how many trees are in the forest
   - **Wind Direction**: Sets which way the wind is blowing
   - **Wind Strength**: Determines how much the wind affects fire spread
   - **Fire Spread Rate**: Controls how quickly fire jumps from tree to tree
3. Click "Reset Forest" to generate a new forest with the current density
4. Click "Start Fire" to randomly ignite trees, or click directly on a tree to set it on fire
5. Use "Pause/Resume" to control the simulation

## How It Works

The simulation uses a cellular automaton model where the forest is represented as a grid of cells. Each cell can be in one of four states:

- **Empty**: No tree (dark blue-green)
- **Tree**: A healthy tree (green)
- **Burning**: A tree that is currently on fire (yellow-red gradient)
- **Burned**: A tree that has been consumed by fire (gray)

During each step of the simulation:
1. Burning trees become burned
2. Trees adjacent to burning trees have a chance to catch fire
3. Wind direction and strength affect the probability of fire spreading in different directions

The simulation automatically pauses when the fire has completely burned out.

## Technical Details

- Built with vanilla JavaScript, HTML5, and CSS3
- Uses HTML5 Canvas for rendering
- Implements a cellular automaton model for fire propagation
- Uses requestAnimationFrame for smooth animation

## Future Improvements

- Add terrain features like rivers or rocks that block fire
- Implement fire fighting mechanisms
- Add seasonal effects (dry vs. wet conditions)
- Include lightning strikes as natural fire starters
- Add smoke effects and more realistic fire visuals 