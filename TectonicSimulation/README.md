# Tectonic Plate and Earthquake Simulation

A visually stunning 3D simulation of tectonic plate movement and earthquake events using Three.js. This interactive visualization demonstrates how tectonic plates interact, slide past each other, and build up tension until an "earthquake" event occurs, releasing energy.

![Tectonic Simulation Preview](https://via.placeholder.com/800x400/000/fff?text=Tectonic+Plate+Simulation)

## Features

- **Realistic Plate Movement**: Simulates different types of plate boundaries and movements
- **Dynamic Fault Lines**: Visualizes stress buildup along fault lines with color changes
- **Earthquake Events**: When sufficient stress builds up, earthquakes occur with magnitude based on accumulated stress
- **Visual Effects**: Includes seismic waves, ground displacement, cracks, and camera shake
- **Interactive Controls**: Rotate, zoom, and pan the camera to explore the simulation
- **Customizable Settings**: Adjust simulation speed, visual elements, and more
- **Educational Information**: Learn about plate tectonics through the built-in help panel

## Plate Boundary Types

The simulation models four main types of plate boundaries:

1. **Convergent**: Plates moving toward each other, creating mountains or subduction zones
2. **Divergent**: Plates moving away from each other, creating rifts or sea floors
3. **Transform**: Plates sliding past each other horizontally
4. **Subduction**: Where one plate is pushed beneath another

## Technical Details

This simulation is built using:

- **Three.js**: For 3D rendering and animation
- **HTML5 Canvas**: For rendering the WebGL content
- **lil-gui**: For the interactive settings panel

The simulation implements various algorithms for:
- Procedural terrain generation
- Stress calculation and propagation
- Fault detection and interaction
- Earthquake magnitude calculation

## How to Use

1. **Open the simulation** in a modern web browser (Chrome, Firefox, Edge recommended)
2. **Controls**:
   - Mouse drag to rotate the view
   - Mouse wheel to zoom in/out
   - Space key to pause/resume
   - R key to reset the simulation
   - H key to show/hide help
   - F key to toggle fullscreen

3. **Observe** how plates move and interact over time
4. **Watch** for earthquakes that occur when stress reaches critical levels
5. **Experiment** with settings in the control panel

## License

MIT © 2023 