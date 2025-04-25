/**
 * Earthquake class for managing and visualizing earthquake events
 */
class Earthquake {
    constructor(magnitude, epicenter, fault) {
        this.magnitude = magnitude;
        this.epicenter = epicenter.clone();
        this.fault = fault;
        this.startTime = Date.now();
        this.duration = 2000 + magnitude * 1000; // Duration in milliseconds
        this.active = true;
        
        // Physical properties
        this.radius = magnitude * 2; // Radius of effect
        this.energy = Math.pow(10, 1.5 * magnitude); // Energy released
        this.depth = random(5, 30); // Depth in km
        
        // For visualization
        this.waveParticles = [];
        this.shakeIntensity = Math.min(magnitude / 3, 1);
        this.cracks = [];
        this.dustParticles = [];
        
        // Create visual elements
        this.createVisuals();
    }
    
    createVisuals() {
        // Create a circle pulse at the epicenter
        const circleGeometry = new THREE.CircleGeometry(0.1, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.8
        });
        this.circlePulse = new THREE.Mesh(circleGeometry, circleMaterial);
        this.circlePulse.position.copy(this.epicenter);
        this.circlePulse.rotation.x = -Math.PI / 2; // Rotate to lie flat on the ground
        
        // Create wave particles
        const particleCount = Math.floor(this.magnitude * 50);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = random(0.1, this.radius * 0.8);
            const speed = random(0.5, 2.0);
            
            const particle = {
                position: new THREE.Vector3(
                    this.epicenter.x + Math.cos(angle) * distance,
                    this.epicenter.y,
                    this.epicenter.z + Math.sin(angle) * distance
                ),
                angle: angle,
                speed: speed,
                distance: distance,
                initialDistance: distance,
                size: random(0.1, 0.5),
                color: new THREE.Color(0xff0000),
                opacity: 1.0
            };
            
