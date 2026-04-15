(function () {
  'use strict';

  const CELL = 20;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreboard = document.getElementById('scoreboard');
  const roundNum = document.getElementById('round-num');
  const roundTimer = document.getElementById('round-timer');
  const logPanel = document.getElementById('log-panel');
  const statusBadge = document.getElementById('status-badge');
  const modeBadge = document.getElementById('mode-badge');
  const winnerOverlay = document.getElementById('winner-overlay');
  const winnerName = document.getElementById('winner-name');

  // Suppress unused-variable lint: modeBadge is set by server config if needed.
  void modeBadge;

  let currentState = null;

  // --- WebSocket ---

  const ws = new WebSocket('ws://' + location.host);

  ws.onopen = function () {
    statusBadge.textContent = 'LIVE';
    statusBadge.style.color = '#14F195';
    statusBadge.style.borderColor = '#14F195';
  };

  ws.onclose = function () {
    statusBadge.textContent = 'DISCONNECTED';
    statusBadge.style.color = '#ef4444';
    statusBadge.style.borderColor = '#ef4444';
  };

  ws.onmessage = function (event) {
    var msg;
    try {
      msg = JSON.parse(event.data);
    } catch (_) {
      return;
    }

    if (msg.type === 'state') {
      currentState = msg.state;
      render();
      updateScoreboard();
      updateRoundInfo();
      if (currentState.gameOver) {
        showWinner();
      }
    } else if (msg.type === 'log') {
      appendLog(msg.message);
    }
  };

  // --- Rendering ---

  function render() {
    if (!currentState) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSafeZone();
    drawFood();
    drawSnakes();
  }

  function drawSafeZone() {
    var sz = currentState.safeZone;
    if (!sz) return;

    var x = sz.minX * CELL;
    var y = sz.minY * CELL;
    var w = (sz.maxX - sz.minX) * CELL;
    var h = (sz.maxY - sz.minY) * CELL;

    // Fill danger zone (outside safe zone) with translucent red
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    // Top strip
    ctx.fillRect(0, 0, canvas.width, y);
    // Bottom strip
    ctx.fillRect(0, y + h, canvas.width, canvas.height - (y + h));
    // Left strip (between top and bottom strips)
    ctx.fillRect(0, y, x, h);
    // Right strip (between top and bottom strips)
    ctx.fillRect(x + w, y, canvas.width - (x + w), h);

    // Red dashed border around safe zone
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  function drawFood() {
    var food = currentState.food;
    if (!food) return;
    ctx.fillStyle = '#facc15';
    for (var i = 0; i < food.length; i++) {
      var pos = food[i].position;
      var cx = pos.x * CELL + CELL / 2;
      var cy = pos.y * CELL + CELL / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSnakes() {
    var snakes = currentState.snakes;
    if (!snakes) return;

    for (var i = 0; i < snakes.length; i++) {
      var snake = snakes[i];
      if (!snake.body || snake.body.length === 0) continue;

      var color = snake.color || '#14F195';
      ctx.fillStyle = color;

      for (var j = 0; j < snake.body.length; j++) {
        var seg = snake.body[j];
        var isHead = j === 0;
        var pad = isHead ? 1 : 2;
        ctx.fillRect(
          seg.x * CELL + pad,
          seg.y * CELL + pad,
          CELL - pad * 2,
          CELL - pad * 2
        );
      }

      // Draw eyes on head
      if (snake.alive) {
        var head = snake.body[0];
        drawEyes(head, snake.direction);
      }
    }
  }

  function drawEyes(head, direction) {
    var hx = head.x * CELL;
    var hy = head.y * CELL;
    var eyeSize = 3;
    ctx.fillStyle = '#000';

    var eye1, eye2;
    if (direction === 'UP' || direction === 'DOWN') {
      eye1 = { x: hx + 4, y: hy + 4 };
      eye2 = { x: hx + CELL - 4 - eyeSize, y: hy + 4 };
    } else {
      eye1 = { x: hx + 4, y: hy + 4 };
      eye2 = { x: hx + 4, y: hy + CELL - 4 - eyeSize };
    }

    ctx.fillRect(eye1.x, eye1.y, eyeSize, eyeSize);
    ctx.fillRect(eye2.x, eye2.y, eyeSize, eyeSize);
  }

  // --- Scoreboard ---

  function updateScoreboard() {
    if (!currentState || !currentState.snakes) return;

    var snakes = currentState.snakes.slice().sort(function (a, b) {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      return b.score - a.score;
    });

    scoreboard.replaceChildren();

    for (var i = 0; i < snakes.length; i++) {
      var snake = snakes[i];

      var li = document.createElement('li');
      if (!snake.alive) li.classList.add('dead');

      var dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = snake.color || '#14F195';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'snake-name';
      nameSpan.textContent = snake.id + ' (' + snake.strategy + ')';

      var scoreSpan = document.createElement('span');
      scoreSpan.className = 'snake-score';
      scoreSpan.textContent = String(snake.score);

      li.appendChild(dot);
      li.appendChild(nameSpan);
      li.appendChild(scoreSpan);
      scoreboard.appendChild(li);
    }
  }

  // --- Round info ---

  function updateRoundInfo() {
    if (!currentState) return;
    roundNum.textContent = String(currentState.round);
    var secsLeft = Math.ceil((currentState.roundTimeLeft || 0) / 1000);
    roundTimer.textContent = String(secsLeft);
  }

  // --- Log ---

  function appendLog(message) {
    var entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    logPanel.appendChild(entry);
    logPanel.scrollTop = logPanel.scrollHeight;
  }

  // --- Winner ---

  function showWinner() {
    var name = currentState.winner || 'Nobody';
    winnerName.textContent = name;
    winnerOverlay.classList.add('show');
  }

})();
