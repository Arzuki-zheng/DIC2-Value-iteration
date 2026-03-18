const gridSize = 5;
let startPos = [0, 0];
let endPos = [4, 4];
let blocks = [[1, 1], [2, 2], [3, 3]];
let currentMode = 'start';

const arrowMap = {
    'UP': '↑',
    'DOWN': '↓',
    'LEFT': '←',
    'RIGHT': '→',
    'GOAL': '★',
    'BLOCK': '✖'
};

function initGrid() {
    const gridEl = document.getElementById('grid');
    gridEl.innerHTML = '';
    
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;
            cell.onclick = () => handleCellClick(r, c);
            
            const randomArrows = ['↑', '↓', '←', '→'];
            const randomArrow = randomArrows[Math.floor(Math.random() * 4)];
            
            cell.innerHTML = `
                <div class="value"></div>
                <div class="arrow">${randomArrow}</div>
            `;
            
            updateCellVisuals(cell, r, c);
            gridEl.appendChild(cell);
        }
    }
}

function updateCellVisuals(cell, r, c) {
    cell.classList.remove('start', 'end', 'block');
    const arrowEl = cell.querySelector('.arrow');
    
    if (r === startPos[0] && c === startPos[1]) {
        cell.classList.add('start');
        cell.querySelector('.value').innerText = 'START';
    } else if (r === endPos[0] && c === endPos[1]) {
        cell.classList.add('end');
        cell.querySelector('.value').innerText = 'END';
        arrowEl.innerText = '★';
    } else if (blocks.some(b => b[0] === r && b[1] === c)) {
        cell.classList.add('block');
        cell.querySelector('.value').innerText = '';
        arrowEl.innerText = '✖';
    }
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');
}

function handleCellClick(r, c) {
    if (currentMode === 'start') {
        startPos = [r, c];
    } else if (currentMode === 'end') {
        endPos = [r, c];
    } else if (currentMode === 'block') {
        const index = blocks.findIndex(b => b[0] === r && b[1] === c);
        if (index > -1) {
            blocks.splice(index, 1);
        } else {
            blocks.push([r, c]);
        }
    }
    
    // Refresh all cell classes
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = document.getElementById(`cell-${i}-${j}`);
            updateCellVisuals(cell, i, j);
        }
    }
}

async function runValueIteration() {
    const response = await fetch('/api/value_iteration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: startPos, end: endPos, blocks: blocks })
    });
    
    const data = await response.json();
    displayResults(data.values, data.policy);
}

function displayResults(values, policy) {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = document.getElementById(`cell-${r}-${c}`);
            const valEl = cell.querySelector('.value');
            const arrowEl = cell.querySelector('.arrow');
            
            const v = values[`${r},${c}`];
            const p = policy[`${r},${c}`];
            
            if (r === startPos[0] && c === startPos[1]) {
                valEl.innerText = 'START (' + v.toFixed(1) + ')';
            } else if (r === endPos[0] && c === endPos[1]) {
                valEl.innerText = v.toFixed(1);
                arrowEl.innerText = '★';
            } else if (blocks.some(b => b[0] === r && b[1] === c)) {
                valEl.innerText = '';
                arrowEl.innerText = '✖';
            } else {
                valEl.innerText = v.toFixed(1);
                arrowEl.innerText = arrowMap[p] || '?';
            }
        }
    }
}

function resetGrid() {
    initGrid();
}

window.onload = initGrid;
