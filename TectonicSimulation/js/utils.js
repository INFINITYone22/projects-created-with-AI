/**
 * Utility functions for the tectonic plate simulation
 */

// Generate a random number between min and max
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Linear interpolation
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Calculate the distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Convert a value from one range to another
function map(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// Clamp a value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Generate fractal noise for terrain
function generateFractalNoise(width, height, octaves, persistence) {
    const noise = new Array(width * height).fill(0);
    
    for (let octave = 0; octave < octaves; octave++) {
        const frequency = Math.pow(2, octave);
        const amplitude = Math.pow(persistence, octave);
        
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const idx = y * width + x;
                const sampleX = x / width * frequency;
                const sampleY = y / height * frequency;
                
                // Simplex-like noise (using simple random for this demo)
                const value = Math.sin(sampleX * 12.9898 + sampleY * 78.233) * 43758.5453 % 1;
                noise[idx] += value * amplitude;
            }
        }
    }
    
    // Normalize
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < noise.length; i++) {
        min = Math.min(min, noise[i]);
        max = Math.max(max, noise[i]);
    }
    
    for (let i = 0; i < noise.length; i++) {
        noise[i] = (noise[i] - min) / (max - min);
    }
    
    return noise;
}

// Generate a color based on height (for terrain visualization)
function heightToColor(height) {
    if (height < 0.2) return new THREE.Color(0x0077be); // Deep water
    if (height < 0.4) return new THREE.Color(0x2a93d5); // Shallow water
    if (height < 0.5) return new THREE.Color(0xc2b280); // Beach/sand
    if (height < 0.7) return new THREE.Color(0x228b22); // Lowlands/grass
    if (height < 0.85) return new THREE.Color(0x808040); // Hills
    return new THREE.Color(0x696969); // Mountains
}

// Generate a color for cracks/faults
function getFaultColor(stress) {
    const t = clamp(stress, 0, 1);
    return new THREE.Color().setHSL(0.1 - t * 0.1, 0.8, 0.3 + t * 0.4);
} 