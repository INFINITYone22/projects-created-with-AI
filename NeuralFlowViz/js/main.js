/**
 * Main.js - Application entry point
 * Initializes the LLM model, visualizer, and UI controller
 */

// Global variables
let model;
let visualizer;
let uiController;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
});

// Initialize the application
function initializeApplication() {
    try {
        // Get the canvas container element
        const canvasContainer = document.getElementById('canvas-container');
        if (!canvasContainer) {
            console.error('Canvas container not found');
            return;
        }
        
        // Create the model
        model = new LLMModel(CONFIG);
        
        // Create the visualizer
        visualizer = new LLMVisualizer(model, CONFIG);
        
        // Initialize the visualizer with the canvas container
        visualizer.initialize(canvasContainer);
        
        // Create the UI controller
        uiController = new UIController(model, visualizer, CONFIG);
        
        // Add window resize handler
        window.addEventListener('resize', handleResize);
        
        // Show welcome message
        showWelcomeMessage();
        
        console.log('NeuralFlowViz initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

// Handle window resize
function handleResize() {
    // Debounce resize event
    if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
        // Get the canvas container element
        const canvasContainer = document.getElementById('canvas-container');
        
        // Reinitialize the visualizer
        visualizer.initialize(canvasContainer);
    }, 250);
}

// Show welcome message
function showWelcomeMessage() {
    // Create sample prompts
    const samplePrompts = [
        "The cat sat on the mat.",
        "Language models process text token by token.",
        "Attention is all you need.",
        "Transformers revolutionized natural language processing."
    ];
    
    // Set a random sample prompt
    const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
    document.getElementById('user-prompt').value = randomPrompt;
    
    // Show notification with instructions
    const notification = document.createElement('div');
    notification.className = 'welcome-message';
    notification.innerHTML = `
        <h3>Welcome to NeuralFlowViz!</h3>
        <p>This interactive visualization shows how a Large Language Model processes text.</p>
        <ul>
            <li>Enter a prompt in the text area</li>
            <li>Click "Process Text" to see the animation</li>
            <li>Adjust model parameters using the controls</li>
            <li>Zoom and pan to explore the model</li>
        </ul>
        <p>Click anywhere to dismiss this message.</p>
    `;
    
    // Style the welcome message
    notification.style.position = 'fixed';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.backgroundColor = 'var(--surface-color)';
    notification.style.color = 'var(--text-color)';
    notification.style.padding = '2rem';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    notification.style.zIndex = '1000';
    notification.style.maxWidth = '500px';
    notification.style.textAlign = 'left';
    
    // Add to document first
    document.body.appendChild(notification);
    
    // Now style elements inside the welcome message
    const h3 = notification.querySelector('h3');
    if (h3) {
        h3.style.marginBottom = '1rem';
        h3.style.color = 'var(--primary-color)';
    }
    
    const paragraphs = notification.querySelectorAll('p');
    paragraphs.forEach(p => {
        p.style.marginBottom = '1rem';
    });
    
    const ul = notification.querySelector('ul');
    if (ul) {
        ul.style.marginLeft = '1.5rem';
        ul.style.marginBottom = '1rem';
    }
    
    const listItems = notification.querySelectorAll('ul li');
    listItems.forEach(li => {
        li.style.marginBottom = '0.5rem';
    });
    
    const lastP = notification.querySelector('p:last-child');
    if (lastP) {
        lastP.style.marginTop = '1.5rem';
        lastP.style.textAlign = 'center';
        lastP.style.fontStyle = 'italic';
        lastP.style.opacity = '0.7';
    }
    
    // Remove on click
    notification.addEventListener('click', () => {
        document.body.removeChild(notification);
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 10000);
}

// Handle errors
window.addEventListener('error', (event) => {
    console.error('Runtime error:', event.error);
    
    // Show error notification
    if (uiController) {
        uiController.showNotification('An error occurred. Check console for details.', 'error');
    }
}); 