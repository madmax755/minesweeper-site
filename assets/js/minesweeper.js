// Creates the grid div elements
/**
 * Creates a grid of div elements representing the game board.
 * @param {number} rows - The number of rows in the grid.
 * @param {number} cols - The number of columns in the grid.
 */
function createGrid(rows, cols) {
    container.style.setProperty("--grid-rows", rows);
    container.style.setProperty("--grid-cols", cols);

    // Clear the grid container
    container.innerHTML = "";

    for (let n = 0; n < rows * cols; n++) {
        let cell = document.createElement("div");
        cell.className = "grid-item";
        cell.id = Math.floor(n / rows) + " " + n % rows; // Assigning unique ID

        // Add event listeners for desktop
        cell.onclick = function() {
            dig(this.id);
        };
        cell.oncontextmenu = function(event) {
            event.preventDefault();
            flag(this.id);
        };

        // Add event listeners for mobile
        cell.addEventListener('touchstart', handleTouchStart, false);
        cell.addEventListener('touchend', handleTouchEnd, false);

        // Set alternating cell background colors
        cell.style.backgroundColor = (n % 2 === 0) ? "#8ecc39" : "#a7d948";
        container.appendChild(cell);
    }
}

let touchTimer = null;
const touchDuration = 400; // milliseconds for long press
let touchMoved = false;

/**
 * Handles the start of a touch event on a cell.
 * @param {TouchEvent} event - The touch event.
 */
function handleTouchStart(event) {
    event.preventDefault(); // Prevent the device's default context menu
    touchMoved = false;
    touchTimer = setTimeout(() => {
        console.log(event.target.id)
        flag(event.target.id);
        touchTimer = null;
    }, touchDuration);
}

/**
 * Handles the end of a touch event on a cell.
 * @param {TouchEvent} event - The touch event.
 */
function handleTouchEnd(event) {
    if (touchTimer) {
        clearTimeout(touchTimer);
        if (!touchMoved) {
            dig(event.target.id);
        }
        touchTimer = null;
    }
}

/**
 * Handles touch movement to prevent unintended actions.
 */
function handleTouchMove(event) {
    touchMoved = true;
}

/**
 * Checks if the game has been won.
 */
function checkWin() {
    let isWin = true;
    console.log("Checking win condition...");
    
    // Check if all bombs are flagged
    for (let row = 0; row < bombNumArray.length; row++) {
        for (let col = 0; col < bombNumArray[row].length; col++) {
            if (bombNumArray[row][col] === "b" && !flagged.some(f => arraysEqual(f, [row, col]))) {
                console.log(`Bomb at [${row}, ${col}] not flagged.`);
                isWin = false;
                break;
            }
        }
        if (!isWin) break;
    }

    // Check if only bombs are flagged
    if (isWin) {
        for (let i = 0; i < flagged.length; i++) {
            if (bombNumArray[flagged[i][0]][flagged[i][1]] !== "b") {
                console.log(`Non-bomb cell [${flagged[i][0]}, ${flagged[i][1]}] flagged incorrectly.`);
                isWin = false;
                break;
            }
        }
    }

    // Check if all non-bomb cells are dug
    if (isWin) {
        for (let row = 0; row < bombNumArray.length; row++) {
            for (let col = 0; col < bombNumArray[row].length; col++) {
                if (bombNumArray[row][col] !== "b" && !alreadyDug.some(d => arraysEqual(d, [row, col]))) {
                    console.log(`Non-bomb cell [${row}, ${col}] not dug.`);
                    isWin = false;
                    break;
                }
            }
            if (!isWin) break;
        }
    }

    if (isWin) {
        console.log("Win condition met. Showing win overlay.");
        showWinOverlay();
    } else {
        console.log("Win condition not met.");
    }
}

/**
 * Displays the win overlay and restarts the game after a delay.
 */
function showWinOverlay() {
    let winOverlay = document.createElement('div');
    winOverlay.classList.add('overlay');
    winOverlay.style.display = 'flex';
    winOverlay.style.backgroundImage = "url('win.webp')"
    document.body.appendChild(winOverlay);
    
    setTimeout(() => {
        document.body.removeChild(winOverlay);
        new_game(gameMode); // Restart or offer to start a new game
    }, 5000);
}

/**
 * Compares two arrays for equality.
 * @param {Array} a1 - The first array.
 * @param {Array} a2 - The second array.
 * @returns {boolean} - True if arrays are equal, false otherwise.
 */
function arraysEqual(a1, a2) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1) == JSON.stringify(a2);
};

