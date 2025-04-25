# NeuralFlowViz

An interactive visualization tool for exploring how Large Language Models (LLMs) process text.

![NeuralFlowViz Screenshot](assets/screenshot.png)

## Overview

NeuralFlowViz is an educational web application that provides an intuitive, visual representation of transformer-based language models. It allows users to:

- Visualize the architecture of an LLM with its various components
- Watch text being processed through the model in real-time
- Explore attention patterns and neuron activations
- Customize model parameters and see how they affect the architecture
- Zoom and pan to examine different levels of detail

## Features

- **Interactive Model Visualization**: See the full architecture of a transformer model, including embeddings, attention mechanisms, feed-forward networks, and more.
- **Real-time Animation**: Watch as tokens flow through the model, with animated visualizations of attention and activations.
- **Customizable Parameters**: Adjust the number of layers, attention heads, model size, and more to see how they affect the model.
- **Educational Tooltips**: Hover over components to learn about their function in the model.
- **Attention Visualization**: See which tokens are attending to which other tokens in the multi-head attention mechanism.
- **Neuron Activation Display**: Visualize the activation patterns of neurons in different components.
- **Responsive Design**: Works on desktop and tablet devices with an intuitive interface.

## How to Use

1. Open `index.html` in a modern web browser
2. Enter a text prompt in the input area
3. Click "Process Text" to start the animation
4. Use the zoom and pan controls to explore the model
5. Adjust model parameters and click "Apply Configuration" to update the model

## Technical Details

NeuralFlowViz is built with:

- **p5.js**: For canvas rendering and animations
- **Vanilla JavaScript**: For application logic and UI interactions
- **CSS3**: For styling and responsive design

The application simulates a simplified version of a transformer-based language model, focusing on the key architectural components rather than implementing the full mathematical operations. This makes it accessible for educational purposes while still providing an accurate representation of how these models work.

## Development

To modify or extend NeuralFlowViz:

1. Clone the repository
2. Make changes to the JavaScript files in the `js` directory
3. Open `index.html` to test your changes

The codebase is organized as follows:

- `config.js`: Configuration settings for the model and visualization
- `model.js`: Core LLM simulation logic
- `visualization.js`: p5.js rendering and animation
- `ui.js`: User interface interactions
- `main.js`: Application initialization

## License

This project is released under the MIT License. See the LICENSE file for details.

## Acknowledgments

NeuralFlowViz was inspired by the need for better educational tools to understand the inner workings of large language models. It draws inspiration from various papers and visualizations in the field of natural language processing and deep learning. 