/**
 * Simulation class managing the overall tectonic plate simulation
 */
class TectonicSimulation {
    constructor() {
        this.plates = [];
        this.faults = [];
        this.earthquakes = [];
        this.timeScale = 1.0; // Simulation speed
        this.isPaused = false;
        this.stats = {
            earthquakeCount: 0,
            maxMagnitude: 0,
            totalEnergy: 0,
            avgStress: 0
        };
        
        // Three.js specific properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        // Create scene and initialize
        this.init();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.camera.position.set(0, 30, 30);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('simulation-canvas'),
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        
        // Create orbit controls for interactive camera movement
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.maxPolarAngle = Math.PI / 2;
        
        // Add lights
        this.addLights();
        
        // Generate the plates
        this.generatePlates();
        
        // Create faults between plates
        this.createFaults();
        
        // Add reference grid
        this.addGrid();
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }
    
    addLights() {
        // Add ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(ambientLight);
        
        // Add directional light for shadows and highlights
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        
        // Set up shadow properties
        const d = 50;
        directionalLight.shadow.camera.left = -d;
        directionalLight.shadow.camera.right = d;
        directionalLight.shadow.camera.top = d;
        directionalLight.shadow.camera.bottom = -d;
        directionalLight.shadow.camera.far = 3500;
        directionalLight.shadow.bias = -0.0001;
        
        this.scene.add(directionalLight);
        
        // Add hemisphere light for subtle color variation
        const hemiLight = new THREE.HemisphereLight(0x6688ff, 0x885500, 0.5);
        this.scene.add(hemiLight);
    }
    
    addGrid() {
        // Create a grid helper for reference
        const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        gridHelper.position.y = -0.01; // Slightly below the plates to avoid z-fighting
        this.scene.add(gridHelper);
    }
    
    generatePlates() {
        // Define number of plates
        const plateCount = 5;
        
        // Create plates with different shapes and properties
        for (let i = 0; i < plateCount; i++) {
            // Generate plate vertices
            const vertices = [];
            const centerX = random(-10, 10);
            const centerZ = random(-10, 10);
            
            // Determine plate type (simple shapes for this example)
            const plateType = Math.floor(Math.random() * 3);
            
            if (plateType === 0) {
                // Irregular polygon
                const radius = random(5, 10);
                const points = Math.floor(random(6, 10));
                
                for (let j = 0; j < points; j++) {
                    const angle = (j / points) * Math.PI * 2;
                    const jitter = random(0.7, 1.3);
                    const x = centerX + Math.cos(angle) * radius * jitter;
                    const z = centerZ + Math.sin(angle) * radius * jitter;
                    vertices.push(new THREE.Vector3(x, 0, z));
                }
            } else if (plateType === 1) {
                // Rectangular
                const width = random(8, 15);
                const height = random(8, 15);
                
                vertices.push(new THREE.Vector3(centerX - width/2, 0, centerZ - height/2));
                vertices.push(new THREE.Vector3(centerX + width/2, 0, centerZ - height/2));
                vertices.push(new THREE.Vector3(centerX + width/2, 0, centerZ + height/2));
                vertices.push(new THREE.Vector3(centerX - width/2, 0, centerZ + height/2));
            } else {
                // Triangular
                const radius = random(8, 12);
                
                for (let j = 0; j < 3; j++) {
                    const angle = (j / 3) * Math.PI * 2;
                    const x = centerX + Math.cos(angle) * radius;
                    const z = centerZ + Math.sin(angle) * radius;
                    vertices.push(new THREE.Vector3(x, 0, z));
                }
            }
            
            // Create velocity and rotation for the plate
            const velocity = new THREE.Vector3(
                random(-0.02, 0.02),
                0,
                random(-0.02, 0.02)
            );
            
            const rotationCenter = new THREE.Vector3(
                centerX + random(-20, 20),
                0,
                centerZ + random(-20, 20)
            );
            
            const rotationSpeed = random(-0.005, 0.005);
            
            // Create the plate
            const plate = new TectonicPlate(i, vertices, velocity, rotationCenter, rotationSpeed);
            this.plates.push(plate);
            
            // Add plate meshes to scene
            this.scene.add(plate.mesh);
            this.scene.add(plate.edges);
        }
    }
    
