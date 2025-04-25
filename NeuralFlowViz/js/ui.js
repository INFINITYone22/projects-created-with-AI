/**
 * UI.js - Handles user interface interactions
 * This file contains event handlers and UI-related functionality
 */

class UIController {
    constructor(model, visualizer, config) {
        this.model = model;
        this.visualizer = visualizer;
        this.config = config;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Initialize UI
        this.initializeEventListeners();
        this.updateValueDisplays();
    }
    
    // Set up event listeners for UI controls
    initializeEventListeners() {
        // Process button
        document.getElementById('process-btn').addEventListener('click', () => {
            this.processUserInput();
        });
        
        // Apply configuration button
        document.getElementById('apply-config').addEventListener('click', () => {
            this.applyConfiguration();
        });
        
        // View control buttons
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.zoomIn();
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            this.zoomOut();
        });
        
        document.getElementById('reset-view').addEventListener('click', () => {
            this.resetView();
        });
        
        // Slider value displays
        document.getElementById('num-layers').addEventListener('input', (e) => {
            this.updateSliderDisplay(e.target, 0);
        });
        
        document.getElementById('num-heads').addEventListener('input', (e) => {
            this.updateSliderDisplay(e.target, 1);
        });
        
        document.getElementById('animation-speed').addEventListener('input', (e) => {
            this.updateSliderDisplay(e.target, 2);
        });
        
        // Checkbox controls
        document.getElementById('show-attention').addEventListener('change', (e) => {
            this.config.visualization.showAttentionMaps = e.target.checked;
        });
        
        document.getElementById('show-activations').addEventListener('change', (e) => {
            this.config.visualization.showNeuronActivations = e.target.checked;
        });
        
        document.getElementById('show-tooltips').addEventListener('change', (e) => {
            this.config.visualization.showTooltips = e.target.checked;
        });
        
        // Modal controls
        document.getElementById('about-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showModal();
        });
        
        document.querySelector('.close-btn').addEventListener('click', () => {
            this.hideModal();
        });
        
        // Canvas drag for panning
        const canvasContainer = document.getElementById('canvas-container');
        
        canvasContainer.addEventListener('mousedown', (e) => {
            this.startDrag(e.clientX, e.clientY);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.drag(e.clientX, e.clientY);
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.endDrag();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Enter key in textarea
        document.getElementById('user-prompt').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.processUserInput();
            }
        });
    }
    
    // Process the user's input text
    processUserInput() {
        console.log("Processing user input");
        
        const userPrompt = document.getElementById('user-prompt').value.trim();
        console.log("User prompt:", userPrompt);
        
        if (userPrompt.length === 0) {
            this.showNotification('Please enter some text to process', 'error');
            return;
        }
        
        // Reset the visualizer first
        this.visualizer.reset();
        
        // Start the animation with the user's text
        this.visualizer.startAnimation(userPrompt);
        
        // Show notification
        this.showNotification('Processing text...', 'success');
    }
    
    // Apply the current configuration
    applyConfiguration() {
        // Update config based on UI controls
        const updatedConfig = updateConfig();
        this.config = updatedConfig;
        
        // Update model with new config
        this.model.updateConfig(this.config);
        
        // Update visualizer with new config
        this.visualizer.updateConfig(this.config);
        
        // Show notification
        this.showNotification('Configuration applied', 'success');
    }
    
    // Update slider value displays
    updateSliderDisplay(slider, index) {
        const displays = document.querySelectorAll('.value-display');
        if (displays[index]) {
            displays[index].textContent = slider.value;
        }
    }
    
    // Update all value displays
    updateValueDisplays() {
        const numLayers = document.getElementById('num-layers');
        const numHeads = document.getElementById('num-heads');
        const animationSpeed = document.getElementById('animation-speed');
        
        this.updateSliderDisplay(numLayers, 0);
        this.updateSliderDisplay(numHeads, 1);
        this.updateSliderDisplay(animationSpeed, 2);
    }
    
    // Show the about modal
    showModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('hidden');
    }
    
    // Hide the about modal
    hideModal() {
        const modal = document.getElementById('modal');
        modal.classList.add('hidden');
    }
    
    // Show a notification message
    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification hidden';
            document.body.appendChild(notification);
            
            // Add styles
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '4px';
            notification.style.color = 'white';
            notification.style.fontWeight = 'bold';
            notification.style.zIndex = '1000';
            notification.style.transition = 'opacity 0.3s';
        }
        
        // Set type-specific styles
        if (type === 'error') {
            notification.style.backgroundColor = 'var(--error-color)';
        } else if (type === 'success') {
            notification.style.backgroundColor = 'var(--success-color)';
        } else {
            notification.style.backgroundColor = 'var(--primary-color)';
        }
        
        // Set message and show
        notification.textContent = message;
        notification.classList.remove('hidden');
        
        // Hide after delay
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
    
    // Start dragging (for panning)
    startDrag(x, y) {
        this.isDragging = true;
        this.lastMouseX = x;
        this.lastMouseY = y;
        
        // Change cursor
        document.body.style.cursor = 'grabbing';
    }
    
    // Handle drag movement
    drag(x, y) {
        if (!this.isDragging) return;
        
        const deltaX = x - this.lastMouseX;
        const deltaY = y - this.lastMouseY;
        
        // Pan the view
        this.visualizer.panView(deltaX, deltaY);
        
        // Update last position
        this.lastMouseX = x;
        this.lastMouseY = y;
    }
    
    // End dragging
    endDrag() {
        this.isDragging = false;
        
        // Reset cursor
        document.body.style.cursor = 'default';
    }
    
    // Handle keyboard shortcuts
    handleKeyPress(e) {
        // Ctrl + Enter to process text
        if (e.key === 'Enter' && e.ctrlKey) {
            this.processUserInput();
        }
        
        // Escape to close modal
        if (e.key === 'Escape') {
            this.hideModal();
        }
        
        // + to zoom in
        if (e.key === '+' || e.key === '=') {
            this.zoomIn();
        }
        
        // - to zoom out
        if (e.key === '-' || e.key === '_') {
            this.zoomOut();
        }
        
        // 0 to reset view
        if (e.key === '0') {
            this.resetView();
        }
    }
    
    // Zoom in
    zoomIn() {
        const newScale = this.config.view.scale + this.config.view.zoomStep;
        if (newScale <= this.config.view.maxScale) {
            this.config.view.scale = newScale;
        }
    }
    
    // Zoom out
    zoomOut() {
        const newScale = this.config.view.scale - this.config.view.zoomStep;
        if (newScale >= this.config.view.minScale) {
            this.config.view.scale = newScale;
        }
    }
    
    // Reset view
    resetView() {
        this.visualizer.resetView();
    }
} 