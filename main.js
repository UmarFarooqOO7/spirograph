// State management using gearValues as the source of truth
const spirographs = []; // Array to hold canvas and context
const gearValues = [];  // Array to hold gear values for each spirograph
let activeGraphIndex = null;

const globalConfig = {
    speed: 10,
    bgColor: '#ffffff', // Default background color
    isFiniteTimeEnabled: false,
    isFullDrawEnabled: true,
    MAX_DRAWING_TIME: 3 * 60 * 1000, // 1 minute in milliseconds
    // Time to wait before starting the next drawing (in milliseconds)
    WAIT_TIME_AFTER_DRAW: 10 * 1000, // 5 seconds
    hue: 225
};

// Function to initialize the application
function initializeApp() {
    // Add event listeners to controls
    setupControlEventListeners();

    // Add the initial spirograph
    addSpirograph();

    // Set up window resize handling
    window.addEventListener('resize', resizeAllCanvases);
}

// Create a debounced version of handleControlChange
const debouncedHandleControlChange = debounce(handleControlChange, 300); // Adjust delay as needed


// Function to set up event listeners for controls
function setupControlEventListeners() {
    // Event listeners for input changes
    document.getElementById('R').addEventListener('input', debouncedHandleControlChange);
    document.getElementById('r').addEventListener('input', debouncedHandleControlChange);
    document.getElementById('O').addEventListener('input', debouncedHandleControlChange);
    document.getElementById('lineWidth').addEventListener('input', debouncedHandleControlChange);
    document.getElementById('fixedLineColor').addEventListener('input', debouncedHandleControlChange);
    document.getElementById('glowIntensity').addEventListener('input', debouncedHandleControlChange);
    document.getElementById('speed').addEventListener('input', debouncedHandleControlChange);
    document.getElementById('randomColorToggle').addEventListener('change', debouncedHandleControlChange);
    // document.getElementById('randomSpeedToggle').addEventListener('change', debouncedHandleControlChange);
    document.getElementById('fullDrawToggle').addEventListener('change', debouncedHandleControlChange);
    document.getElementById('lockR').addEventListener('change', debouncedHandleControlChange);
    document.getElementById('lockr').addEventListener('change', debouncedHandleControlChange);
    document.getElementById('lockO').addEventListener('change', debouncedHandleControlChange);

    // Other event listeners
    document.getElementById('addGraphBtn').addEventListener('click', addSpirograph);
    document.getElementById('selectGraph').addEventListener('change', function () {
        setActiveGraph(parseInt(this.value));
    });
    document.getElementById('drawButton').addEventListener('click', drawSpirograph);
    document.getElementById('drawFullButton').addEventListener('click', drawSpirographFull);
    document.getElementById('stopButton').addEventListener('click', stopDrawing);
    document.getElementById('clearGraphBtn').addEventListener('click', clearSpirograph);
    document.getElementById('randomizeButton').addEventListener('click', randomizeValues);
    document.getElementById('downloadButton').addEventListener('click', downloadDrawing);
    document.getElementById('bgColorPicker').addEventListener('input', updateBackgroundColor);

    // Attach the event listener for keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Add other control event listeners as needed
}

// Function to handle control changes and update gearValues
function handleControlChange() {
    if (activeGraphIndex === null) return;
    const values = gearValues[activeGraphIndex];

    // Update values from controls
    values.R = parseFloat(document.getElementById('R').value);
    values.r = parseFloat(document.getElementById('r').value);
    values.O = parseFloat(document.getElementById('O').value);
    values.lineWidth = parseFloat(document.getElementById('lineWidth').value);
    values.fixedLineColor = document.getElementById('fixedLineColor').value;
    values.glowIntensity = parseFloat(document.getElementById('glowIntensity').value);
    values.isRandomColorEnabled = document.getElementById('randomColorToggle').checked;
    values.isRLocked = document.getElementById('lockR').checked;
    values.isrLocked = document.getElementById('lockr').checked;
    values.isOLocked = document.getElementById('lockO').checked;

    globalConfig.speed = parseInt(document.getElementById('speed').value);
    globalConfig.bgColor = document.getElementById('bgColorPicker').value;
    globalConfig.isFiniteTimeEnabled = document.getElementById('finiteToggle').checked;
    globalConfig.isFullDrawEnabled = document.getElementById('fullDrawToggle').checked;

    // Update display values if needed
    document.getElementById('speedValue').innerText = globalConfig.speed;
    document.getElementById('lineWidthValue').innerText = values.lineWidth;
    document.getElementById('glowIntensityValue').innerText = values.glowIntensity;

    // Redraw the spirograph
    drawSpirographFull();
}

