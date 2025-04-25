/**
 * UI class for managing user interface elements and interactions
 */
class UI {
    constructor(simulation) {
        this.simulation = simulation;
        this.gui = null;
        
        // UI state
        this.isFullscreen = false;
        this.showHelp = false;
        this.showStats = true;
        
        // Initialize UI controls
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize lil-gui for settings
        this.setupGUI();
        
        // Create tooltip for information
        this.createTooltip();
        
        // Create help panel
        this.createHelpPanel();
    }
    
    setupEventListeners() {
        // Add event listeners to buttons
        const toggleButton = document.getElementById('toggle-simulation');
        toggleButton.addEventListener('click', () => {
            const isPaused = this.simulation.togglePause();
            toggleButton.textContent = isPaused ? 'Resume' : 'Pause';
        });
        
        const resetButton = document.getElementById('reset-simulation');
        resetButton.addEventListener('click', () => {
            this.simulation.reset();
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case ' ':
                    // Space to toggle pause
                    this.simulation.togglePause();
                    break;
                case 'r':
                    // R to reset
                    this.simulation.reset();
                    break;
                case 'h':
                    // H to toggle help
                    this.toggleHelp();
                    break;
                case 'f':
                    // F to toggle fullscreen
                    this.toggleFullscreen();
                    break;
            }
        });
    }
    
    setupGUI() {
        // Create GUI panel for advanced settings
        this.gui = new lil.GUI({ autoPlace: true });
        this.gui.title('Simulation Settings');
        
        // Simulation parameters
        const simFolder = this.gui.addFolder('Simulation');
        
        simFolder.add(this.simulation, 'timeScale', 0.1, 5.0, 0.1)
            .name('Time Scale')
            .onChange((value) => {
                this.simulation.setTimeScale(value);
            });
        
        // Visual parameters
        const visualFolder = this.gui.addFolder('Visuals');
        
        const visualParams = {
            showPlates: true,
            showFaults: true,
            showGrid: true,
            cameraShake: true
        };
        
        visualFolder.add(visualParams, 'showPlates')
            .name('Show Plates')
            .onChange((value) => {
                for (const plate of this.simulation.plates) {
                    plate.mesh.visible = value;
                    plate.edges.visible = value;
                }
            });
        
        visualFolder.add(visualParams, 'showFaults')
            .name('Show Faults')
            .onChange((value) => {
                for (const fault of this.simulation.faults) {
                    fault.lineSegments.visible = value;
                }
            });
        
        visualFolder.addColor(this.simulation.scene, 'background')
            .name('Background');
        
        // Camera settings
        const cameraFolder = this.gui.addFolder('Camera');
        
        const cameraParams = {
            reset: () => {
                this.simulation.camera.position.set(0, 30, 30);
                this.simulation.camera.lookAt(0, 0, 0);
            }
        };
        
        cameraFolder.add(cameraParams, 'reset')
            .name('Reset Camera');
        
        cameraFolder.add(this.simulation.controls, 'autoRotate')
            .name('Auto Rotate');
        
        // Close folders by default
        simFolder.close();
        visualFolder.close();
        cameraFolder.close();
    }
    
    createTooltip() {
        // Create a floating tooltip element for displaying plate info
        const tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 1000;
            border: 1px solid rgba(0, 150, 255, 0.5);
            box-shadow: 0 0 10px rgba(0, 150, 255, 0.3);
        `;
        document.body.appendChild(tooltip);
        
        // Raycasting for object hovering
        this.setupRaycasting(tooltip);
    }
    
    setupRaycasting(tooltip) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Track mouse movement
        document.addEventListener('mousemove', (event) => {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Update the raycaster
            raycaster.setFromCamera(mouse, this.simulation.camera);
            
            // Calculate objects intersecting the ray
            const intersects = raycaster.intersectObjects(
                this.simulation.plates.map(plate => plate.mesh)
            );
            
            if (intersects.length > 0) {
                // Find which plate was hit
                const object = intersects[0].object;
                const plate = this.simulation.plates.find(plate => plate.mesh === object);
                
                if (plate) {
                    // Show tooltip with plate info
                    const plateInfo = `
                        <div style="font-weight: bold; margin-bottom: 5px;">Plate ${plate.id}</div>
                        <div>Type: ${plate.isOceanic ? 'Oceanic' : 'Continental'}</div>
                        <div>Density: ${plate.density.toFixed(2)}</div>
                        <div>Thickness: ${plate.thickness.toFixed(2)}</div>
                        <div>Stress: ${plate.getTotalStress().toFixed(2)}</div>
                    `;
                    
                    tooltip.innerHTML = plateInfo;
                    tooltip.style.left = event.clientX + 15 + 'px';
                    tooltip.style.top = event.clientY + 15 + 'px';
                    tooltip.style.opacity = '1';
                }
            } else {
                // Hide tooltip if not hovering over a plate
                tooltip.style.opacity = '0';
            }
        });
    }
    
    createHelpPanel() {
        // Create help panel with instructions and explanations
        const helpPanel = document.createElement('div');
        helpPanel.id = 'help-panel';
        helpPanel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 600px;
            width: 80%;
            z-index: 1001;
            display: none;
            border: 1px solid rgba(0, 150, 255, 0.5);
            box-shadow: 0 0 20px rgba(0, 150, 255, 0.3);
        `;
        
        helpPanel.innerHTML = `
            <h2 style="text-align: center; color: #0af; margin-top: 0;">Tectonic Plate Simulation Help</h2>
            
            <h3 style="color: #0af;">About</h3>
            <p>This simulation demonstrates how tectonic plates move and interact, building up stress until earthquakes occur.</p>
            
            <h3 style="color: #0af;">Controls</h3>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px; margin-bottom: 15px;">
                <div><strong>Mouse Drag</strong></div>
                <div>Rotate the camera</div>
                <div><strong>Mouse Wheel</strong></div>
                <div>Zoom in/out</div>
                <div><strong>Space</strong></div>
                <div>Pause/Resume simulation</div>
                <div><strong>R</strong></div>
                <div>Reset simulation</div>
                <div><strong>H</strong></div>
                <div>Show/Hide this help</div>
                <div><strong>F</strong></div>
                <div>Toggle fullscreen</div>
            </div>
            
            <h3 style="color: #0af;">Plate Types</h3>
            <p>
                <span style="color: #8cf;">Oceanic plates</span> are thinner and denser, while 
                <span style="color: #fc8;">Continental plates</span> are thicker and less dense. 
                Their interactions create different types of boundaries.
            </p>
            
            <h3 style="color: #0af;">Boundary Types</h3>
            <ul>
                <li><span style="color: #f30;">Convergent</span>: Plates moving toward each other, creating mountains or subduction zones</li>
                <li><span style="color: #0fc;">Divergent</span>: Plates moving away from each other, creating rifts or sea floors</li>
                <li><span style="color: #f90;">Transform</span>: Plates sliding past each other horizontally</li>
                <li><span style="color: #f0f;">Subduction</span>: One plate diving beneath another</li>
            </ul>
            
            <div style="text-align: center; margin-top: 20px;">
                <button id="close-help" style="padding: 8px 16px; background: #0af; border: none; color: white; border-radius: 5px; cursor: pointer;">Close</button>
            </div>
        `;
        
        document.body.appendChild(helpPanel);
        
        // Close button event
        document.getElementById('close-help').addEventListener('click', () => {
            this.toggleHelp();
        });
    }
    
    toggleHelp() {
        this.showHelp = !this.showHelp;
        const helpPanel = document.getElementById('help-panel');
        helpPanel.style.display = this.showHelp ? 'block' : 'none';
    }
    
    toggleFullscreen() {
        if (!this.isFullscreen) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        
        this.isFullscreen = !this.isFullscreen;
    }
    
    // Add a notification for earthquakes
    showEarthquakeNotification(earthquake) {
        const notification = document.createElement('div');
        notification.className = 'earthquake-notification';
        notification.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 50, 50, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
            opacity: 0;
            transition: opacity 0.3s, transform 0.3s;
            z-index: 1000;
            text-align: center;
        `;
        
        notification.innerHTML = `
            <div>Earthquake Detected!</div>
            <div>Magnitude: ${earthquake.magnitude.toFixed(1)}</div>
            <div>${earthquake.getDescription()}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(20px)';
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
} 