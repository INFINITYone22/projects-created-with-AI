/**
 * Main entry point for the tectonic plate simulation
 */

let simulation;
let ui;

// Wait for the DOM to be loaded before initializing
document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log('Initializing Tectonic Plate Simulation');
    
    // Create simulation instance
    simulation = new TectonicSimulation();
    
    // Create UI instance
    ui = new UI(simulation);
    
    // Connect earthquake event to UI notification
    const originalOnEarthquake = simulation.onEarthquake;
    simulation.onEarthquake = (earthquake) => {
        // Call original function
        originalOnEarthquake.call(simulation, earthquake);
        
        // Show UI notification
        ui.showEarthquakeNotification(earthquake);
    };
    
    // Start animation loop
    simulation.animate();
    
    // Show help on first load
    setTimeout(() => {
        ui.toggleHelp();
    }, 1000);
}

// Expose simulation and UI to console for debugging
window.simulation = simulation;
window.ui = ui; 