// Function to handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
    switch (event.key.toLowerCase()) {
        case 'd':  // D: Start drawing
            drawSpirograph();
            break;
        case 'w':  // D: Start drawing
            drawSpirographFull();
            break;
        case 's':  // S: Stop drawing
            stopDrawing();
            break;
        case 'r':  // R: Randomize values
            randomizeValues();
            if (globalConfig.isFullDrawEnabled)
                drawSpirographFull();
            break;
        case 'c':  // C: Clear canvas
            clearSpirograph(activeGraphIndex);
            break;
        case 'n':  // N: Add new spirograph
            addSpirograph();
            break;
        case 'a':  // A: Download drawing
            downloadDrawing();
            break;
        case 'f':  // A: Download drawing
            toggleFullscreen();
            break;
        case 'q': // Toggle settings
            toggleSettings();
            break;
        default:
            if (event.key === 'PageUp') {
                // Go to the previous graph
                const currentIndex = activeGraphIndex;
                if (currentIndex > 0) {
                    setActiveGraph(currentIndex - 1);
                }
            } else if (event.key === 'PageDown') {
                // Go to the next graph
                const currentIndex = activeGraphIndex;
                if (currentIndex < spirographs.length - 1) {
                    setActiveGraph(currentIndex + 1);
                }
            }
            // Update the select input to reflect the active graph
            const selectInput = document.getElementById('selectGraph'); // Replace with your actual select input ID
            selectInput.value = activeGraphIndex; // Set the value to the current index
            break;
    }
}