            this.waveParticles.push(particle);
        }
        
        // Create particle system for wave visualization
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.waveParticles[i];
            positions[i * 3] = particle.position.x;
            positions[i * 3 + 1] = particle.position.y;
            positions[i * 3 + 2] = particle.position.z;
            
            colors[i * 3] = particle.color.r;
            colors[i * 3 + 1] = particle.color.g;
            colors[i * 3 + 2] = particle.color.b;
            
            sizes[i] = particle.size;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: {
                    value: new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC42/Ixj3wAAAkZJREFUWEfFl4uRwjAMRMmVQAmUQAl0AB1AB1xdA9AB6YB0QB+UQAmUgGbQOhpkW/6Qm9HMOIBir/YjB8/LeO+3cN0TN5OQJ7BkbjzF8QS2zFZHRVy3xLrkvs8uLSLWh5A9W5D7PnvcInJtZwWJjYj9JdmwBYnt6CNiTXldl/BlzWw1JC/itK0GHO1kdSQr9rNLm9jPLm1iP7s4EQskftaduEZEXpftWTPVkLO4BpIXedlqGCzi9o5kbYsfRMhWw0ARt1clWcfi+4isNQwSNXcmaNvi24CstRwtau5GkM3FdwFZ61lLxM9Bt/m25uvC8I5ELCXi56BooLGQwOXaRMTPQdEQw+B6HCvpzoD4OSgaYhC4F9dIum9A/BwUDTHg3wnpxoT4OSgaYpDwJpRu+PE9wJv4OSgaYpDwNZRuG0m3DuLnoGiIQcLnuHTrnXTbSPwcFA0xSPgil269km4bRc3RRkMMLnwUS89OcSFqjjYaQpCu4fTsAJei5mijIQTpXk7v9qAQNUcbDSFIeT2nZzsoRM3RRkMIUj7R6dkOClFztNEQgpQPNXq2g0LUHG00hCDlY52e7aAQNUcbDSFI+WCnZzsoRM3RRkMICn61E9KrABSi5mijIQQNe7sPyO8CUIiao42GEDT0/f5GfheAQtQcbTSEoOE/ECzqdwEoRM3RRkMIGv4LxSQ+C0Ahao42GkIQ+EsxCZ8FoBA1RxsNIQj9mZyEzwJQiJqjjYYQxB3/naxPxMrldUWi+4WMewhZ61lNvP8CsRfsKo3eWY8AAAAASUVORK5CYII=')
                }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
                }
            `,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        this.particleSystem = new THREE.Points(particles, particleMaterial);
        
        // Create cracks in the ground
        if (this.magnitude > 4) {
            this.createCracks();
        }
    }
    
    createCracks() {
        const crackCount = Math.floor(this.magnitude * 2);
        
        for (let i = 0; i < crackCount; i++) {
            const startAngle = Math.random() * Math.PI * 2;
            const length = random(this.magnitude * 0.5, this.magnitude * 2);
            const segments = Math.floor(length * 5);
            
            const points = [];
            let currentPoint = this.epicenter.clone();
            let currentAngle = startAngle;
            
            points.push(currentPoint.clone());
            
            for (let j = 0; j < segments; j++) {
                // Randomize angle slightly for natural look
                currentAngle += random(-0.2, 0.2);
                
                // Move forward in current direction
                const stepLength = length / segments;
                currentPoint.x += Math.cos(currentAngle) * stepLength;
                currentPoint.z += Math.sin(currentAngle) * stepLength;
                
                // Add some randomness to y to simulate ground displacement
                currentPoint.y += random(-0.1, 0.1) * this.magnitude;
                
                points.push(currentPoint.clone());
            }
            
            // Create geometry for the crack
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x333333,
                linewidth: random(1, 3),
                transparent: true,
                opacity: 0.8
            });
            
            const crack = new THREE.Line(geometry, material);
            this.cracks.push(crack);
        }
    }
    
    update(deltaTime) {
        // Check if earthquake is finished
        const elapsedTime = Date.now() - this.startTime;
        if (elapsedTime > this.duration) {
            this.active = false;
            return;
        }
        
        // Calculate progress (0-1)
        const progress = elapsedTime / this.duration;
        
        // Update circle pulse
        const pulseSize = progress * this.radius;
        this.circlePulse.scale.set(pulseSize, pulseSize, 1);
        this.circlePulse.material.opacity = 1 - progress;
        
        // Update wave particles
        for (let i = 0; i < this.waveParticles.length; i++) {
            const particle = this.waveParticles[i];
            
            // Move outward from epicenter
            particle.distance += particle.speed * deltaTime;
            
            // Update position
            particle.position.x = this.epicenter.x + Math.cos(particle.angle) * particle.distance;
            particle.position.z = this.epicenter.z + Math.sin(particle.angle) * particle.distance;
            
            // Add vertical movement (waves)
            const wave = Math.sin(particle.distance * 3) * 0.1 * (1 - progress);
            particle.position.y = this.epicenter.y + wave;
            
            // Update opacity based on distance from epicenter
            particle.opacity = 1 - (particle.distance / this.radius);
            
            // Update particle system
            const positions = this.particleSystem.geometry.attributes.position.array;
            const colors = this.particleSystem.geometry.attributes.color.array;
            
            positions[i * 3] = particle.position.x;
            positions[i * 3 + 1] = particle.position.y;
            positions[i * 3 + 2] = particle.position.z;
            
            // Adjust color based on wave height
            const intensity = 0.5 + wave * 5;
            colors[i * 3] = intensity;
            colors[i * 3 + 1] = intensity * 0.3;
            colors[i * 3 + 2] = 0.1;
        }
        
        // Mark attributes as needing update
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.color.needsUpdate = true;
        
        // Update cracks
        for (const crack of this.cracks) {
            // Animate crack formation
            const crackProgress = Math.min(progress * 3, 1);
            crack.material.opacity = crackProgress * 0.8;
            
            // Simulate ground displacement
            if (progress < 0.3) {
                const positions = crack.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += random(-0.01, 0.01) * this.magnitude * deltaTime;
                }
                crack.geometry.attributes.position.needsUpdate = true;
            }
        }
    }
    
    // Apply camera shake effect
    applyCameraShake(camera, deltaTime) {
        if (!this.active) return;
        
        const elapsedTime = Date.now() - this.startTime;
        const progress = elapsedTime / this.duration;
        
        // Shake less as the earthquake dissipates
        const intensity = this.shakeIntensity * (1 - progress);
        
        // Apply random movement to camera
        camera.position.x += random(-intensity, intensity) * deltaTime * 10;
        camera.position.y += random(-intensity, intensity) * deltaTime * 10;
        camera.position.z += random(-intensity, intensity) * deltaTime * 10;
    }
    
    // Add this earthquake's objects to the scene
    addToScene(scene) {
        scene.add(this.circlePulse);
        scene.add(this.particleSystem);
        
        for (const crack of this.cracks) {
            scene.add(crack);
        }
    }
    
    // Remove this earthquake's objects from the scene
    removeFromScene(scene) {
        scene.remove(this.circlePulse);
        scene.remove(this.particleSystem);
        
        for (const crack of this.cracks) {
            scene.remove(crack);
        }
    }
    
    // Get description of the earthquake based on magnitude
    getDescription() {
        if (this.magnitude < 2.0) return "Micro earthquake - Not felt";
        if (this.magnitude < 3.0) return "Minor earthquake - Felt by some people";
        if (this.magnitude < 4.0) return "Light earthquake - Felt by many people";
        if (this.magnitude < 5.0) return "Moderate earthquake - Some damage";
        if (this.magnitude < 6.0) return "Strong earthquake - Moderate damage";
        if (this.magnitude < 7.0) return "Major earthquake - Serious damage";
        if (this.magnitude < 8.0) return "Great earthquake - Severe damage";
        return "Catastrophic earthquake - Total destruction";
    }
} 