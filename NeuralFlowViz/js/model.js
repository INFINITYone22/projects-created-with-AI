/**
 * Model.js - Core LLM simulation logic
 * This file contains the classes and functions that simulate the behavior of a transformer-based LLM
 */

class LLMModel {
    constructor(config) {
        this.config = config;
        this.layers = [];
        this.tokens = [];
        this.tokenEmbeddings = [];
        this.currentState = {
            activeLayer: -1,
            activeComponent: null,
            processingToken: -1,
            attentionWeights: [],
            neuronActivations: []
        };
        
        this.initialize();
    }
    
    initialize() {
        // Create layers based on config
        this.createLayers();
    }
    
    createLayers() {
        this.layers = [];
        
        // Input embedding layer
        this.layers.push({
            type: 'embedding',
            index: 0,
            components: [
                { type: 'tokenEmbedding', name: 'Token Embedding' },
                { type: 'positionEmbedding', name: 'Position Embedding' }
            ]
        });
        
        // Transformer layers
        for (let i = 0; i < this.config.model.numLayers; i++) {
            this.layers.push({
                type: 'transformer',
                index: i + 1,
                components: [
                    { type: 'layerNorm', name: 'Layer Norm 1' },
                    { type: 'attention', name: 'Multi-Head Attention', heads: this.config.model.numHeads },
                    { type: 'residual', name: 'Residual Connection 1' },
                    { type: 'layerNorm', name: 'Layer Norm 2' },
                    { type: 'feedForward', name: 'Feed-Forward Network' },
                    { type: 'residual', name: 'Residual Connection 2' }
                ]
            });
        }
        
        // Output layer
        this.layers.push({
            type: 'output',
            index: this.config.model.numLayers + 1,
            components: [
                { type: 'layerNorm', name: 'Final Layer Norm' },
                { type: 'output', name: 'Output Projection' }
            ]
        });
    }
    
    // Process input text
    processText(text) {
        // Reset current state
        this.resetState();
        
        // Tokenize input text (simplified)
        this.tokens = this.tokenize(text);
        
        // Generate token embeddings (simplified)
        this.tokenEmbeddings = this.tokens.map((token, index) => {
            return {
                token: token,
                position: index,
                vector: this.generateRandomVector(this.config.model.hiddenSize),
                color: this.config.animation.tokenColors[index % this.config.animation.tokenColors.length]
            };
        });
        
        return {
            tokens: this.tokens,
            tokenEmbeddings: this.tokenEmbeddings
        };
    }
    
    // Simplified tokenization (just splits by space and punctuation)
    tokenize(text) {
        // Replace punctuation with spaces around them for splitting
        const processed = text.replace(/([.,!?;:])/g, ' $1 ');
        // Split by spaces and filter out empty strings
        return processed.split(/\s+/).filter(token => token.length > 0);
    }
    
    // Generate random vector to simulate embeddings
    generateRandomVector(size) {
        const vector = [];
        for (let i = 0; i < size; i++) {
            vector.push((Math.random() * 2 - 1) * 0.1); // Small random values
        }
        return vector;
    }
    
    // Reset the model state
    resetState() {
        this.tokens = [];
        this.tokenEmbeddings = [];
        this.currentState = {
            activeLayer: -1,
            activeComponent: null,
            processingToken: -1,
            attentionWeights: [],
            neuronActivations: []
        };
    }
    
    // Update model configuration
    updateConfig(newConfig) {
        this.config = newConfig;
        this.createLayers(); // Recreate layers with new config
        return this.layers;
    }
    