// Function to add a new spirograph (canvas)
function addSpirograph() {
    const graphIndex = spirographs.length;

    // Create a new canvas
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.id = `spirograph${graphIndex}`;
    canvas.style.position = 'absolute'; // Ensure it overlaps
    canvas.style.left = '0'; // Align canvases
    canvas.style.top = '0';  // Align canvases
    canvas.style.zIndex = graphIndex;
    document.getElementById('spirograph-container').appendChild(canvas);

    // Create a 2D drawing context for the new canvas
    const ctx = canvas.getContext('2d');

    // Set background only for the first canvas
    if (spirographs.length === 0) {
        const bgColor = document.getElementById('bgColorPicker').value || '#ffffff';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Add to the list of spirographs
    spirographs.push({ canvas, ctx });


    // Initialize default gear values for this spirograph
    gearValues.push({
        R: 150,
        r: 60,
        O: 60,
        lineWidth: 2,
        fixedLineColor: document.getElementById('fixedLineColor').value,
        glowIntensity: 15,
        isRandomColorEnabled: document.getElementById('randomColorToggle').checked,
        // isFullDrawEnabled: document.getElementById('fullDrawToggle').checked,
        isRLocked: document.getElementById('lockR').checked,
        isrLocked: document.getElementById('lockr').checked,
        isOLocked: document.getElementById('lockO').checked,
        t: 0,
        drawing: false,
        animationFrameId: null
    });

    // Add the new graph to the select dropdown
    const select = document.getElementById('selectGraph');
    const option = document.createElement('option');
    option.value = graphIndex;
    option.textContent = `Spirograph ${graphIndex + 1}`;
    select.appendChild(option);

    // Automatically select the new spirograph as active
    select.value = graphIndex;
    setActiveGraph(graphIndex);
}

// Function to set the active spirograph
function setActiveGraph(index) {
    activeGraphIndex = index;
    syncUIWithValues();
}

// Function to sync UI controls with the current gear values
function syncUIWithValues() {
    if (activeGraphIndex === null) return;
    const values = gearValues[activeGraphIndex];

    // Update UI controls
    document.getElementById('R').value = values.R;
    document.getElementById('r').value = values.r;
    document.getElementById('O').value = values.O;
    document.getElementById('lineWidth').value = values.lineWidth;
    document.getElementById('fixedLineColor').value = values.fixedLineColor;
    document.getElementById('glowIntensity').value = values.glowIntensity;
    document.getElementById('randomColorToggle').checked = values.isRandomColorEnabled;
    document.getElementById('lockR').checked = values.isRLocked;
    document.getElementById('lockr').checked = values.isrLocked;
    document.getElementById('lockO').checked = values.isOLocked;

    document.getElementById('speed').value = globalConfig.speed;
    // document.getElementById('randomSpeedToggle').checked = globalConfig.isRandomSpeedEnabled;
    document.getElementById('fullDrawToggle').checked = globalConfig.isFullDrawEnabled;

    // Update display values
    document.getElementById('speedValue').innerText = globalConfig.speed;
    document.getElementById('lineWidthValue').innerText = values.lineWidth;
    document.getElementById('glowIntensityValue').innerText = values.glowIntensity;
}

// Function to resize all canvases on window resize
function resizeAllCanvases() {
    spirographs.forEach(({ canvas }) => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    spirographs.forEach((_, index) => {
        setActiveGraph(index); // Activate each graph one by one
        drawSpirographFull(); // Redraw the current active graph
    });

    // drawSpirographFull(); // Redraw after resize
}

// Function to draw the full spirograph without animation
function drawSpirographFull() {
    if (activeGraphIndex === null) return;
    const { ctx, canvas } = spirographs[activeGraphIndex];
    const values = gearValues[activeGraphIndex];

    clearSpirograph();

    const { R, r, O, lineWidth, fixedLineColor, glowIntensity, isRandomColorEnabled } = values;

    const totalTime = 2 * Math.PI * (R / Math.gcd(R, r));
    const points = [];
    const step = 0.01;

    for (let t = 0; t <= totalTime; t += step) {
        const x = (R - r) * Math.cos(t) + O * Math.cos((R - r) / r * t);
        const y = (R - r) * Math.sin(t) - O * Math.sin((R - r) / r * t);
        points.push({ x: canvas.width / 2 + x, y: canvas.height / 2 + y });
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    // Apply line color
    ctx.strokeStyle = isRandomColorEnabled ? getRandomColor() : fixedLineColor;

    // Apply glowing effect
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = ctx.strokeStyle;

    // Set line width
    ctx.lineWidth = lineWidth;

    // Draw the spirograph
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.stroke();

    // Reset shadow properties
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
}

// Function to draw the spirograph with animation
function drawSpirograph() {
    console.log('drawSpirograph');

    if (activeGraphIndex === null) return;
    const { ctx, canvas } = spirographs[activeGraphIndex];
    const values = gearValues[activeGraphIndex];

    clearSpirograph();

    if (values.drawing) return; // Prevent multiple animations
    values.drawing = true;
    document.getElementById('drawButton').disabled = true;
    document.getElementById('stopButton').disabled = false;

    const { R, r, O, lineWidth, fixedLineColor, glowIntensity, isRandomColorEnabled } = values;
    let { t } = values;
    const speed = globalConfig.speed;

    const totalTime = 2 * Math.PI * (R / Math.gcd(R, r));
    const startTime = Date.now();

    let prevX = canvas.width / 2 + (R - r) * Math.cos(0) + O * Math.cos(0);
    let prevY = canvas.height / 2 + (R - r) * Math.sin(0) - O * Math.sin(0);

    function draw() {
        if (!values.drawing) return;

        // Calculate elapsed time
        const elapsedTime = Date.now() - startTime;

        // Check if finite time is enabled (finiteToggle checkbox checked)
        if (globalConfig.isFiniteTimeEnabled) {
            // Stop drawing if the elapsed time exceeds MAX_DRAWING_TIME
            if (elapsedTime >= globalConfig.MAX_DRAWING_TIME) {

                handleDrawingFinished();
                return;
            }
        }

        t += 0.01 * speed;

        const x = (R - r) * Math.cos(t) + O * Math.cos((R - r) / r * t);
        const y = (R - r) * Math.sin(t) - O * Math.sin((R - r) / r * t);

        if (isRandomColorEnabled) {
            globalConfig.hue = (globalConfig.hue + 0.075) % 360;
            ctx.strokeStyle = `hsl(${globalConfig.hue}, 100%, 50%)`;
        } else {
            ctx.strokeStyle = fixedLineColor;
        }

        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(canvas.width / 2 + x, canvas.height / 2 + y);
        ctx.stroke();

        prevX = canvas.width / 2 + x;
        prevY = canvas.height / 2 + y;

        if (t >= totalTime) {
            handleDrawingFinished();
        } else {
            values.animationFrameId = requestAnimationFrame(draw);
        }
    }

    draw();
}

function handleDrawingFinished() {
    console.log('handleDrawingFinished');

    // Stop drawing
    stopDrawing();

    // Optionally download the drawing if enabled
    if (document.getElementById('downloadToggle').checked) {
        downloadDrawing();
    }

    // Save the drawing as an image
    // savedImage = new Image();
    // savedImage.src = canvas.toDataURL(); // Save the current canvas content as an image


    // Start zooming in on the drawing
    // isZooming = true;
    // zoomLevel = 1; // Reset zoom level
    // zoomDrawing();

    // Stop the rotation after the wait time and start a new drawing
    setTimeout(() => {
        // isZooming = false; // Stop the zoom
        // zoomLevel = 1;  // Reset zoom level for the next time

        randomizeValues(); // Randomize for the next spirograph
        drawSpirograph();  // Start drawing again
    }, globalConfig.WAIT_TIME_AFTER_DRAW);
}


// Function to stop drawing
function stopDrawing() {
    if (activeGraphIndex === null) return;
    const values = gearValues[activeGraphIndex];

    values.drawing = false;
    cancelAnimationFrame(values.animationFrameId);
    document.getElementById('drawButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
}

// Function to clear the active spirograph
function clearSpirograph() {
    if (activeGraphIndex === null) return;
    const { ctx, canvas } = spirographs[activeGraphIndex];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to randomize values
function randomizeValues() {
    if (activeGraphIndex === null) return;
    const values = gearValues[activeGraphIndex];

    values.R = values.isRLocked ? values.R : getRandomIntInTens(300, 500);
    values.r = values.isrLocked ? values.r : getRandomIntInTens(60, 700);
    values.O = values.isOLocked ? values.O : getRandomIntInTens(20, values.r);
    // values.speed = getRandomInt(5, 25);
    values.lineWidth = getRandomInt(1, 2);
    values.glowIntensity = getRandomInt(0, 30);
    if (values.isRandomColorEnabled) {
        values.fixedLineColor = getRandomColor();
    }

    // // Update global values
    // globalConfig.speed = globalConfig.isRandomSpeedEnabled ? getRandomInt(5, 25) : globalConfig.speed;

    // Update input fields accordingly
    document.getElementById('speed').value = globalConfig.speed;
    document.getElementById('lineWidth').value = lineWidth;
    document.getElementById('glowIntensity').value = glowIntensity;

    syncUIWithValues();
}

// Function to update the background color of the first canvas
function updateBackgroundColor() {
    const bgColor = this.value;
    if (spirographs.length > 0) {
        const { canvas } = spirographs[0];
        canvas.style.backgroundColor = bgColor;
    }
}

// Function to download the combined drawing from all canvases
function downloadDrawing() {
    const timestamp = new Date().toISOString().replace(/[:-]/g, '').replace(/\..+/, '');
    const filename = `Relaxing_Spirals_${timestamp}.png`;
    const bgColor = document.getElementById('bgColorPicker').value;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = width;
    combinedCanvas.height = height;
    const combinedCtx = combinedCanvas.getContext('2d');

    // Fill background color
    // combinedCtx.fillStyle = bgColor;
    // combinedCtx.fillRect(0, 0, width, height);

    // Draw each canvas onto the combined canvas
    spirographs.forEach(({ canvas }) => {
        combinedCtx.drawImage(canvas, 0, 0);
    });

    // Create download link
    const dataURL = combinedCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    link.click();
}

// Helper functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate a random integer between min and max (inclusive), rounded to the nearest 10
function getRandomIntInTens(min, max) {
    const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
    return Math.round(randomInt / 10) * 10; // Round to nearest 10
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// GCD function
Math.gcd = function (a, b) {
    if (!b) return a;
    return Math.gcd(b, a % b);
};

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        // Enter fullscreen mode
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { // Firefox
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
            document.documentElement.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen mode
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    }
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function toggleSettings() {
    const settings = document.getElementById('settings');
    settings.classList.toggle('hidden');
}

// Initialize the application on window load
window.onload = initializeApp;