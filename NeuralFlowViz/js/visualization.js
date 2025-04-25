/**
 * Visualization.js - Handles the p5.js rendering of the LLM model
 * This file contains the classes and functions for visualizing the model components
 */

class LLMVisualizer {
    constructor(model, config) {
        this.model = model;
        this.config = config;
        this.p5Instance = null;
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.tooltipActive = false;
        this.tooltipText = '';
        this.tooltipX = 0;
        this.tooltipY = 0;
        this.animationQueue = [];
        this.isAnimating = false;
        this.currentAnimationStep = 0;
        this.animationStarted = false;
        
        // Component positions (will be calculated during setup)
        this.componentPositions = [];
    }
    
    // Initialize the p5 sketch
    initialize(containerElement) {
        const sketch = (p) => {
            p.setup = () => this.setup(p, containerElement);
            p.draw = () => this.draw(p);
            p.mousePressed = () => this.mousePressed(p);
            p.mouseMoved = () => this.mouseMoved(p);
            p.mouseWheel = (event) => this.mouseWheel(p, event);
        };
        
        this.p5Instance = new p5(sketch);
    }
    
    // Setup function for p5
    setup(p, containerElement) {
        // Get container dimensions
        const rect = containerElement.getBoundingClientRect();
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
        
        // Create canvas
        const canvas = p.createCanvas(this.canvasWidth, this.canvasHeight);
        canvas.parent(containerElement);
        
        // Update config with canvas dimensions
        this.config.canvas.width = this.canvasWidth;
        this.config.canvas.height = this.canvasHeight;
        
        // Calculate component positions
        this.calculateComponentPositions();
        
        // Set text properties
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
    }
    