/**
 * Checks if an array is present in another array of arrays.
 * @param {Array} arr - The array of arrays to search in.
 * @param {Array} item - The array to search for.
 * @returns {boolean} - True if the item is found, false otherwise.
 */
function isArrayInArray(arr, item) {
    var item_as_string = JSON.stringify(item);

    var contains = arr.some(function(ele) {
        return JSON.stringify(ele) === item_as_string;
    });
    return contains;
};

/**
 * Generates bomb positions, excluding a specific cell and its surroundings.
 * @param {Array} excluded - The cell to exclude [row, col].
 */
function generateBombSpaces(excluded) {
    var currentBombs = [];

    while (currentBombs.length < bombNums) {
        var random = [Math.floor((Math.random() * rows)), Math.floor((Math.random() * cols))];

        // Check if the random position is not in the excluded area
        var topleft = !arraysEqual(random, [excluded[0] - 1, excluded[1] - 1]);
        var top = !arraysEqual(random, [excluded[0] - 1, excluded[1]]);
        var topright = !arraysEqual(random, [excluded[0] - 1, excluded[1] + 1]);
        var right = !arraysEqual(random, [excluded[0], excluded[1] + 1]);
        var bottomright = !arraysEqual(random, [excluded[0] + 1, excluded[1] + 1]);
        var bottom = !arraysEqual(random, [excluded[0] + 1, excluded[1]]);
        var bottomleft = !arraysEqual(random, [excluded[0] + 1, excluded[1] - 1]);
        var left = !arraysEqual(random, [excluded[0], excluded[1] - 1]);

        var condition = !arraysEqual(random, excluded) && topleft && top && topright && right && bottomright && bottom && bottomleft && left;

        if (!currentBombs.includes(random) && condition) {
            currentBombs.push(random);
        }
    }

    for (var bombPos of currentBombs) {
        bombNumArray[bombPos[0]][bombPos[1]] = "b";
    }
};

/**
 * Populates the grid with numbers indicating nearby bombs.
 */
function populateNumbers() {
    console.log(bombNumArray)
    for (var row = 0; row < bombNumArray.length; row++) {
        for (var column = 0; column < bombNumArray.length; column++) {
            let cell = bombNumArray[row][column];

            if (cell[0] == "b") {
                incrementAround(row, column);
            }
        }
    }

    // Fix up bomb situation with numbers at end
    for (var row = 0; row < bombNumArray.length; row++) {
        for (var column = 0; column < bombNumArray.length; column++) {
            let cell = bombNumArray[row][column];

            if (cell[0] == "b") {
                bombNumArray[row][column] = "b"
            }
        }
    }
}

/**
 * Increments the count of nearby bombs for cells around a bomb.
 * @param {number} row - The row of the bomb.
 * @param {number} column - The column of the bomb.
 */
function incrementAround(row, column) {
    // Handle different cases based on the position of the bomb
    // Top row, not corners
    if (row == 0 && column != 0 && column != cols - 1) {
        bombNumArray[row][column - 1] += 1;
        bombNumArray[row + 1][column - 1] += 1;
        bombNumArray[row + 1][column] += 1;
        bombNumArray[row + 1][column + 1] += 1;
        bombNumArray[row][column + 1] += 1;
    }
    // Top left corner
    else if (row == 0 && column == 0) {
        bombNumArray[row + 1][column] += 1;
        bombNumArray[row + 1][column + 1] += 1;
        bombNumArray[row][column + 1] += 1;
    }
    // Top right corner
    else if (row == 0 && column == cols - 1) {
        bombNumArray[row][column - 1] += 1;
        bombNumArray[row + 1][column - 1] += 1;
        bombNumArray[row + 1][column] += 1;
    }
    // Left column, not corners
    else if (row != rows - 1 && column == 0 && row != 0) {
        bombNumArray[row - 1][column] += 1;
        bombNumArray[row - 1][column + 1] += 1;
        bombNumArray[row][column + 1] += 1;
        bombNumArray[row + 1][column + 1] += 1;
        bombNumArray[row + 1][column] += 1;
    }
    // Bottom left corner
    else if (row == rows - 1 && column == 0) {
        bombNumArray[row - 1][column + 1] += 1;
        bombNumArray[row][column + 1] += 1;
        bombNumArray[row - 1][column] += 1;
    }
    // Bottom row, not corners
    else if (row == rows - 1 && column != 0 && column != cols - 1) {
        bombNumArray[row][column - 1] += 1;
        bombNumArray[row - 1][column - 1] += 1;
        bombNumArray[row - 1][column] += 1;
        bombNumArray[row - 1][column + 1] += 1;
        bombNumArray[row][column + 1] += 1;
    }
    // Bottom right corner
    else if (row == rows - 1 && column == cols - 1) {
        bombNumArray[row][column - 1] += 1;
        bombNumArray[row - 1][column - 1] += 1;
        bombNumArray[row - 1][column] += 1;
    }
    // Right column, not corners
    else if (row != 0 && row != rows - 1 && column == cols - 1) {
        bombNumArray[row][column - 1] += 1;
        bombNumArray[row - 1][column - 1] += 1;
        bombNumArray[row + 1][column - 1] += 1;
        bombNumArray[row - 1][column] += 1;
        bombNumArray[row + 1][column] += 1;
    } 
    // Middle of the grid
    else {
        bombNumArray[row - 1][column - 1] += 1;
        bombNumArray[row - 1][column] += 1;
        bombNumArray[row - 1][column + 1] += 1;
        bombNumArray[row][column - 1] += 1;
        bombNumArray[row][column + 1] += 1;
        bombNumArray[row + 1][column - 1] += 1;
        bombNumArray[row + 1][column] += 1;
        bombNumArray[row + 1][column + 1] += 1;
    }
}

