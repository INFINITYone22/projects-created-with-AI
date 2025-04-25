/**
 * Configuration settings for the NeuralFlowViz LLM simulator
 * This file contains default settings and model parameters
 */

const CONFIG = {
    // Canvas settings
    canvas: {
        width: 0,  // Will be set dynamically based on container
        height: 0, // Will be set dynamically based on container
        backgroundColor: '#1e1e1e',
        padding: 40,
    },
    
    // Camera/view settings
    view: {
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        minScale: 0.5,
        maxScale: 3,
        zoomStep: 0.1,
        panSpeed: 10,
    },
    
    // Default model parameters
    model: {
        // Model architecture
        numLayers: 6,
        numHeads: 8,
        hiddenSize: 768,
        ffnSize: 3072,
        vocabSize: 50000,
        maxSeqLength: 512,
        
        // Model size presets (parameters in millions)
        sizes: {
            tiny: {
                numLayers: 4,
                numHeads: 6,
                hiddenSize: 384,
                ffnSize: 1536,
                paramCount: "125M"
            },
            small: {
                numLayers: 6,
                numHeads: 8,
                hiddenSize: 768,
                ffnSize: 3072,
                paramCount: "1.3B"
            },
            medium: {
                numLayers: 12,
                numHeads: 12,
                hiddenSize: 1024,
                ffnSize: 4096,
                paramCount: "6B"
            },
            large: {
                numLayers: 24,
                numHeads: 16,
                hiddenSize: 1280,
                ffnSize: 5120,
                paramCount: "13B"
            }
        },
        
        // Current active size
        currentSize: "medium",
    },
    
    // Animation settings
    animation: {
        speed: 5, // 1-10 scale
        tokenProcessingTime: 500, // ms per token at speed 5
        layerTransitionTime: 300, // ms to transition between layers at speed 5
        attentionFlashDuration: 200, // ms for attention flash animation
        neuronActivationDuration: 150, // ms for neuron activation animation
        tokenColors: [
            "#4a6bff", // Primary blue
            "#7e57c2", // Purple
            "#ff5722", // Orange
            "#4caf50", // Green
            "#f44336", // Red
            "#2196f3", // Light blue
            "#ff9800", // Amber
            "#9c27b0"  // Deep purple
        ],
    },
    
    // Visualization settings
    visualization: {
        showAttentionMaps: true,
        showNeuronActivations: true,
        showTooltips: true,
        
        // Component dimensions
        embeddings: {
            width: 120,
            height: 200,
            spacing: 40
        },
        attention: {
            width: 180,
            height: 180,
            headSize: 40,
            headSpacing: 10,
            spacing: 40
        },
        feedForward: {
            width: 120,
            height: 180,
            spacing: 40
        },
        layerNorm: {
            width: 80,
            height: 120,
            spacing: 20
        },
        
        // Colors for different components
        colors: {
            embeddings: "#4a6bff",
            attention: "#7e57c2",
            feedForward: "#ff5722",
            layerNorm: "#4caf50",
            connections: "#555555",
            activeConnections: "#ffffff",
            background: "#1e1e1e",
            text: "#f5f5f5",
            tokenEmbedding: "#2196f3",
            positionEmbedding: "#ff9800"
        }
    },
    
    // Educational tooltips content
    tooltips: {
        embeddings: "Embeddings convert tokens (words/subwords) into vectors that the model can process. They include both token and positional information.",
        attention: "Attention mechanisms allow the model to focus on different parts of the input sequence when producing outputs, creating connections between related words.",
        multiHeadAttention: "Multiple attention heads allow the model to focus on different aspects of the input simultaneously, capturing various relationships.",
        feedForward: "Feed-forward networks process each position independently, applying the same transformation to each token representation.",
        layerNorm: "Layer normalization stabilizes the learning process by normalizing the inputs across features.",
        residualConnection: "Residual connections help information flow through deep networks by adding the input of a layer to its output.",
        tokenization: "Tokenization breaks text into smaller units (tokens) that the model can process, usually words or subwords."
    }
};

// Function to update config based on UI controls
function updateConfig() {
    // Get values from UI controls
    const numLayers = parseInt(document.getElementById('num-layers').value);
    const numHeads = parseInt(document.getElementById('num-heads').value);
    const modelSize = document.getElementById('model-size').value;
    const animationSpeed = parseInt(document.getElementById('animation-speed').value);
    
    // Update model parameters
    CONFIG.model.numLayers = numLayers;
    CONFIG.model.numHeads = numHeads;
    CONFIG.model.currentSize = modelSize;
    
    // Update model dimensions based on selected size
    const sizeConfig = CONFIG.model.sizes[modelSize];
    CONFIG.model.hiddenSize = sizeConfig.hiddenSize;
    CONFIG.model.ffnSize = sizeConfig.ffnSize;
    
    // Update animation speed
    CONFIG.animation.speed = animationSpeed;
    CONFIG.animation.tokenProcessingTime = 1000 / (Math.max(0.1, animationSpeed) / 5);
    CONFIG.animation.layerTransitionTime = 600 / (Math.max(0.1, animationSpeed) / 5);
    
    // Update visualization settings
    CONFIG.visualization.showAttentionMaps = document.getElementById('show-attention').checked;
    CONFIG.visualization.showNeuronActivations = document.getElementById('show-activations').checked;
    CONFIG.visualization.showTooltips = document.getElementById('show-tooltips').checked;
    
    // Return the updated config
    return CONFIG;
}

// Function to reset config to defaults
function resetConfig() {
    // Reset model parameters
    CONFIG.model.numLayers = 6;
    CONFIG.model.numHeads = 8;
    CONFIG.model.currentSize = "medium";
    CONFIG.model.hiddenSize = CONFIG.model.sizes.medium.hiddenSize;
    CONFIG.model.ffnSize = CONFIG.model.sizes.medium.ffnSize;
    
    // Reset animation speed
    CONFIG.animation.speed = 5;
    CONFIG.animation.tokenProcessingTime = 500;
    CONFIG.animation.layerTransitionTime = 300;
    
    // Reset visualization settings
    CONFIG.visualization.showAttentionMaps = true;
    CONFIG.visualization.showNeuronActivations = true;
    CONFIG.visualization.showTooltips = true;
    
    // Reset view
    CONFIG.view.scale = 1;
    CONFIG.view.offsetX = 0;
    CONFIG.view.offsetY = 0;
    
    // Update UI controls to match
    document.getElementById('num-layers').value = CONFIG.model.numLayers;
    document.getElementById('num-heads').value = CONFIG.model.numHeads;
    document.getElementById('model-size').value = CONFIG.model.currentSize;
    document.getElementById('animation-speed').value = CONFIG.animation.speed;
    document.getElementById('show-attention').checked = CONFIG.visualization.showAttentionMaps;
    document.getElementById('show-activations').checked = CONFIG.visualization.showNeuronActivations;
    document.getElementById('show-tooltips').checked = CONFIG.visualization.showTooltips;
    
    // Update value displays
    document.querySelectorAll('.value-display').forEach((el, index) => {
        if (index === 0) el.textContent = CONFIG.model.numLayers;
        if (index === 1) el.textContent = CONFIG.model.numHeads;
        if (index === 2) el.textContent = CONFIG.animation.speed;
    });
    
    return CONFIG;
} 