    // Calculate positions for all model components
    calculateComponentPositions() {
        this.componentPositions = [];
        
        const layers = this.model.layers;
        const padding = this.config.canvas.padding;
        const layerSpacing = (this.canvasWidth - padding * 2) / (layers.length + 1);
        
        // Calculate positions for each layer
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            const x = padding + layerSpacing * (i + 1);
            const y = this.canvasHeight / 2;
            
            const layerComponents = [];
            
            // Calculate positions for components within the layer
            if (layer.type === 'embedding') {
                // Embedding layer has token and position embeddings
                const embedWidth = this.config.visualization.embeddings.width;
                const embedHeight = this.config.visualization.embeddings.height;
                const spacing = this.config.visualization.embeddings.spacing;
                
                layerComponents.push({
                    type: 'tokenEmbedding',
                    x: x,
                    y: y - spacing / 2,
                    width: embedWidth,
                    height: embedHeight,
                    color: this.config.visualization.colors.tokenEmbedding
                });
                
                layerComponents.push({
                    type: 'positionEmbedding',
                    x: x,
                    y: y + spacing / 2 + embedHeight,
                    width: embedWidth,
                    height: embedHeight,
                    color: this.config.visualization.colors.positionEmbedding
                });
            } 
            else if (layer.type === 'transformer') {
                // Transformer layer components
                const components = layer.components;
                const totalHeight = components.length * 100; // Approximate height
                let currentY = y - totalHeight / 2;
                
                for (let j = 0; j < components.length; j++) {
                    const component = components[j];
                    let compWidth, compHeight;
                    
                    if (component.type === 'attention') {
                        compWidth = this.config.visualization.attention.width;
                        compHeight = this.config.visualization.attention.height;
                    } 
                    else if (component.type === 'feedForward') {
                        compWidth = this.config.visualization.feedForward.width;
                        compHeight = this.config.visualization.feedForward.height;
                    } 
                    else if (component.type === 'layerNorm') {
                        compWidth = this.config.visualization.layerNorm.width;
                        compHeight = this.config.visualization.layerNorm.height;
                    } 
                    else {
                        // Residual connections
                        compWidth = 40;
                        compHeight = 40;
                    }
                    
                    layerComponents.push({
                        type: component.type,
                        name: component.name,
                        x: x,
                        y: currentY + compHeight / 2,
                        width: compWidth,
                        height: compHeight,
                        color: this.config.visualization.colors[component.type] || '#ffffff'
                    });
                    
                    currentY += compHeight + 20; // Add spacing between components
                }
            } 
            else if (layer.type === 'output') {
                // Output layer
                layerComponents.push({
                    type: 'output',
                    x: x,
                    y: y,
                    width: 120,
                    height: 180,
                    color: this.config.visualization.colors.feedForward
                });
            }
            
            this.componentPositions.push({
                layerIndex: i,
                x: x,
                y: y,
                components: layerComponents
            });
        }
    }
    
    // Main draw function
    draw(p) {
        // Clear background
        p.background(this.config.canvas.backgroundColor);
        
        // Apply view transformations
        p.push();
        p.translate(this.config.view.offsetX, this.config.view.offsetY);
        p.scale(this.config.view.scale);
        
        // Draw connections between layers
        this.drawConnections(p);
        
        // Draw each layer
        for (let i = 0; i < this.componentPositions.length; i++) {
            const layerPos = this.componentPositions[i];
            
            // Draw layer components
            for (let j = 0; j < layerPos.components.length; j++) {
                const component = layerPos.components[j];
                this.drawComponent(p, component, i, j);
            }
            
            // Draw layer label
            p.fill(255);
            p.noStroke();
            p.textSize(16);
            p.text(`Layer ${i}`, layerPos.x, 50);
        }
        
        // Draw tokens if processing
        if (this.model.tokens.length > 0) {
            this.drawTokens(p);
        }
        
        // Draw attention weights if active
        if (this.model.currentState.attentionWeights.length > 0 && 
            this.config.visualization.showAttentionMaps) {
            this.drawAttentionWeights(p);
        }
        
        // Draw neuron activations if active
        if (this.model.currentState.neuronActivations.length > 0 && 
            this.config.visualization.showNeuronActivations) {
            this.drawNeuronActivations(p);
        }
        
        p.pop();
        
        // Draw tooltip if active
        if (this.tooltipActive && this.config.visualization.showTooltips) {
            this.drawTooltip(p);
        }
        
        // Only start the animation if it's not already running
        if (this.isAnimating && this.animationQueue.length > 0 && !this.animationStarted) {
            console.log("Starting animation from draw");
            this.animationStarted = true;
            this.processAnimation();
        }
    }
    
    // Draw connections between layers
    drawConnections(p) {
        p.stroke(this.config.visualization.colors.connections);
        p.strokeWeight(1);
        
        for (let i = 0; i < this.componentPositions.length - 1; i++) {
            const currentLayer = this.componentPositions[i];
            const nextLayer = this.componentPositions[i + 1];
            
            // Get last component of current layer and first of next layer
            const lastComp = currentLayer.components[currentLayer.components.length - 1];
            const firstComp = nextLayer.components[0];
            
            // Draw connection line
            p.line(
                lastComp.x + lastComp.width / 2, 
                lastComp.y,
                firstComp.x - firstComp.width / 2, 
                firstComp.y
            );
        }
    }
    
    // Draw a single component
    drawComponent(p, component, layerIndex, componentIndex) {
        const isActive = layerIndex === this.model.currentState.activeLayer && 
                        component.type === this.model.currentState.activeComponent;
        
        // Set fill color based on active state
        if (isActive) {
            p.fill(p.color(component.color));
            p.stroke(255);
            p.strokeWeight(3);
        } else {
            p.fill(p.color(component.color));
            p.stroke(100);
            p.strokeWeight(1);
        }
        
        // Draw component shape
        if (component.type === 'attention') {
            this.drawAttentionComponent(p, component);
        } 
        else if (component.type === 'residual') {
            this.drawResidualComponent(p, component);
        } 
        else {
            // Default rectangular component
            p.rect(
                component.x - component.width / 2,
                component.y - component.height / 2,
                component.width,
                component.height,
                8 // Rounded corners
            );
        }
        
        // Draw component label
        p.fill(255);
        p.noStroke();
        p.textSize(12);
        p.text(
            component.name || component.type,
            component.x,
            component.y + component.height / 2 + 20
        );
    }
    
    // Draw attention component with multiple heads
    drawAttentionComponent(p, component) {
        const headSize = this.config.visualization.attention.headSize;
        const headSpacing = this.config.visualization.attention.headSpacing;
        const numHeads = this.model.config.model.numHeads;
        
        // Calculate grid dimensions
        const cols = Math.ceil(Math.sqrt(numHeads));
        const rows = Math.ceil(numHeads / cols);
        
        const totalWidth = cols * headSize + (cols - 1) * headSpacing;
        const totalHeight = rows * headSize + (rows - 1) * headSpacing;
        
        // Draw container
        p.rect(
            component.x - component.width / 2,
            component.y - component.height / 2,
            component.width,
            component.height,
            8
        );
        
        // Draw attention heads
        let headIndex = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (headIndex < numHeads) {
                    const headX = component.x - totalWidth / 2 + col * (headSize + headSpacing) + headSize / 2;
                    const headY = component.y - totalHeight / 2 + row * (headSize + headSpacing) + headSize / 2;
                    
                    p.fill(p.color(component.color));
                    p.stroke(200);
                    p.strokeWeight(1);
                    p.ellipse(headX, headY, headSize, headSize);
                    
                    headIndex++;
                }
            }
        }
    }
    
    // Draw residual connection component
    drawResidualComponent(p, component) {
        p.stroke(p.color(component.color));
        p.strokeWeight(3);
        p.noFill();
        
        // Draw curved line to represent residual connection
        p.beginShape();
        p.vertex(component.x - component.width, component.y - component.height / 2);
        p.bezierVertex(
            component.x - component.width / 2, component.y - component.height / 2,
            component.x - component.width / 2, component.y + component.height / 2,
            component.x, component.y + component.height / 2
        );
        p.endShape();
        
        // Draw plus symbol
        p.stroke(255);
        p.strokeWeight(2);
        p.line(component.x - 10, component.y, component.x + 10, component.y);
        p.line(component.x, component.y - 10, component.x, component.y + 10);
    }
    
    // Draw tokens
    drawTokens(p) {
        const tokens = this.model.tokens;
        const activeToken = this.model.currentState.processingToken;
        
        // Calculate token positions
        const tokenWidth = 80;
        const tokenHeight = 40;
        const tokenSpacing = 20;
        const totalWidth = tokens.length * (tokenWidth + tokenSpacing) - tokenSpacing;
        const startX = this.canvasWidth / 2 - totalWidth / 2;
        const tokenY = 120;
        
        // Draw each token
        for (let i = 0; i < tokens.length; i++) {
            const tokenX = startX + i * (tokenWidth + tokenSpacing) + tokenWidth / 2;
            const isActive = i === activeToken;
            
            // Set token style
            if (isActive) {
                p.fill(this.model.tokenEmbeddings[i].color);
                p.stroke(255);
                p.strokeWeight(3);
            } else {
                p.fill(p.color(this.model.tokenEmbeddings[i].color));
                p.stroke(150);
                p.strokeWeight(1);
                p.fill(p.color(this.model.tokenEmbeddings[i].color + '80')); // Add transparency
            }
            
            // Draw token box
            p.rect(
                tokenX - tokenWidth / 2,
                tokenY - tokenHeight / 2,
                tokenWidth,
                tokenHeight,
                8
            );
            
            // Draw token text
            p.fill(255);
            p.noStroke();
            p.textSize(14);
            p.text(tokens[i], tokenX, tokenY);
            
            // Draw position index
            p.textSize(10);
            p.text(`[${i}]`, tokenX, tokenY + tokenHeight / 2 + 15);
        }
    }
    
    // Draw attention weights visualization
    drawAttentionWeights(p) {
        const attentionWeights = this.model.currentState.attentionWeights;
        if (attentionWeights.length === 0) return;
        
        const tokens = this.model.tokens;
        const activeToken = this.model.currentState.processingToken;
        const activeLayer = this.model.currentState.activeLayer;
        
        // Find the attention component in the active layer
        let attentionComponent = null;
        for (const comp of this.componentPositions[activeLayer].components) {
            if (comp.type === 'attention') {
                attentionComponent = comp;
                break;
            }
        }
        
        if (!attentionComponent) return;
        
        // Calculate attention map position
        const mapSize = 180;
        const mapX = attentionComponent.x + attentionComponent.width / 2 + 50;
        const mapY = attentionComponent.y;
        
        // Draw attention map background
        p.fill(40);
        p.stroke(100);
        p.strokeWeight(1);
        p.rect(mapX - mapSize / 2, mapY - mapSize / 2, mapSize, mapSize);
        
        // Draw attention weights for the active token
        const cellSize = mapSize / tokens.length;
        
        // Use the first attention head for simplicity
        // In a more complex visualization, you could add UI to select different heads
        const headIndex = 0;
        if (!attentionWeights[headIndex] || !attentionWeights[headIndex][activeToken]) {
            return;
        }
        const tokenWeights = attentionWeights[headIndex][activeToken];
        
        for (let i = 0; i < tokens.length; i++) {
            const weight = tokenWeights[i];
            const cellX = mapX - mapSize / 2 + i * cellSize;
            const cellY = mapY - mapSize / 2;
            
            // Color based on weight
            p.fill(p.color(getGradientColor(weight)));
            p.noStroke();
            p.rect(cellX, cellY, cellSize, cellSize);
            
            // Draw token label on the side
            if (i === 0) {
                p.fill(255);
                p.textSize(10);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text("Attention from:", cellX - 5, cellY - 10);
                p.textAlign(p.CENTER, p.CENTER);
            }
        }
        
        // Draw labels
        p.fill(255);
        p.textSize(12);
        p.text("Attention Weights", mapX, mapY - mapSize / 2 - 15);
        
        // Draw token labels
        p.textSize(10);
        for (let i = 0; i < tokens.length; i++) {
            const cellX = mapX - mapSize / 2 + i * cellSize + cellSize / 2;
            const cellY = mapY + mapSize / 2 + 15;
            
            p.push();
            p.translate(cellX, cellY);
            p.rotate(p.PI / 4);
            p.text(tokens[i], 0, 0);
            p.pop();
        }
    }
    
    // Draw neuron activations
    drawNeuronActivations(p) {
        const activations = this.model.currentState.neuronActivations;
        if (activations.length === 0) return;
        
        const activeLayer = this.model.currentState.activeLayer;
        const activeComponent = this.model.currentState.activeComponent;
        
        // Find the active component
        let component = null;
        for (const comp of this.componentPositions[activeLayer].components) {
            if (comp.type === activeComponent) {
                component = comp;
                break;
            }
        }
        
        if (!component) return;
        
        // Calculate neuron visualization position
        const neuronWidth = 200;
        const neuronHeight = 150;
        const neuronX = component.x - component.width / 2 - 50;
        const neuronY = component.y;
        
        // Draw neuron visualization background
        p.fill(40);
        p.stroke(100);
        p.strokeWeight(1);
        p.rect(neuronX - neuronWidth / 2, neuronY - neuronHeight / 2, neuronWidth, neuronHeight);
        
        // Draw neurons
        const maxNeurons = Math.min(activations.length, 100); // Limit to 100 neurons
        const rows = 10;
        const cols = Math.ceil(maxNeurons / rows);
        const neuronSize = 8;
        const spacing = 12;
        
        for (let i = 0; i < maxNeurons; i++) {
            const row = i % rows;
            const col = Math.floor(i / rows);
            
            const x = neuronX - neuronWidth / 2 + 20 + col * spacing;
            const y = neuronY - neuronHeight / 2 + 20 + row * spacing;
            
            // Color based on activation
            const activation = activations[i];
            p.fill(p.color(getGradientColor(activation)));
            p.noStroke();
            p.ellipse(x, y, neuronSize, neuronSize);
        }
        
        // Draw label
        p.fill(255);
        p.textSize(12);
        p.text("Neuron Activations", neuronX, neuronY - neuronHeight / 2 - 15);
    }
    
    // Draw tooltip
    drawTooltip(p) {
        const x = this.tooltipX;
        const y = this.tooltipY;
        const padding = 10;
        const lineHeight = 20;
        
        // Calculate text dimensions
        p.textSize(14);
        const lines = this.tooltipText.split('\n');
        const textWidth = Math.max(...lines.map(line => p.textWidth(line)));
        const textHeight = lines.length * lineHeight;
        
        // Draw tooltip background
        p.fill(0, 200);
        p.stroke(100);
        p.strokeWeight(1);
        p.rect(x, y, textWidth + padding * 2, textHeight + padding * 2, 5);
        
        // Draw tooltip text
        p.fill(255);
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        
        for (let i = 0; i < lines.length; i++) {
            p.text(lines[i], x + padding, y + padding + i * lineHeight);
        }
        
        // Reset text alignment
        p.textAlign(p.CENTER, p.CENTER);
    }
    
    // Handle mouse press events
    mousePressed(p) {
        const mouseX = (p.mouseX - this.config.view.offsetX) / this.config.view.scale;
        const mouseY = (p.mouseY - this.config.view.offsetY) / this.config.view.scale;
        
        // Check if a component was clicked
        for (let i = 0; i < this.componentPositions.length; i++) {
            const layerPos = this.componentPositions[i];
            
            for (let j = 0; j < layerPos.components.length; j++) {
                const component = layerPos.components[j];
                
                // Check if mouse is over this component
                if (mouseX > component.x - component.width / 2 &&
                    mouseX < component.x + component.width / 2 &&
                    mouseY > component.y - component.height / 2 &&
                    mouseY < component.y + component.height / 2) {
                    
                    // Set this component as active
                    this.model.currentState.activeLayer = i;
                    this.model.currentState.activeComponent = component.type;
                    
                    // Update model state
                    this.model.setActiveComponent(component.type);
                    
                    return;
                }
            }
        }
    }
    
    // Handle mouse move events
    mouseMoved(p) {
        const mouseX = (p.mouseX - this.config.view.offsetX) / this.config.view.scale;
        const mouseY = (p.mouseY - this.config.view.offsetY) / this.config.view.scale;
        
        // Check if mouse is over a component for tooltip
        this.tooltipActive = false;
        
        for (let i = 0; i < this.componentPositions.length; i++) {
            const layerPos = this.componentPositions[i];
            
            for (let j = 0; j < layerPos.components.length; j++) {
                const component = layerPos.components[j];
                
                // Check if mouse is over this component
                if (mouseX > component.x - component.width / 2 &&
                    mouseX < component.x + component.width / 2 &&
                    mouseY > component.y - component.height / 2 &&
                    mouseY < component.y + component.height / 2) {
                    
                    // Show tooltip for this component
                    this.tooltipActive = true;
                    this.tooltipX = p.mouseX + 20;
                    this.tooltipY = p.mouseY + 20;
                    
                    // Get tooltip text based on component type
                    this.tooltipText = this.getTooltipText(component.type);
                    
                    return;
                }
            }
        }
    }
    
    // Handle mouse wheel events for zooming
    mouseWheel(p, event) {
        // Calculate zoom factor
        const zoomFactor = event.delta > 0 ? 
            1 - this.config.view.zoomStep : 
            1 + this.config.view.zoomStep;
        
        // Apply zoom
        const newScale = this.config.view.scale * zoomFactor;
        
        // Constrain scale to min/max values
        if (newScale >= this.config.view.minScale && newScale <= this.config.view.maxScale) {
            // Calculate zoom center (mouse position)
            const mouseX = p.mouseX;
            const mouseY = p.mouseY;
            
            // Adjust offset to zoom toward mouse position
            this.config.view.offsetX = mouseX - (mouseX - this.config.view.offsetX) * zoomFactor;
            this.config.view.offsetY = mouseY - (mouseY - this.config.view.offsetY) * zoomFactor;
            
            // Update scale
            this.config.view.scale = newScale;
        }
        
        // Prevent default scrolling
        return false;
    }
    
    // Get tooltip text for a component type
    getTooltipText(componentType) {
        switch (componentType) {
            case 'tokenEmbedding':
            case 'positionEmbedding':
                return this.config.tooltips.embeddings;
            case 'attention':
                return this.config.tooltips.multiHeadAttention;
            case 'feedForward':
                return this.config.tooltips.feedForward;
            case 'layerNorm':
                return this.config.tooltips.layerNorm;
            case 'residual':
                return this.config.tooltips.residualConnection;
            default:
                return `${componentType} component`;
        }
    }
    
    // Start animation sequence
    startAnimation(text) {
        console.log("Starting animation with text:", text);
        
        // Process the text through the model
        const result = this.model.processText(text);
        console.log("Processed text result:", result);
        
        // Reset animation state
        this.animationQueue = [];
        this.currentAnimationStep = 0;
        this.animationStarted = false;
        
        // Create animation sequence
        this.createAnimationSequence(result.tokens);
        console.log("Animation queue created:", this.animationQueue);
        
        // Start animation
        this.isAnimating = true;
    }
    
    // Create animation sequence
    createAnimationSequence(tokens) {
        console.log("Creating animation sequence for tokens:", tokens);
        
        // For each token
        for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
            // For each layer
            for (let layerIndex = 0; layerIndex < this.model.layers.length; layerIndex++) {
                const layer = this.model.layers[layerIndex];
                
                // Add step to process token through layer
                this.animationQueue.push({
                    type: 'processLayer',
                    tokenIndex: tokenIndex,
                    layerIndex: layerIndex
                });
                
                // For transformer layers, add steps for each component
                if (layer.type === 'transformer') {
                    for (let compIndex = 0; compIndex < layer.components.length; compIndex++) {
                        const component = layer.components[compIndex];
                        
                        this.animationQueue.push({
                            type: 'processComponent',
                            tokenIndex: tokenIndex,
                            layerIndex: layerIndex,
                            componentType: component.type
                        });
                    }
                }
            }
        }
        
        // Add final step to reset
        this.animationQueue.push({
            type: 'reset'
        });
    }
    
    // Process current animation step
    processAnimation() {
        console.log("Processing animation step:", this.currentAnimationStep, "of", this.animationQueue.length);
        
        if (this.currentAnimationStep >= this.animationQueue.length) {
            console.log("Animation complete");
            this.isAnimating = false;
            return;
        }
        
        const step = this.animationQueue[this.currentAnimationStep];
        console.log("Current step:", step);
        
        if (step.type === 'processLayer') {
            this.model.processTokenThroughLayer(step.tokenIndex, step.layerIndex);
        } 
        else if (step.type === 'processComponent') {
            this.model.setActiveComponent(step.componentType);
        } 
        else if (step.type === 'reset') {
            this.model.resetState();
        }
        
        // Move to next step after delay
        setTimeout(() => {
            this.currentAnimationStep++;
            // Continue the animation by calling processAnimation again
            if (this.isAnimating) {
                this.processAnimation();
            }
        }, this.config.animation.tokenProcessingTime / Math.max(0.1, this.config.animation.speed));
    }
    
    // Reset the visualization
    reset() {
        console.log("Resetting visualization");
        this.model.resetState();
        this.isAnimating = false;
        this.animationQueue = [];
        this.currentAnimationStep = 0;
        this.animationStarted = false;
    }
    
    // Update the visualization with new config
    updateConfig(newConfig) {
        this.config = newConfig;
        this.calculateComponentPositions();
    }
    
    // Pan the view
    panView(deltaX, deltaY) {
        this.config.view.offsetX += deltaX;
        this.config.view.offsetY += deltaY;
    }
    
    // Reset the view
    resetView() {
        this.config.view.scale = 1;
        this.config.view.offsetX = 0;
        this.config.view.offsetY = 0;
    }
} 