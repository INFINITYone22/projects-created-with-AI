// Forest Fire Simulation
// Cell states: 0 = empty, 1 = tree, 2 = burning, 3 = burned

// Canvas setup
const canvas = document.getElementById('forestCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Simulation parameters
const cellSize = 10;
let cols = Math.floor(canvas.width / cellSize);
let rows = Math.floor(canvas.height / cellSize);
let grid = [];
let nextGrid = [];
let simulationRunning = false;
let animationFrameId = null;
let simulationSpeed = 100; // ms between updates
let lastUpdateTime = 0;

// Control elements
const densitySlider = document.getElementById('density');
const densityValue = document.getElementById('densityValue');
const windDirectionSelect = document.getElementById('windDirection');
const windStrengthSlider = document.getElementById('windStrength');
const windStrengthValue = document.getElementById('windStrengthValue');
const fireSpreadRateSlider = document.getElementById('fireSpreadRate');
const fireSpreadRateValue = document.getElementById('fireSpreadRateValue');
const resetBtn = document.getElementById('resetBtn');
const startFireBtn = document.getElementById('startFireBtn');
const pauseBtn = document.getElementById('pauseBtn');
const treeCountElement = document.getElementById('treeCount');
const burningCountElement = document.getElementById('burningCount');
const burnedCountElement = document.getElementById('burnedCount');

// Wind direction vectors
const windVectors = {
    none: { x: 0, y: 0 },
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 },
    northeast: { x: 1, y: -1 },
    southeast: { x: 1, y: 1 },
    southwest: { x: -1, y: 1 },
    northwest: { x: -1, y: -1 }
};

// Initialize the forest grid
function initializeGrid() {
    grid = [];
    nextGrid = [];
    const density = parseFloat(densitySlider.value);
    
    for (let i = 0; i < rows; i++) {
        grid[i] = [];
        nextGrid[i] = [];
        for (let j = 0; j < cols; j++) {
            // Randomly place trees based on density
            grid[i][j] = Math.random() < density ? 1 : 0;
            nextGrid[i][j] = grid[i][j];
        }
    }
    updateStats();
    drawGrid();
}

// Draw the grid on the canvas
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = j * cellSize;
            const y = i * cellSize;
            
            switch (grid[i][j]) {
                case 0: // Empty
                    ctx.fillStyle = '#264653'; // Dark blue-green
                    break;
                case 1: // Tree
                    ctx.fillStyle = '#2a9d8f'; // Green
                    break;
                case 2: // Burning
                    // Create a gradient for more realistic fire
                    const gradient = ctx.createRadialGradient(
                        x + cellSize/2, y + cellSize/2, 0,
                        x + cellSize/2, y + cellSize/2, cellSize
                    );
                    gradient.addColorStop(0, '#ffba08'); // Yellow center
                    gradient.addColorStop(1, '#e63946'); // Red edge
                    ctx.fillStyle = gradient;
                    break;
                case 3: // Burned
                    ctx.fillStyle = '#6c757d'; // Gray
                    break;
            }
            
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }
}