    // Simulate processing a token through a layer
    processTokenThroughLayer(tokenIndex, layerIndex) {
        console.log("Processing token", tokenIndex, "through layer", layerIndex);
        
        // Update current state
        this.currentState.processingToken = tokenIndex;
        this.currentState.activeLayer = layerIndex;
        
        const layer = this.layers[layerIndex];
        
        // Generate simulated data based on layer type
        if (layer.type === 'embedding') {
            // No attention weights for embedding layer
            this.currentState.attentionWeights = [];
            // Random activations for embedding neurons
            this.currentState.neuronActivations = this.generateRandomActivations(50);
            this.currentState.activeComponent = 'embedding';
        } 
        else if (layer.type === 'transformer') {
            // Set a default component for transformer layers if none is active
            if (!this.currentState.activeComponent || 
                this.currentState.activeComponent === 'embedding' || 
                this.currentState.activeComponent === 'output') {
                this.currentState.activeComponent = 'attention';
            }
            
            // For attention layer, generate attention weights matrix
            if (this.currentState.activeComponent === 'attention') {
                this.currentState.attentionWeights = this.generateAttentionWeights(tokenIndex, this.tokens.length);
            } else {
                this.currentState.attentionWeights = [];
            }
            
            // Generate random neuron activations
            if (this.currentState.activeComponent === 'feedForward') {
                this.currentState.neuronActivations = this.generateRandomActivations(100);
            } else {
                this.currentState.neuronActivations = this.generateRandomActivations(30);
            }
        }
        else if (layer.type === 'output') {
            // No attention weights for output layer
            this.currentState.attentionWeights = [];
            // Random activations for output neurons
            this.currentState.neuronActivations = this.generateRandomActivations(80);
            this.currentState.activeComponent = 'output';
        }
        
        console.log("Updated model state:", JSON.stringify(this.currentState));
        
        return this.currentState;
    }
    
    // Set the active component within the current layer
    setActiveComponent(componentType) {
        console.log("Setting active component to", componentType);
        
        this.currentState.activeComponent = componentType;
        
        // Update state based on component type
        if (componentType === 'attention') {
            this.currentState.attentionWeights = this.generateAttentionWeights(
                this.currentState.processingToken, 
                this.tokens.length
            );
        } else {
            this.currentState.attentionWeights = [];
        }
        
        // Generate appropriate neuron activations
        if (componentType === 'feedForward') {
            this.currentState.neuronActivations = this.generateRandomActivations(100);
        } else if (componentType === 'layerNorm') {
            this.currentState.neuronActivations = this.generateRandomActivations(20);
        } else if (componentType === 'attention') {
            this.currentState.neuronActivations = this.generateRandomActivations(40);
        } else {
            this.currentState.neuronActivations = this.generateRandomActivations(30);
        }
        
        console.log("Updated model state:", JSON.stringify(this.currentState));
        
        return this.currentState;
    }
    
    // Generate simulated attention weights
    generateAttentionWeights(tokenIndex, numTokens) {
        const weights = [];
        
        // Generate weights for each attention head
        for (let h = 0; h < this.config.model.numHeads; h++) {
            const headWeights = [];
            
            // For each token, generate attention to all other tokens
            for (let i = 0; i < numTokens; i++) {
                const tokenWeights = [];
                
                for (let j = 0; j < numTokens; j++) {
                    // Higher weight for current token and nearby tokens
                    let weight = 0.1;
                    
                    // Current token gets more attention
                    if (i === tokenIndex) {
                        weight = j === tokenIndex ? 0.8 : 0.2;
                    }
                    // Nearby tokens get more attention
                    else if (Math.abs(i - j) < 3) {
                        weight = 0.4;
                    }
                    
                    // Add some randomness
                    weight += (Math.random() * 0.3) - 0.15;
                    // Ensure weight is between 0 and 1
                    weight = Math.max(0, Math.min(1, weight));
                    
                    tokenWeights.push(weight);
                }
                
                // Normalize weights to sum to 1
                const sum = tokenWeights.reduce((a, b) => a + b, 0);
                const normalizedWeights = sum > 0 ? 
                    tokenWeights.map(w => w / sum) : 
                    tokenWeights.map(() => 1 / tokenWeights.length);
                
                headWeights.push(normalizedWeights);
            }
            
            weights.push(headWeights);
        }
        
        return weights;
    }
    
    // Generate random neuron activations
    generateRandomActivations(count) {
        const activations = [];
        for (let i = 0; i < count; i++) {
            // Generate value between 0 and 1, with bias toward higher values for active neurons
            activations.push(Math.pow(Math.random(), 2));
        }
        return activations;
    }
    
    // Get the current state of the model
    getCurrentState() {
        return {
            layers: this.layers,
            tokens: this.tokens,
            tokenEmbeddings: this.tokenEmbeddings,
            currentState: this.currentState
        };
    }
}

// Utility function to generate a color gradient for visualization
function getGradientColor(value) {
    // Value should be between 0 and 1
    value = Math.max(0, Math.min(1, value));
    
    // Generate color from blue (low) to red (high)
    const r = Math.floor(value * 255);
    const g = Math.floor((1 - Math.abs(value - 0.5) * 2) * 255);
    const b = Math.floor((1 - value) * 255);
    
    return `rgb(${r}, ${g}, ${b})`;
} 