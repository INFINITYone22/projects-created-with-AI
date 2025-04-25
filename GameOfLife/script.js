// Game of Life Implementation
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const canvas = document.getElementById('grid');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('start');
    const stopBtn = document.getElementById('stop');
    const resetBtn = document.getElementById('reset');
    const randomBtn = document.getElementById('random');
    const speedControl = document.getElementById('speed');
    const generationDisplay = document.getElementById('generation');
    const populationDisplay = document.getElementById('population');

    // Game settings
    const CELL_SIZE = 15;
    const GRID_COLOR = '#ddd';
    const ALIVE_COLOR = '#3498db';
    const DEAD_COLOR = '#fff';
    let ROWS, COLS;
    let grid = [];
    let nextGrid = [];
    let generation = 0;
    let isRunning = false;
    let animationId = null;
    let updateInterval = 1000 / speedControl.value;
    let lastUpdateTime = 0;

    // Initialize the game
    function init() {
        // Set canvas size based on window size
        canvas.width = Math.min(800, window.innerWidth - 40);
        canvas.height = Math.min(600, window.innerHeight - 200);
        
        // Calculate grid dimensions
        ROWS = Math.floor(canvas.height / CELL_SIZE);
        COLS = Math.floor(canvas.width / CELL_SIZE);
        
        // Initialize empty grid
        resetGrid();
        
        // Draw the initial grid
        drawGrid();
        
        // Update stats
        updateStats();
    }

    // Reset the grid to empty
    function resetGrid() {
        grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        nextGrid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        generation = 0;
    }

    // Fill grid with random cells
    function randomizeGrid() {
        grid = Array(ROWS).fill().map(() => 
            Array(COLS).fill().map(() => Math.random() > 0.7 ? 1 : 0)
        );
        nextGrid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        generation = 0;
        drawGrid();
        updateStats();
    }

    // Draw the grid on canvas
    function drawGrid() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw cells
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const x = col * CELL_SIZE;
                const y = row * CELL_SIZE;
                
                // Fill cell
                ctx.fillStyle = grid[row][col] ? ALIVE_COLOR : DEAD_COLOR;
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                
                // Draw cell border
                ctx.strokeStyle = GRID_COLOR;
                ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
            }
        }
    }

    // Count live neighbors for a cell
    function countNeighbors(row, col) {
        let count = 0;
        
        // Check all 8 neighbors (including diagonals)
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                // Skip the cell itself
                if (i === 0 && j === 0) continue;
                
                // Handle edge wrapping (toroidal grid)
                const r = (row + i + ROWS) % ROWS;
                const c = (col + j + COLS) % COLS;
                
                count += grid[r][c];
            }
        }
        
        return count;
    }

    // Apply Conway's Game of Life rules
    function updateGrid() {
        // For each cell, determine its next state based on neighbors
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const neighbors = countNeighbors(row, col);
                const isAlive = grid[row][col] === 1;
                
                // Apply Conway's rules:
                // 1. Any live cell with fewer than two live neighbors dies (underpopulation)
                // 2. Any live cell with two or three live neighbors lives on
                // 3. Any live cell with more than three live neighbors dies (overpopulation)
                // 4. Any dead cell with exactly three live neighbors becomes a live cell (reproduction)
                
                if (isAlive && (neighbors < 2 || neighbors > 3)) {
                    nextGrid[row][col] = 0; // Death
                } else if (!isAlive && neighbors === 3) {
                    nextGrid[row][col] = 1; // Birth
                } else {
                    nextGrid[row][col] = grid[row][col]; // No change
                }
            }
        }
        
        // Copy the next grid to the current grid
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                grid[row][col] = nextGrid[row][col];
            }
        }
        
        generation++;
    }

    // Update statistics display
    function updateStats() {
        generationDisplay.textContent = generation;
        
        // Count live cells
        const population = grid.flat().reduce((sum, cell) => sum + cell, 0);
        populationDisplay.textContent = population;
    }

    // Game loop
    function gameLoop(timestamp) {
        if (!isRunning) return;
        
        // Calculate time elapsed
        const elapsed = timestamp - lastUpdateTime;
        
        // If enough time has passed, update the grid
        if (elapsed > updateInterval) {
            updateGrid();
            drawGrid();
            updateStats();
            lastUpdateTime = timestamp;
        }
        
        // Request next frame
        animationId = requestAnimationFrame(gameLoop);
    }

    // Start simulation
    function startSimulation() {
        if (!isRunning) {
            isRunning = true;
            lastUpdateTime = performance.now();
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    // Stop simulation
    function stopSimulation() {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    // Handle canvas click
    function handleCanvasClick(event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const clickX = (event.clientX - rect.left) * scaleX;
        const clickY = (event.clientY - rect.top) * scaleY;
        
        const col = Math.floor(clickX / CELL_SIZE);
        const row = Math.floor(clickY / CELL_SIZE);
        
        // Toggle cell state
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
            grid[row][col] = grid[row][col] ? 0 : 1;
            drawGrid();
            updateStats();
        }
    }

    // Event listeners
    startBtn.addEventListener('click', startSimulation);
    stopBtn.addEventListener('click', stopSimulation);
    resetBtn.addEventListener('click', () => {
        stopSimulation();
        resetGrid();
        drawGrid();
        updateStats();
    });
    randomBtn.addEventListener('click', () => {
        stopSimulation();
        randomizeGrid();
    });
    canvas.addEventListener('click', handleCanvasClick);
    speedControl.addEventListener('input', () => {
        updateInterval = 1000 / speedControl.value;
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        // Save current state
        const savedGrid = [...grid.map(row => [...row])];
        
        // Reinitialize
        init();
        
        // Restore saved state (as much as fits)
        for (let row = 0; row < Math.min(ROWS, savedGrid.length); row++) {
            for (let col = 0; col < Math.min(COLS, savedGrid[0].length); col++) {
                grid[row][col] = savedGrid[row][col];
            }
        }
        
        // Redraw
        drawGrid();
        updateStats();
    });

    // Initialize the game when the page loads
    init();
}); 