/**
 * Handles the digging action on a cell.
 * @param {Array|string} posarr - The position of the cell [row, col] or "row col".
 */
function dig(posarr) {
    console.log("digging");
    // Converts string 2d position to int array
    if (!Array.isArray(posarr)) {
        posarr = posarr.split(" ");
        posarr = [parseInt(posarr[0]), parseInt(posarr[1])]
    }
    if (posarr[0] >= 0 && posarr[1] >= 0 && posarr[0] < rows && posarr[1] < cols) {
        // Handles starting click to create a grid based on that
        if (!started) {
            createCustomGrid(posarr);
            started = true;
            dig(posarr);
        } 
        // Normal use case
        else if (!isArrayInArray(alreadyDug, posarr) && !isArrayInArray(flagged, posarr)) {
            var stringpos = posarr.join(" ");
            var element = document.getElementById(stringpos);
            alreadyDug.push(posarr);
            
            // Sets the alternating dirt color based on odd or even sums of position
            if ((posarr[0] + posarr[1]) % 2 == 0) {
                element.style.backgroundColor = "#3e3117";
            } else {
                element.style.backgroundColor = "#4d3c1c";
            }

            if (bombNumArray[posarr[0]][posarr[1]] == "0") {
                element.innerHTML = "";
                console.log("into the 0 around section");
                
                // Recursively dig surrounding cells
                dig([posarr[0] - 1, posarr[1] - 1])
                dig([posarr[0] - 1, posarr[1]])
                dig([posarr[0] - 1, posarr[1] + 1])
                dig([posarr[0], posarr[1] - 1])
                dig([posarr[0], posarr[1]])
                dig([posarr[0], posarr[1] + 1])
                dig([posarr[0] + 1, posarr[1] - 1])
                dig([posarr[0] + 1, posarr[1]])
                dig([posarr[0] + 1, posarr[1] + 1])
                
            } else if (bombNumArray[posarr[0]][posarr[1]] == "b") {
                element.innerHTML = "<img src='assets/media/bomb.png'>";
                fail();
                
            // Usual case where do not click on a zero or bomb
            } else {
                element.innerHTML = bombNumArray[posarr[0]][posarr[1]];
            }
        }
    }
    checkWin()
}

/**
 * Handles the flagging action on a cell.
 * @param {Array|string} posarr - The position of the cell [row, col] or "row col".
 */
function flag(posarr) {
    // Converts string 2d position to int array
    if (!Array.isArray(posarr)) {
        posarr = posarr.split(" ");
        posarr = [parseInt(posarr[0]), parseInt(posarr[1])]
    }

    if (!isArrayInArray(alreadyDug, posarr)) {
        if (isArrayInArray(flagged, posarr)) {
            let index = flagged.indexOf(subarray => JSON.stringify(subarray) === JSON.stringify(posarr))
            flagged.splice(index, 1);
            document.getElementById(posarr.join(" ")).innerHTML = "";
        } else {
            document.getElementById(posarr.join(" ")).innerHTML = "<img src='assets/media/flag.png' class='flag'>";
            flagged.push(posarr)
        }
    }
    checkWin()
}

/**
 * Creates a custom grid based on the first clicked cell.
 * @param {Array} clicked - The position of the first clicked cell [row, col].
 */
function createCustomGrid(clicked) {
    clicked = [parseInt(clicked[0]), parseInt(clicked[1])]
    generateBombSpaces(clicked);
    populateNumbers();
}

