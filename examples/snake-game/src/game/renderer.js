(function () {
  'use strict';

  var CELL = 20;

  // --- DOM refs ---
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var scoreboard = document.getElementById('scoreboard');
  var roundNum = document.getElementById('round-num');
  var roundTimer = document.getElementById('round-timer');
  var logPanel = document.getElementById('log-panel');
  var statusBadge = document.getElementById('status-badge');
  var winnerOverlay = document.getElementById('winner-overlay');
  var winnerName = document.getElementById('winner-name');
  var phaseChip = document.getElementById('phase-chip');
  var modeSelect = document.getElementById('mode-select');
  var btnStart = document.getElementById('btn-start');
  var btnRestart = document.getElementById('btn-restart');
  var btnPlayAgain = document.getElementById('btn-play-again');
  var btnRetry = document.getElementById('btn-retry');
  var speed1x = document.getElementById('speed-1x');
  var speed2x = document.getElementById('speed-2x');
  var speed5x = document.getElementById('speed-5x');
  var preflightPanel = document.getElementById('preflight-panel');
  var preflightList = document.getElementById('preflight-list');
  var preflightMsg = document.getElementById('preflight-msg');
  var arenaInfoSection = document.getElementById('arena-info-section');

  var currentState = null;
  var ws = null;
  var reconnectDelay = 1000;

  // --- Log kind config ---
  var LOG_TAGS = {
    create: { tag: 'CREATE', cls: 'log-tag-create' },
    register: { tag: 'REGISTER', cls: 'log-tag-register' },
    enter: { tag: 'ENTER', cls: 'log-tag-enter' },
    start: { tag: 'START', cls: 'log-tag-start' },
    eliminate: { tag: 'ELIM', cls: 'log-tag-eliminate' },
    finalize: { tag: 'FINAL', cls: 'log-tag-finalize' },
    info: { tag: 'INFO', cls: 'log-tag-info' },
  };

  // --- Phase chip colors ---
  var PHASE_COLORS = {
    lobby: '#888',
    setup: '#60a5fa',
    preflight: '#fbbf24',
    active: '#14F195',
    finished: '#fbbf24',
  };

  // --- WebSocket ---
  function connect() {
    ws = new WebSocket('ws://' + location.host);

    ws.onopen = function () {
      reconnectDelay = 1000;
      statusBadge.textContent = 'LIVE';
      statusBadge.style.color = '#14F195';
      statusBadge.style.borderColor = '#14F195';
    };

    ws.onclose = function () {
      statusBadge.textContent = 'RECONNECTING...';
      statusBadge.style.color = '#fbbf24';
      statusBadge.style.borderColor = '#fbbf24';
      setTimeout(function () {
        reconnectDelay = Math.min(reconnectDelay * 2, 10000);
        connect();
      }, reconnectDelay);
    };

    ws.onmessage = function (event) {
      var msg;
      try { msg = JSON.parse(event.data); } catch (_) { return; }

      if (msg.type === 'state') {
        currentState = msg.state;
        render();
        updateScoreboard();
        updateRoundInfo();
        if (currentState.gameOver) showWinner();
      } else if (msg.type === 'log') {
        appendLog(msg);
      } else if (msg.type === 'phase') {
        updatePhase(msg.phase);
      } else if (msg.type === 'reset') {
        handleReset();
      } else if (msg.type === 'preflight') {
        handlePreflight(msg);
      } else if (msg.type === 'arena-info') {
        handleArenaInfo(msg);
      } else if (msg.type === 'speed') {
        updateSpeedButtons(msg.multiplier);
      }
    };
  }

  function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // --- Controls ---
  btnStart.addEventListener('click', function () {
    var mode = modeSelect.value;
    send({ type: 'start', mode: mode });
    btnStart.disabled = true;
    modeSelect.disabled = true;
  });

  btnRestart.addEventListener('click', function () {
    send({ type: 'restart' });
  });

  btnPlayAgain.addEventListener('click', function () {
    winnerOverlay.classList.remove('show');
    send({ type: 'restart' });
  });

  btnRetry.addEventListener('click', function () {
    send({ type: 'start', mode: 'devnet' });
  });

  [speed1x, speed2x, speed5x].forEach(function (btn) {
    btn.addEventListener('click', function () {
      var mult = parseInt(btn.textContent);
      send({ type: 'speed', multiplier: mult });
    });
  });

  function updateSpeedButtons(mult) {
    [speed1x, speed2x, speed5x].forEach(function (btn) {
      var btnMult = parseInt(btn.textContent);
      if (btnMult === mult) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --- Phase ---
  function updatePhase(p) {
    phaseChip.textContent = p.toUpperCase();
    // Find color — check if starts with "round" for active rounds
    var colorKey = p.startsWith('round') ? 'active' : p;
    var color = PHASE_COLORS[colorKey] || '#888';
    phaseChip.style.color = color;
    phaseChip.style.borderColor = color;

    // Update arena state display
    var arenaState = document.getElementById('arena-state');
    if (arenaState) arenaState.textContent = p.toUpperCase();

    // Enable/disable controls based on phase
    if (p === 'lobby') {
      btnStart.disabled = false;
      modeSelect.disabled = false;
      btnRestart.disabled = true;
    } else if (p === 'finished') {
      btnStart.disabled = false;
      modeSelect.disabled = false;
      btnRestart.disabled = false;
    } else {
      btnStart.disabled = true;
      modeSelect.disabled = true;
      btnRestart.disabled = true;
    }
  }

  // --- Reset ---
  function handleReset() {
    currentState = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scoreboard.replaceChildren();
    logPanel.replaceChildren();
    roundNum.textContent = '—';
    roundTimer.textContent = '—';
    winnerOverlay.classList.remove('show');
    preflightPanel.style.display = 'none';
    arenaInfoSection.style.display = 'none';
  }

  // --- Preflight ---
  function handlePreflight(msg) {
    if (msg.status === 'checking' || msg.status === 'failed') {
      preflightPanel.style.display = 'flex';
      preflightList.replaceChildren();

      for (var i = 0; i < msg.checks.length; i++) {
        var check = msg.checks[i];
        var li = document.createElement('li');

        var icon = document.createElement('span');
        icon.className = 'check-icon';
        if (check.status === 'ok') {
          icon.textContent = '\u2714';
          icon.classList.add('check-ok');
        } else if (check.status === 'fail') {
          icon.textContent = '\u2718';
          icon.classList.add('check-fail');
        } else {
          icon.textContent = '\u2022';
          icon.classList.add('check-pending');
        }

        var nameSpan = document.createElement('span');
        nameSpan.textContent = check.name + ': ' + check.detail;

        li.appendChild(icon);
        li.appendChild(nameSpan);
        preflightList.appendChild(li);
      }

      if (msg.status === 'failed') {
        preflightMsg.textContent = 'Some checks failed. Fund master wallet at faucet.solana.com, then run: npm run setup:devnet';
        btnRetry.style.display = 'inline-block';
      } else {
        preflightMsg.textContent = 'Checking...';
        btnRetry.style.display = 'none';
      }
    } else if (msg.status === 'ready') {
      preflightPanel.style.display = 'none';
    }
  }

  // --- Arena Info ---
  function handleArenaInfo(msg) {
    arenaInfoSection.style.display = 'block';
    document.getElementById('arena-id').textContent = String(msg.arenaId);
    document.getElementById('arena-fee').textContent = msg.entryFee + ' USDC';
    document.getElementById('arena-pool').textContent = msg.prizePool + ' USDC';
    document.getElementById('arena-split').textContent = msg.prizeSplit.join('/') + '% to winner';
    document.getElementById('arena-mode').textContent = msg.mode.toUpperCase();

    var addrRow = document.getElementById('arena-address-row');
    var addrSpan = document.getElementById('arena-address');
    if (msg.explorerUrl && msg.address) {
      addrRow.style.display = 'block';
      addrSpan.replaceChildren();
      var link = document.createElement('a');
      link.href = msg.explorerUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = msg.address.slice(0, 8) + '...';
      addrSpan.appendChild(link);
    } else {
      addrRow.style.display = 'none';
    }
  }

  // --- Rendering ---
  function render() {
    if (!currentState) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSafeZone();
    drawFood();
    drawSnakes();
    drawBotLabels();
  }

  function drawSafeZone() {
    var sz = currentState.safeZone;
    if (!sz) return;
    var x = sz.minX * CELL;
    var y = sz.minY * CELL;
    var w = (sz.maxX - sz.minX) * CELL;
    var h = (sz.maxY - sz.minY) * CELL;

    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(0, 0, canvas.width, y);
    ctx.fillRect(0, y + h, canvas.width, canvas.height - (y + h));
    ctx.fillRect(0, y, x, h);
    ctx.fillRect(x + w, y, canvas.width - (x + w), h);

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
      ctx.beginPath();
      ctx.arc(pos.x * CELL + CELL / 2, pos.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSnakes() {
    var snakes = currentState.snakes;
    if (!snakes) return;
    for (var i = 0; i < snakes.length; i++) {
      var snake = snakes[i];
      if (!snake.body || snake.body.length === 0) continue;
      ctx.fillStyle = snake.color || '#14F195';
      for (var j = 0; j < snake.body.length; j++) {
        var seg = snake.body[j];
        var pad = j === 0 ? 1 : 2;
        ctx.fillRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
      }
      if (snake.alive) {
        drawEyes(snake.body[0], snake.direction);
      }
    }
  }

  function drawEyes(head, direction) {
    var hx = head.x * CELL;
    var hy = head.y * CELL;
    ctx.fillStyle = '#000';
    var s = 3;
    if (direction === 'up' || direction === 'down') {
      ctx.fillRect(hx + 4, hy + 4, s, s);
      ctx.fillRect(hx + CELL - 4 - s, hy + 4, s, s);
    } else {
      ctx.fillRect(hx + 4, hy + 4, s, s);
      ctx.fillRect(hx + 4, hy + CELL - 4 - s, s, s);
    }
  }

  function drawBotLabels() {
    var snakes = currentState.snakes;
    if (!snakes) return;
    ctx.save();
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (var i = 0; i < snakes.length; i++) {
      var snake = snakes[i];
      if (!snake.alive || !snake.body || snake.body.length === 0) continue;
      var head = snake.body[0];
      var label = botLabelFromId(snake.id);
      var lx = head.x * CELL + CELL / 2;
      var ly = head.y * CELL - 2;
      // Shadow for contrast
      ctx.fillStyle = '#000';
      ctx.fillText(label, lx + 1, ly + 1);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, lx, ly);
    }
    ctx.restore();
  }

  function botLabelFromId(id) {
    var parts = id.split('-');
    return (parts[0][0].toUpperCase() + (parts[1] || '')).slice(0, 2);
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
    roundTimer.textContent = String(Math.ceil((currentState.roundTimeLeft || 0) / 1000));
  }

  // --- Log ---
  function appendLog(msg) {
    var entry = document.createElement('div');
    entry.className = 'log-entry flash';

    var tagConfig = LOG_TAGS[msg.kind] || LOG_TAGS.info;
    var tag = document.createElement('span');
    tag.className = 'log-tag ' + tagConfig.cls;
    tag.textContent = '[' + tagConfig.tag + ']';
    entry.appendChild(tag);

    var msgSpan = document.createElement('span');
    msgSpan.textContent = ' ' + msg.message;
    entry.appendChild(msgSpan);

    if (msg.explorerUrl) {
      var link = document.createElement('a');
      link.className = 'log-explorer';
      link.href = msg.explorerUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = '[Explorer]';
      entry.appendChild(link);
    } else if (msg.tx) {
      var txSpan = document.createElement('span');
      txSpan.style.color = '#14F195';
      txSpan.style.marginLeft = '6px';
      txSpan.style.fontSize = '0.65rem';
      txSpan.textContent = msg.tx;
      entry.appendChild(txSpan);
    }

    logPanel.appendChild(entry);
    logPanel.scrollTop = logPanel.scrollHeight;

    // Remove flash class after animation
    setTimeout(function () { entry.classList.remove('flash'); }, 500);
  }

  // --- Winner ---
  function showWinner() {
    var name = currentState.winner || 'Nobody';
    winnerName.textContent = name;
    winnerOverlay.classList.add('show');
  }

  // --- Init ---
  connect();

})();
