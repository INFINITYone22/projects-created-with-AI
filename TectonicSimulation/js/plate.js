/**
 * TectonicPlate class for representing a single tectonic plate
 */
class TectonicPlate {
    constructor(id, vertices, velocity, rotationCenter, rotationSpeed) {
        this.id = id;
        this.vertices = vertices; // Array of THREE.Vector3 vertices
        this.velocity = velocity.clone(); // Direction and speed of movement
        this.rotationCenter = rotationCenter.clone(); // Center of rotation
        this.rotationSpeed = rotationSpeed; // Angular speed of rotation
        
        // Physical properties
        this.density = random(0.8, 1.2); // Relative density
        this.thickness = random(0.8, 1.2); // Relative thickness
        this.isOceanic = Math.random() > 0.5; // Type of plate (oceanic or continental)
        
        // Visual properties
        this.color = new THREE.Color(
            random(0.2, 0.8),
            random(0.2, 0.8),
            random(0.2, 0.8)
        );
        this.opacity = this.isOceanic ? 0.8 : 1.0;
        
        // Stress metrics
        this.stressPoints = []; // Points of high stress
        this.deformation = 0; // Amount of deformation
        
        // Create the plate mesh
        this.createMesh();
    }
    
    createMesh() {
        // Create a geometry for the plate
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints(this.vertices);
        
        // Create material
        const material = new THREE.MeshPhongMaterial({
            color: this.color,
            transparent: true,
            opacity: this.opacity,
            side: THREE.DoubleSide,
            flatShading: true
        });
        
        // Create the mesh
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Add height variation to create terrain
        this.addTerrainDetail();
        
        // Create edges to highlight the plate boundaries
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        this.edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    }
    
    addTerrainDetail() {
        // Get position attribute from geometry
        const positionAttribute = this.mesh.geometry.getAttribute('position');
        const positions = positionAttribute.array;
        
        // Calculate bounding box for noise sampling
        const bbox = new THREE.Box3().setFromBufferAttribute(positionAttribute);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        
        // Generate noise
        const width = Math.ceil(size.x * 10);
        const height = Math.ceil(size.z * 10);
        const noise = generateFractalNoise(width, height, 5, 0.5);
        
        // Update vertices with noise values
        const colors = [];
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            
            // Map x,z to noise array
            const nx = Math.floor(map(x - bbox.min.x, 0, size.x, 0, width - 1));
            const ny = Math.floor(map(z - bbox.min.z, 0, size.z, 0, height - 1));
            const idx = ny * width + nx;
            
            // Apply elevation based on noise
            const elevation = this.isOceanic ? noise[idx] * 0.5 - 0.2 : noise[idx];
            positions[i + 1] = elevation * (this.isOceanic ? 0.5 : 1.0);
            
            // Add color based on height
            const terrainColor = heightToColor(noise[idx]);
            colors.push(terrainColor.r, terrainColor.g, terrainColor.b);
        }
        
        // Update position attribute
        positionAttribute.needsUpdate = true;
        
        // Add colors to geometry
        this.mesh.geometry.setAttribute(
            'color',
            new THREE.Float32BufferAttribute(colors, 3)
        );
        
        // Update material to use vertex colors
        this.mesh.material.vertexColors = true;
    }
    
    update(deltaTime) {
        // Move the plate according to velocity
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.edges.position.copy(this.mesh.position);
        
        // Rotate the plate around its rotation center
        if (this.rotationSpeed !== 0) {
            const rotationAngle = this.rotationSpeed * deltaTime;
            
            // Calculate rotation around the rotation center
            this.mesh.position.sub(this.rotationCenter);
            this.mesh.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationAngle);
            this.mesh.position.add(this.rotationCenter);
            
            // Rotate the mesh itself
            this.mesh.rotateY(rotationAngle);
            this.edges.rotateY(rotationAngle);
        }
    }
    
    // Add stress at a specific point on the plate
    addStress(point, amount) {
        this.stressPoints.push({
            position: point.clone(),
            amount: amount,
            age: 0
        });
        this.deformation += amount;
    }
    
    // Get the total stress on the plate
    getTotalStress() {
        return this.stressPoints.reduce((sum, point) => sum + point.amount, 0);
    }
    
    // Release stress (simulating an earthquake)
    releaseStress(amount) {
        // Sort by stress amount (highest first)
        this.stressPoints.sort((a, b) => b.amount - a.amount);
        
        let remaining = amount;
        let released = 0;
        
        for (let i = 0; i < this.stressPoints.length && remaining > 0; i++) {
            const release = Math.min(this.stressPoints[i].amount, remaining);
            this.stressPoints[i].amount -= release;
            remaining -= release;
            released += release;
        }
        
        // Filter out stress points that have been completely released
        this.stressPoints = this.stressPoints.filter(point => point.amount > 0.01);
        this.deformation -= released;
        
        return released; // Return the amount of stress actually released
    }
} 