/**
 * Starts a new game with the specified difficulty mode.
 * @param {string} mode - The difficulty mode ("easy", "med", or "hard").
 */
function new_game(mode) {
    switch (mode) {
        case "easy":
            rows = 7;
            break;
        case "med":
            rows = 11;
            break;
        case "hard":
            rows = 19;
            break;
        default:
            rows = 11;
            break;
    }

    gameMode = mode
    cols = rows;
    bombNums = Math.floor(rows * cols / 6)
    container = document.getElementById("grid-container");
    bombNumArray = Array(rows)
    alreadyDug = [];
    flagged = [];
    started = false;

    // Initializes the cell values to 0
    for (let i = 0; i < bombNumArray.length; i++) {
        bombNumArray[i] = new Array(cols).fill(0);
    };

    createGrid(rows, cols);
}

/**
 * Preloads an image.
 * @param {string} url - The URL of the image to preload.
 * @returns {Promise} A promise that resolves with the loaded image.
 */
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    });
}

// URL of the background image
const backgroundImageUrl = 'assets/media/scary.png';

// Load the scary sound
let scarySound = new Audio('assets/media/scream.mp3');
scarySound.preload = 'auto';
scarySound.volume = 1;
let failoverlay = document.createElement('div');
failoverlay.classList.add('overlay');
failoverlay.style.backgroundSize = "contain";
failoverlay.style.backgroundPosition = "center";
failoverlay.style.backgroundRepeat = "no-repeat";
failoverlay.style.backgroundColor = "black";
document.body.appendChild(failoverlay);

// Preload the background image
preloadImage(backgroundImageUrl)
.then((img) => {
    // Apply the preloaded image as the background of the div
    failoverlay.style.backgroundImage = `url(${backgroundImageUrl})`;
})
.catch((error) => {
    console.error(error);
});

/**
 * Handles the game over scenario when a bomb is clicked.
 */
function fail() {
    scarySound.play().catch(error => console.error('Error playing sound:', error));
    
    failoverlay.style.backgroundImage = `url(${backgroundImageUrl})`
    failoverlay.style.display = "flex";
    
    setTimeout(() => {
        failoverlay.style.display = 'none';
        new_game(gameMode);
    }, 4000);
}

var overlay = document.createElement('div');
overlay.classList.add("overlay");
overlay.id = 'secret';
document.body.appendChild(overlay);

document.getElementById("submit-secret").onclick = function() {checkCode()}

const encryptedContent = '9GjUWtvwFwRm036LYBMnTiTFBgzHautSE2GTjdsyt/h1QPHwRQ7gzn8dNeRh8gz7YHDH74jU7NLZZWmZS2ij33LZOC/1dLAXWbPcC2S5o+TgyqCgea6gnBjvQ2N1TaUFOTsN/rCaWDYza+aXBKb2f+Tp8OAXDsKqZB5JfvEGM5I='; // Replace this with your encrypted content

/**
 * Checks the entered secret code and displays decrypted content if correct.
 */
function checkCode() {
    const userCode = document.getElementById('secret-input').value;
    console.log("User entered code:", userCode);

    try {
        // Pad the key to 32 bytes
        let key = userCode.padEnd(32, '\0');

        // Decode the base64 encrypted content
        let encryptedBytes = CryptoJS.enc.Base64.parse(encryptedContent);

        // Decrypt
        let decryptedData = CryptoJS.AES.decrypt(
            { ciphertext: encryptedBytes },
            CryptoJS.enc.Utf8.parse(key),
            { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
        );

        let decryptedContent = decryptedData.toString(CryptoJS.enc.Utf8);
        console.log("Decrypted content:", decryptedContent);

        if (decryptedContent) {
            console.log("Decryption successful");
            let overlay = document.getElementById('secret')
            overlay.style.display = 'flex';
            overlay.textContent = decryptedContent;
            let img = document.createElement('div');
            img.style.width = '100vw';
            img.style.paddingTop = '5vh';
            
            img.innerHTML = '<img class="responsive-image" src="assets/media/cutie.png">';
            overlay.appendChild(img)
        } else {
            console.log("Decryption resulted in empty string");
        }
    } catch (error) {
        console.error("Decryption error:", error);
    }
}

// Global variables
let rows;
let cols;
let bombNums;
var container;
var bombNumArray;
var alreadyDug;
var flagged;
var started;
let gameMode;

// Event listeners for difficulty buttons
document.getElementById("easy").onclick = function() {new_game("easy")};
document.getElementById("med").onclick = function() {new_game("med")};
document.getElementById("hard").onclick = function() {new_game("hard")};

// Start a new game
new_game(gameMode);