    createFaults() {
        // Create faults between plates that are close to each other
        for (let i = 0; i < this.plates.length; i++) {
            for (let j = i + 1; j < this.plates.length; j++) {
                const plate1 = this.plates[i];
                const plate2 = this.plates[j];
                
                // Check if plates are close enough to form a fault
                let minDistance = Infinity;
                
                for (const v1 of plate1.vertices) {
                    for (const v2 of plate2.vertices) {
                        const dist = v1.distanceTo(v2);
                        minDistance = Math.min(minDistance, dist);
                    }
                }
                
                // If plates are close enough, create a fault
                if (minDistance < 5) {
                    const fault = new Fault(plate1, plate2);
                    this.faults.push(fault);
                    
                    // Add fault visualization to scene
                    this.scene.add(fault.lineSegments);
                }
            }
        }
    }
    
    update() {
        if (this.isPaused) return;
        
        const deltaTime = this.clock.getDelta() * this.timeScale;
        
        // Update plates
        for (const plate of this.plates) {
            plate.update(deltaTime);
        }
        
        // Update faults and check for earthquakes
        for (const fault of this.faults) {
            const magnitude = fault.update(deltaTime);
            
            // If an earthquake occurred (magnitude > 0)
            if (magnitude > 0) {
                this.triggerEarthquake(fault, magnitude);
            }
        }
        
        // Update active earthquakes
        for (let i = this.earthquakes.length - 1; i >= 0; i--) {
            const earthquake = this.earthquakes[i];
            earthquake.update(deltaTime);
            
            // Apply camera shake
            earthquake.applyCameraShake(this.camera, deltaTime);
            
            // Remove inactive earthquakes
            if (!earthquake.active) {
                earthquake.removeFromScene(this.scene);
                this.earthquakes.splice(i, 1);
            }
        }
        
        // Update statistics
        this.updateStats();
    }
    
    triggerEarthquake(fault, magnitude) {
        // Find epicenter (a point along the fault)
        const epicenter = fault.contactPoints[
            Math.floor(Math.random() * fault.contactPoints.length)
        ].position;
        
        // Create new earthquake
        const earthquake = new Earthquake(magnitude, epicenter, fault);
        
        // Add to list and scene
        this.earthquakes.push(earthquake);
        earthquake.addToScene(this.scene);
        
        // Update stats
        this.stats.earthquakeCount++;
        this.stats.maxMagnitude = Math.max(this.stats.maxMagnitude, magnitude);
        this.stats.totalEnergy += earthquake.energy;
        
        // Emit event for UI update
        this.onEarthquake(earthquake);
    }
    
    updateStats() {
        // Calculate average stress across all faults
        let totalStress = 0;
        for (const fault of this.faults) {
            totalStress += fault.stress / fault.strength;
        }
        this.stats.avgStress = this.faults.length > 0 ? totalStress / this.faults.length : 0;
        
        // Update UI
        this.updateUI();
    }
    
    updateUI() {
        // Update stress meter
        document.getElementById('stress-meter').style.width = `${this.stats.avgStress * 100}%`;
        
        // Update earthquake count
        document.getElementById('earthquake-count').textContent = this.stats.earthquakeCount;
        
        // Update max magnitude
        document.getElementById('max-magnitude').textContent = this.stats.maxMagnitude.toFixed(1);
    }
    
    onEarthquake(earthquake) {
        // Create visual feedback for earthquake
        // This could trigger UI effects, sounds, etc.
        console.log(`Earthquake! Magnitude: ${earthquake.magnitude.toFixed(1)}, Type: ${earthquake.getDescription()}`);
    }
    
    // Handle window resize
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Animation loop
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update controls
        this.controls.update();
        
        // Update simulation
        this.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    // Toggle pause/resume simulation
    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }
    
    // Reset the simulation
    reset() {
        // Remove existing plates, faults, earthquakes
        for (const plate of this.plates) {
            this.scene.remove(plate.mesh);
            this.scene.remove(plate.edges);
        }
        
        for (const fault of this.faults) {
            this.scene.remove(fault.lineSegments);
        }
        
        for (const earthquake of this.earthquakes) {
            earthquake.removeFromScene(this.scene);
        }
        
        // Clear arrays
        this.plates = [];
        this.faults = [];
        this.earthquakes = [];
        
        // Reset stats
        this.stats = {
            earthquakeCount: 0,
            maxMagnitude: 0,
            totalEnergy: 0,
            avgStress: 0
        };
        
        // Generate new plates and faults
        this.generatePlates();
        this.createFaults();
        
        // Reset UI
        this.updateUI();
    }
    
    // Change simulation speed
    setTimeScale(scale) {
        this.timeScale = scale;
    }
} 