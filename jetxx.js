let balance = 1000;
let currentMultiplier = 1;
let isRoundActive = false;
let crashMultiplier = 0;
let betAmount = 0;
let crashTime = 0;
let autoCashoutMultiplier = 0;
let roundHistory = [];
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
let playerName = "";
let roundTimeout = null;

const balanceDisplay = document.getElementById('balance');
const startButton = document.getElementById('startButton');
const planeElement = document.getElementById('plane');
const multiplierDisplay = document.getElementById('multiplier');
const cashoutButton = document.getElementById('cashoutButton');
const messageDisplay = document.getElementById('message');
const historyList = document.getElementById('historyList');
const leaderboardList = document.getElementById('leaderboardList');
const resetButton = document.getElementById('resetButton');
const autoCashoutInput = document.getElementById('autoCashout');
const playerNameInput = document.getElementById('playerName');
const roundCountdownDisplay = document.createElement('div');
roundCountdownDisplay.classList.add('round-countdown');
document.body.appendChild(roundCountdownDisplay);

// Sound Effects
const planeStartSound = new Audio('plane-start.mp3');
const planeCrashSound = new Audio('plane-crash.mp3');
const cashoutSound = new Audio('cashout.mp3');

// Change background theme (Day/Night)
let isNightMode = false;
setInterval(() => {
    if (new Date().getHours() > 18 || new Date().getHours() < 6) {
        document.body.classList.add("night-mode");
        isNightMode = true;
    } else {
        document.body.classList.remove("night-mode");
        isNightMode = false;
    }
}, 1000);

startButton.addEventListener('click', startRound);
cashoutButton.addEventListener('click', cashOut);
resetButton.addEventListener('click', resetGame);

function updateLeaderboard() {
    leaderboard.sort((a, b) => b.balance - a.balance);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    leaderboardList.innerHTML = leaderboard.slice(0, 5).map(player => `<li>${player.name}: ${player.balance} Coins</li>`).join('');
}

function startRound() {
    if (isRoundActive) return; // Prevent starting a new round before the current one ends

    playerName = playerNameInput.value.trim() || "Player";
    betAmount = parseFloat(document.getElementById('betAmount').value);
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > balance) {
        alert('Invalid bet amount');
        return;
    }

    autoCashoutMultiplier = parseFloat(autoCashoutInput.value) || 0;
    balance -= betAmount;
    balanceDisplay.textContent = balance;

    isRoundActive = true;
    crashMultiplier = Math.floor(Math.random() * (50 - 5 + 1) + 5); // Random multiplier between 5x and 50x
    crashTime = Math.random() * (10 - 5) + 5; // Random crash time between 5 and 10 seconds

    currentMultiplier = 1;
    multiplierDisplay.textContent = currentMultiplier + "x";
    planeElement.style.left = "0px"; // Reset plane position

    messageDisplay.textContent = "Round started! Wait for the crash...";
    planeStartSound.play();

    cashoutButton.disabled = false;
    let elapsedTime = 0;

    let gameInterval = setInterval(() => {
        if (elapsedTime >= crashTime) {
            clearInterval(gameInterval);
            crashRound();
            return;
        }

        elapsedTime += 0.1;
        currentMultiplier = Math.min(crashMultiplier, 1 + (elapsedTime * 3)); // Increase multiplier smoothly
        multiplierDisplay.textContent = currentMultiplier.toFixed(2) + "x";
        planeElement.style.left = (elapsedTime / crashTime) * 100 + "%"; // Move plane smoothly

        if (autoCashoutMultiplier && currentMultiplier >= autoCashoutMultiplier) {
            cashOut();
        }

    }, 100);
}

function cashOut() {
    if (!isRoundActive) return;

    isRoundActive = false;
    balance += betAmount * currentMultiplier;
    balanceDisplay.textContent = balance;

    roundHistory.push({ multiplier: currentMultiplier, betAmount: betAmount });
    historyList.innerHTML = roundHistory.slice(0, 5).map(round => `<li>${round.betAmount} Coins @ ${round.multiplier}x</li>`).join('');

    messageDisplay.textContent = `You cashed out at ${currentMultiplier.toFixed(2)}x.`;
    cashoutSound.play();

    leaderboard.push({ name: playerName, balance: balance });
    updateLeaderboard();

    cashoutButton.disabled = true;
    prepareNextRound();
}

function crashRound() {
    isRoundActive = false;
    planeCrashSound.play();
    messageDisplay.textContent = `Boom! The plane crashed at ${crashMultiplier}x.`;

    roundHistory.push({ multiplier: crashMultiplier, betAmount: betAmount });
    historyList.innerHTML = roundHistory.slice(0, 5).map(round => `<li>${round.betAmount} Coins @ ${round.multiplier}x</li>`).join('');

    leaderboard.push({ name: playerName, balance: balance });
    updateLeaderboard();

    cashoutButton.disabled = true;
    prepareNextRound();
}

function prepareNextRound() {
    let countdown = 5; // Countdown before the next round starts
    roundCountdownDisplay.textContent = `Next round starts in ${countdown} seconds...`;
    
    let countdownInterval = setInterval(() => {
        countdown--;
        roundCountdownDisplay.textContent = `Next round starts in ${countdown} seconds...`;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            startRound();
            roundCountdownDisplay.textContent = ""; // Hide countdown text after starting the new round
        }
    }, 1000);
}

function resetGame() {
    balance = 1000;
    balanceDisplay.textContent = balance;
    roundHistory = [];
    historyList.innerHTML = '';
    messageDisplay.textContent = 'Game has been reset!';
    cashoutButton.disabled = true;
    roundCountdownDisplay.textContent = ""; // Reset the countdown display

    updateLeaderboard();
}