// Update the simulation for one step
function updateSimulation() {
    const windDirection = windDirectionSelect.value;
    const windStrength = parseInt(windStrengthSlider.value);
    const fireSpreadRate = parseInt(fireSpreadRateSlider.value);
    const windVector = windVectors[windDirection];
    
    // Copy current grid to next grid
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            nextGrid[i][j] = grid[i][j];
            
            // If the cell is burning, it becomes burned
            if (grid[i][j] === 2) {
                nextGrid[i][j] = 3;
            }
            
            // If the cell is a tree, check if it catches fire
            if (grid[i][j] === 1) {
                // Check neighboring cells for fire
                let catchesFire = false;
                
                // Check all 8 neighbors
                for (let di = -1; di <= 1; di++) {
                    for (let dj = -1; dj <= 1; dj++) {
                        if (di === 0 && dj === 0) continue; // Skip self
                        
                        const ni = i + di;
                        const nj = j + dj;
                        
                        // Check if neighbor is within bounds
                        if (ni >= 0 && ni < rows && nj >= 0 && nj < cols) {
                            // Check if neighbor is burning
                            if (grid[ni][nj] === 2) {
                                // Base probability of catching fire
                                let probability = fireSpreadRate / 10;
                                
                                // Adjust probability based on wind direction and strength
                                if (windStrength > 0) {
                                    // Calculate how aligned the neighbor is with the wind direction
                                    const alignment = (di * windVector.x + dj * windVector.y) / 
                                                     (Math.sqrt(di*di + dj*dj) * 
                                                      Math.sqrt(windVector.x*windVector.x + windVector.y*windVector.y) || 1);
                                    
                                    // Increase probability if the neighbor is downwind
                                    if (alignment > 0) {
                                        probability *= (1 + alignment * windStrength / 5);
                                    }
                                }
                                
                                // Determine if the tree catches fire
                                if (Math.random() < probability) {
                                    catchesFire = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (catchesFire) break;
                }
                
                if (catchesFire) {
                    nextGrid[i][j] = 2; // Tree catches fire
                }
            }
        }
    }
    
    // Update grid
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            grid[i][j] = nextGrid[i][j];
        }
    }
    
    updateStats();
    drawGrid();
}

// Start a fire at random locations
function startFire() {
    if (!simulationRunning) {
        toggleSimulation();
    }
    
    // Start fires at random locations (1-3 spots)
    const numFires = Math.floor(Math.random() * 3) + 1;
    for (let f = 0; f < numFires; f++) {
        let fireStarted = false;
        
        // Try to find a tree to set on fire
        for (let attempts = 0; attempts < 100 && !fireStarted; attempts++) {
            const i = Math.floor(Math.random() * rows);
            const j = Math.floor(Math.random() * cols);
            
            if (grid[i][j] === 1) { // If it's a tree
                grid[i][j] = 2; // Set it on fire
                fireStarted = true;
            }
        }
    }
    
    updateStats();
    drawGrid();
}

// Toggle simulation running state
function toggleSimulation() {
    simulationRunning = !simulationRunning;
    
    if (simulationRunning) {
        pauseBtn.textContent = "Pause";
        animate();
    } else {
        pauseBtn.textContent = "Resume";
        cancelAnimationFrame(animationFrameId);
    }
}

// Animation loop
function animate(timestamp) {
    animationFrameId = requestAnimationFrame(animate);
    
    if (!lastUpdateTime) lastUpdateTime = timestamp;
    
    const elapsed = timestamp - lastUpdateTime;
    
    if (elapsed > simulationSpeed) {
        updateSimulation();
        lastUpdateTime = timestamp;
    }
}

// Update statistics display
function updateStats() {
    let trees = 0;
    let burning = 0;
    let burned = 0;
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            switch (grid[i][j]) {
                case 1: trees++; break;
                case 2: burning++; break;
                case 3: burned++; break;
            }
        }
    }
    
    treeCountElement.textContent = trees;
    burningCountElement.textContent = burning;
    burnedCountElement.textContent = burned;
    
    // Auto-pause if fire is out
    if (simulationRunning && burning === 0 && burned > 0) {
        toggleSimulation();
    }
}

// Event listeners for controls
densitySlider.addEventListener('input', function() {
    densityValue.textContent = `${Math.round(this.value * 100)}%`;
});

windStrengthSlider.addEventListener('input', function() {
    windStrengthValue.textContent = this.value;
});

fireSpreadRateSlider.addEventListener('input', function() {
    fireSpreadRateValue.textContent = this.value;
});

resetBtn.addEventListener('click', initializeGrid);
startFireBtn.addEventListener('click', startFire);
pauseBtn.addEventListener('click', toggleSimulation);

// Allow clicking on the canvas to manually start fires
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const j = Math.floor(x / cellSize);
    const i = Math.floor(y / cellSize);
    
    if (i >= 0 && i < rows && j >= 0 && j < cols) {
        if (grid[i][j] === 1) { // If it's a tree
            grid[i][j] = 2; // Set it on fire
            
            if (!simulationRunning) {
                toggleSimulation();
            }
            
            updateStats();
            drawGrid();
        }
    }
});

// Initialize the simulation
initializeGrid(); 