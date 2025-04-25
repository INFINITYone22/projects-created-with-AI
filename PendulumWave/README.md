# Pendulum Wave Simulation

A visually appealing interactive simulation of pendulum waves that demonstrates principles of physics, harmonics, and wave motion.

![Pendulum Wave Simulation](https://i.imgur.com/UQTCbXJ.png)
*Note: The image above is for illustration purposes. The actual simulation is interactive.*

## About

This simulation demonstrates the beautiful patterns created when multiple pendulums of different lengths swing side by side. In a pendulum wave:

- Each pendulum has a slightly different length
- Longer pendulums swing slower than shorter ones
- The periods are calculated so that all pendulums return to the same position at regular intervals
- The pendulums create mesmerizing wave-like patterns as they move in and out of phase with each other

## Features

- **Interactive Controls:** Adjust the number of pendulums and the cycle time to see different patterns
- **Smooth Animation:** Fluid motion with trail effects to visualize the path of each pendulum
- **Responsive Design:** Works on different screen sizes
- **Beautiful Visuals:** Gradient colors and subtle effects create an engaging experience
- **Educational:** Demonstrates principles of simple harmonic motion, phase relationships, and wave physics

## How to Use

1. Open `index.html` in any modern web browser
2. Use the slider controls to adjust:
   - **Number of Pendulums:** More pendulums create more detailed wave patterns
   - **Cycle Time:** The time (in seconds) it takes for all pendulums to return to the same position
3. Use the "Reset" button to restart the simulation
4. Use the "Pause" button to freeze the animation at any point

## Physics Behind the Simulation

The simulation uses the following principles:

- The period of a pendulum is proportional to the square root of its length
- Each pendulum follows simple harmonic motion: θ = θ₀cos(ωt)
- The pendulums are carefully designed so that the longest pendulum makes exactly one less oscillation than the shortest pendulum over the cycle time

## Technical Implementation

- Written in pure HTML, CSS, and JavaScript
- Uses HTML5 Canvas for the animation
- No external libraries or dependencies required

## Browser Compatibility

The simulation works in all modern browsers that support HTML5 Canvas, including:
- Chrome
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.

---

Enjoy the mesmerizing patterns of pendulum waves and explore the beautiful physics behind them! 