/**
 * Fault class for representing a fault line between two tectonic plates
 */
class Fault {
    constructor(plate1, plate2, type) {
        this.plate1 = plate1;
        this.plate2 = plate2;
        this.type = type || this.determineFaultType();
        
        // Physical properties
        this.friction = random(0.3, 0.7); // How easily plates slide past each other
        this.strength = random(0.7, 1.3); // How much stress the fault can withstand
        this.stress = 0; // Current stress level
        this.lastEarthquakeTime = 0; // Time since last earthquake
        
        // For visualization
        this.contactPoints = []; // Points where the plates meet
        this.stressHistory = []; // History of stress for visualization
        this.lineSegments = null; // THREE.js line for visualization
        
        // Create fault line visualization
        this.createFaultLine();
        
        // Initialize stress and accumulation rates
        this.stressAccumulationRate = random(0.05, 0.15); // How quickly stress builds up
        this.stressDecayRate = random(0.01, 0.03); // How quickly stress naturally decays
    }
    
    // Automatically determine fault type based on plate properties
    determineFaultType() {
        // Calculate relative motion direction between plates
        const relativeVelocity = this.plate1.velocity.clone().sub(this.plate2.velocity);
        
        // Calculate density differences to determine oceanic vs continental
        const densityDiff = this.plate1.density - this.plate2.density;
        
        // Determine fault type by relative velocity and plate types
        if (relativeVelocity.y > 0.05) {
            // Significant vertical motion
            if (densityDiff > 0.1) {
                // Plate 1 is denser (probably oceanic) and pushing under plate 2
                return 'subduction';
            } else if (densityDiff < -0.1) {
                // Plate 2 is denser and pushing under plate 1
                return 'subduction';
            } else {
                // Similar densities, generally collision/convergent
                return 'convergent';
            }
        } else if (Math.abs(relativeVelocity.x) > Math.abs(relativeVelocity.z)) {
            // More motion in x direction - transform fault
            return 'transform';
        } else {
            // Default to divergent
            return 'divergent';
        }
    }
    
    // Create visualization of the fault line
    createFaultLine() {
        // Identify points close to both plates
        this.findContactPoints();
        
        // Create geometry for the fault line
        const points = this.contactPoints.map(point => point.position);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Material based on fault type
        const material = new THREE.LineBasicMaterial({
            color: this.getFaultColor(),
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        
        // Create the line segments
        this.lineSegments = new THREE.Line(geometry, material);
        
        // For subduction and convergent faults, add extra visual elements
        if (this.type === 'subduction' || this.type === 'convergent') {
            this.createSubductionMarkers();
        }
    }
    
    // Find points where the two plates are in contact
    findContactPoints() {
        // Get vertices from both plates
        const vertices1 = this.plate1.vertices;
        const vertices2 = this.plate2.vertices;
        
        // Find points that are close to each other
        const maxDistance = 2.0; // Maximum distance to consider "in contact"
        const contactPoints = [];
        
        for (let i = 0; i < vertices1.length; i++) {
            for (let j = 0; j < vertices2.length; j++) {
                const dist = vertices1[i].distanceTo(vertices2[j]);
                if (dist < maxDistance) {
                    // Calculate midpoint between vertices
                    const midpoint = vertices1[i].clone().add(vertices2[j]).multiplyScalar(0.5);
                    
                    contactPoints.push({
                        position: midpoint,
                        stress: 0,
                        distance: dist,
                        vertex1: vertices1[i],
                        vertex2: vertices2[j]
                    });
                }
            }
        }
        
        // Sort contact points to form a line
        if (contactPoints.length > 1) {
            const sortedPoints = [contactPoints[0]];
            contactPoints.splice(0, 1);
            
            while (contactPoints.length > 0) {
                const lastPoint = sortedPoints[sortedPoints.length - 1];
                
                // Find closest point to the last point
                let closestIdx = 0;
                let closestDist = lastPoint.position.distanceTo(contactPoints[0].position);
                
                for (let i = 1; i < contactPoints.length; i++) {
                    const dist = lastPoint.position.distanceTo(contactPoints[i].position);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestIdx = i;
                    }
                }
                
                sortedPoints.push(contactPoints[closestIdx]);
                contactPoints.splice(closestIdx, 1);
            }
            
            this.contactPoints = sortedPoints;
        } else {
            this.contactPoints = contactPoints;
        }
    }
    
    // Create markers for subduction zones
    createSubductionMarkers() {
        // TODO: Implement more detailed visuals for subduction zones
    }
    
    // Update the fault based on plate movements
    update(deltaTime) {
        // Calculate relative movement between plates at each contact point
        for (const point of this.contactPoints) {
            // Get plate velocities at this point
            const vel1 = this.plate1.velocity.clone();
            const vel2 = this.plate2.velocity.clone();
            
            // Calculate relative velocity
            const relVel = vel1.clone().sub(vel2);
            
            // Stress increases based on relative motion and friction
            const stressIncrease = relVel.length() * this.friction * deltaTime * this.stressAccumulationRate;
            point.stress += stressIncrease;
            this.stress += stressIncrease;
        }
        
        // Natural stress decay
        this.stress = Math.max(0, this.stress - this.stressDecayRate * deltaTime);
        
        // Update visuals
        this.updateVisualization();
        
        // Check if earthquake threshold reached
        if (this.stress > this.strength) {
            const magnitude = this.triggerEarthquake();
            return magnitude;
        }
        
        return 0; // No earthquake
    }
    
    // Trigger an earthquake
    triggerEarthquake() {
        // Calculate magnitude based on accumulated stress
        const magnitude = Math.log(this.stress) * 1.5;
        
        // Reset stress
        const stressReleased = this.stress * random(0.7, 0.95); // Release 70-95% of stress
        this.stress -= stressReleased;
        
        // Set last earthquake time
        this.lastEarthquakeTime = Date.now();
        
        // Update contact points
        for (const point of this.contactPoints) {
            point.stress *= 0.1; // Reduce stress at each point
        }
        
        // Return the magnitude of the earthquake
        return magnitude;
    }
    
    // Update the visualization of the fault line
    updateVisualization() {
        // Color based on stress level
        const stressLevel = this.stress / this.strength;
        const color = this.getFaultColor();
        
        // Update line color
        this.lineSegments.material.color = color;
        
        // Line thickness based on stress
        this.lineSegments.material.linewidth = 1 + stressLevel * 3;
        
        // Opacity based on stress
        this.lineSegments.material.opacity = 0.5 + stressLevel * 0.5;
    }
    
    // Get color based on fault type
    getFaultColor() {
        switch (this.type) {
            case 'transform':
                return new THREE.Color(0xff9900); // Orange
            case 'convergent':
                return new THREE.Color(0xff3300); // Red
            case 'divergent':
                return new THREE.Color(0x00ffcc); // Cyan
            case 'subduction':
                return new THREE.Color(0xff0066); // Pink
            default:
                return new THREE.Color(0xffffff); // White
        }
    }
} 