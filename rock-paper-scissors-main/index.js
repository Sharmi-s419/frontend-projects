const data = {
    rock:     { emoji: '🪨', beats: 'scissors', label: 'Rock' },
    paper:    { emoji: '📄', beats: 'rock',     label: 'Paper' },
    scissors: { emoji: '✂️', beats: 'paper',    label: 'Scissors' },
  };

  let scores = { player: 0, cpu: 0 };
  let rounds = 0;
  let busy = false;
  const choices = ['rock', 'paper', 'scissors'];

  const playerEmoji     = document.getElementById('playerEmoji');
  const cpuEmoji        = document.getElementById('cpuEmoji');
  const playerChoiceName = document.getElementById('playerChoiceName');
  const cpuChoiceName   = document.getElementById('cpuChoiceName');
  const resultBanner    = document.getElementById('resultBanner');
  const playerArena     = document.getElementById('playerArena');
  const cpuArena        = document.getElementById('cpuArena');
  const playerScore     = document.getElementById('playerScore');
  const cpuScore        = document.getElementById('cpuScore');
  const roundsPlayed    = document.getElementById('roundsPlayed');
  const btns            = document.querySelectorAll('.choice-btn');

  function play(playerChoice) {
    if (busy) return;
    busy = true;
    btns.forEach(b => b.disabled = true);

    // Reset arenas
    playerArena.className = 'arena-side';
    cpuArena.className = 'arena-side';
    resultBanner.className = 'result-banner idle';
    resultBanner.textContent = '...';

    // Show shake animation
    playerEmoji.textContent = '👊';
    cpuEmoji.textContent = '👊';
    playerEmoji.className = 'choice-emoji shake';
    cpuEmoji.className = 'choice-emoji shake';
    playerChoiceName.textContent = '—';
    cpuChoiceName.textContent = '—';

    setTimeout(() => {
      const cpuChoice = choices[Math.floor(Math.random() * 3)];
      rounds++;
      roundsPlayed.textContent = `ROUND ${rounds}`;

      // Reveal
      playerEmoji.textContent = data[playerChoice].emoji;
      cpuEmoji.textContent    = data[cpuChoice].emoji;
      playerEmoji.className = 'choice-emoji reveal';
      cpuEmoji.className    = 'choice-emoji reveal';
      playerChoiceName.textContent = data[playerChoice].label;
      cpuChoiceName.textContent    = data[cpuChoice].label;

      // Determine result
      let result, banner;
      if (playerChoice === cpuChoice) {
        result = 'tie';
        banner = "TIE GAME";
        playerArena.classList.add('tied');
        cpuArena.classList.add('tied');
      } else if (data[playerChoice].beats === cpuChoice) {
        result = 'win';
        banner = "YOU WIN!";
        scores.player++;
        playerArena.classList.add('winner');
        cpuArena.classList.add('loser');
        playerScore.textContent = scores.player;
        spawnBurst('win');
      } else {
        result = 'lose';
        banner = "CPU WINS!";
        scores.cpu++;
        cpuArena.classList.add('winner');
        playerArena.classList.add('loser');
        cpuScore.textContent = scores.cpu;
        spawnBurst('lose');
      }

      resultBanner.className = `result-banner ${result}`;
      resultBanner.textContent = banner;

      setTimeout(() => {
        btns.forEach(b => b.disabled = false);
        busy = false;
      }, 400);

    }, 700);
  }

  function spawnBurst(type) {
    const el = document.createElement('div');
    el.className = `burst ${type}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  function resetGame() {
    scores = { player: 0, cpu: 0 };
    rounds = 0;
    playerScore.textContent = '0';
    cpuScore.textContent = '0';
    roundsPlayed.textContent = 'ROUND 0';
    playerEmoji.textContent = '❓';
    cpuEmoji.textContent = '❓';
    playerEmoji.className = 'choice-emoji';
    cpuEmoji.className = 'choice-emoji';
    playerChoiceName.textContent = '—';
    cpuChoiceName.textContent = '—';
    playerArena.className = 'arena-side';
    cpuArena.className = 'arena-side';
    resultBanner.className = 'result-banner idle';
    resultBanner.textContent = 'CHOOSE YOUR WEAPON';
  }