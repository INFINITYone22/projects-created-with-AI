document.addEventListener('DOMContentLoaded', () => {
    // Get canvas and set up context
    const canvas = document.getElementById('pendulumCanvas');
    const ctx = canvas.getContext('2d');
    
    // Get UI elements
    const pendulumCountSlider = document.getElementById('pendulumCount');
    const pendulumCountValue = document.getElementById('pendulumCountValue');
    const cycleTimeSlider = document.getElementById('cycleTime');
    const cycleTimeValue = document.getElementById('cycleTimeValue');
    const resetBtn = document.getElementById('resetBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    // Animation variables
    let animationId;
    let isPaused = false;
    
    // Pendulum settings
    let pendulumCount = parseInt(pendulumCountSlider.value);
    let cycleTime = parseInt(cycleTimeSlider.value);
    let pendulums = [];
    let startTime;
    
    // Colors for pendulums (gradient from cool to warm colors)
    const colors = [
        '#3498db', '#2980b9', '#1abc9c', '#16a085', '#2ecc71', 
        '#27ae60', '#f1c40f', '#f39c12', '#e67e22', '#d35400', 
        '#e74c3c', '#c0392b', '#9b59b6', '#8e44ad'
    ];
    
    // Physics constants
    const g = 9.81;  // Acceleration due to gravity (m/s²)
    
    // Resize canvas to fill container
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Recalculate pendulum positions after resize
        if (pendulums.length > 0) {
            setupPendulums();
        }
    }
    
    // Create pendulum objects
    function setupPendulums() {
        pendulums = [];
        const canvasCenter = canvas.width / 2;
        const pendulumSpacing = Math.min(canvas.width / (pendulumCount + 1), 50);
        const maxLength = canvas.height * 0.7;
        const minLength = maxLength * 0.5;
        
        // Calculate period for the pendulums
        // For a pendulum wave, we want the periods to be related such that they all return
        // to the same phase after the cycle time
        for (let i = 0; i < pendulumCount; i++) {
            // Calculate length for desired period
            // T = 2π√(L/g) => L = g(T/2π)²
            
            // The longest pendulum completes n oscillations in the cycle time
            // The shortest pendulum completes n+1 oscillations in the same time
            const n = 20; // Number of oscillations for the longest pendulum
            
            // Calculate the period for this pendulum
            // We want pendulums that complete between n and n+1 oscillations in the cycle time
            const oscillations = n + i/(pendulumCount-1);
            const period = cycleTime / oscillations;
            
            // Calculate length from period: L = g(T/2π)²
            const length = g * Math.pow(period/(2 * Math.PI), 2) * 100; // Scale factor for visual purposes
            
            // Map to our visual range
            const scaledLength = maxLength - (i / (pendulumCount - 1)) * (maxLength - minLength);
            
            // Pendulum properties
            pendulums.push({
                x: canvasCenter - ((pendulumCount - 1) / 2 - i) * pendulumSpacing,
                y: 0,
                length: scaledLength,
                angle: Math.PI / 4, // Starting angle (45 degrees)
                period: period,
                color: colors[i % colors.length],
                amplitude: Math.PI / 4, // Max angle
                bobSize: 10 + (pendulumCount - i) / pendulumCount * 10, // Size of the pendulum bob
                tailLength: 20, // Length of motion trail
                tailPositions: [] // Array to store previous positions for trail effect
            });
        }
    }
    
    // Calculate pendulum position at a given time
    function updatePendulums(time) {
        pendulums.forEach(pendulum => {
            // Simple harmonic motion: θ = θ₀cos(ωt)
            // where ω = 2π/T (angular frequency)
            const angularFrequency = 2 * Math.PI / pendulum.period;
            pendulum.angle = pendulum.amplitude * Math.cos(angularFrequency * time);
            
            // Calculate bob position
            const bobX = pendulum.x + pendulum.length * Math.sin(pendulum.angle);
            const bobY = pendulum.y + pendulum.length * Math.cos(pendulum.angle);
            
            // Update tail positions for trail effect
            pendulum.tailPositions.unshift({x: bobX, y: bobY});
            if (pendulum.tailPositions.length > pendulum.tailLength) {
                pendulum.tailPositions.pop();
            }
        });
    }
    
    // Draw pendulums on canvas
    function drawPendulums() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the mounting bar
        ctx.save();
        const barY = 10;
        ctx.beginPath();
        ctx.moveTo(0, barY);
        ctx.lineTo(canvas.width, barY);
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();
        ctx.restore();
        
        // Draw each pendulum
        pendulums.forEach(pendulum => {
            // Calculate bob position
            const bobX = pendulum.x + pendulum.length * Math.sin(pendulum.angle);
            const bobY = pendulum.y + pendulum.length * Math.cos(pendulum.angle);
            
            // Draw trail/tail
            if (pendulum.tailPositions.length > 1) {
                ctx.beginPath();
                ctx.moveTo(pendulum.tailPositions[0].x, pendulum.tailPositions[0].y);
                
                for (let i = 1; i < pendulum.tailPositions.length; i++) {
                    ctx.lineTo(pendulum.tailPositions[i].x, pendulum.tailPositions[i].y);
                    // Fade out the trail
                    ctx.lineWidth = (pendulum.tailLength - i) / pendulum.tailLength * 3;
                    ctx.strokeStyle = `${pendulum.color}${Math.floor((1 - i / pendulum.tailLength) * 255).toString(16).padStart(2, '0')}`;
                }
                ctx.stroke();
            }
            
            // Draw string
            ctx.beginPath();
            ctx.moveTo(pendulum.x, pendulum.y);
            ctx.lineTo(bobX, bobY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.stroke();
            
            // Draw bob (circle)
            ctx.beginPath();
            ctx.arc(bobX, bobY, pendulum.bobSize, 0, Math.PI * 2);
            
            // Create radial gradient for 3D effect
            const gradient = ctx.createRadialGradient(
                bobX - pendulum.bobSize/3, bobY - pendulum.bobSize/3, 0,
                bobX, bobY, pendulum.bobSize
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, pendulum.color);
            gradient.addColorStop(1, '#000000');
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add slight outer glow
            ctx.shadowColor = pendulum.color;
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.stroke();
            ctx.shadowBlur = 0;
        });
    }
    
    // Animation loop
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        if (!isPaused) {
            const elapsedTime = (timestamp - startTime) / 1000; // Convert to seconds
            updatePendulums(elapsedTime);
        }
        
        drawPendulums();
        animationId = requestAnimationFrame(animate);
    }
    
    // Initialize and start the animation
    function init() {
        resizeCanvas();
        setupPendulums();
        startTime = null;
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        animationId = requestAnimationFrame(animate);
    }
    
    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    
    pendulumCountSlider.addEventListener('input', () => {
        pendulumCount = parseInt(pendulumCountSlider.value);
        pendulumCountValue.textContent = pendulumCount;
        init();
    });
    
    cycleTimeSlider.addEventListener('input', () => {
        cycleTime = parseInt(cycleTimeSlider.value);
        cycleTimeValue.textContent = cycleTime;
        init();
    });
    
    resetBtn.addEventListener('click', () => {
        isPaused = false;
        pauseBtn.textContent = 'Pause';
        init();
    });
    
    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    });
    
    // Start the simulation
    init();
}); 