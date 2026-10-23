(() => {
  "use strict";

  const SIZE = 7;
  const COLORS = ["#32879a", "#c65f4e", "#4e8b61", "#d2a339"];
  const COLOR_NAMES = ["Błękitny", "Czerwony", "Zielony", "Żółty"];
  const TREASURE_IDS = Array.from({ length: 25 }, (_, index) => index + 1).filter((id) => id !== 12);
  const TREASURE_NAMES = {
    1: "Klejnoty",
    2: "Ptaki",
    3: "Święty ptak",
    4: "Lecący ptak",
    5: "Kronikarz",
    6: "Bóstwo z głową zwierzęcia",
    7: "Kobieta z koszem",
    8: "Pierścień",
    9: "Tańczące kobiety",
    10: "Papirus z napisem „Egipt”",
    11: "Czarny kot",
    12: "Karta skarbu 12 (poza rozgrywką)",
    13: "Posążek kota",
    14: "Myśliwy",
    15: "Skarb",
    16: "Bransoleta",
    17: "Tabliczka z hieroglifami",
    18: "Kapłan",
    19: "Kościotrup",
    20: "Oko Horusa",
    21: "Wojownik",
    22: "Wielbłąd",
    23: "Sarkofag",
    24: "Głowa faraona",
    25: "Dzban",
  };
  const treasureNames = { ...TREASURE_NAMES };
  const CARD_TEMPLATE_PATH = "./czystakarta.jpeg";
  const SYMBOL_DIRECTORY = "./assets/game-symbols";
  const CATALOG_STORAGE_KEY = "super-labirynt-treasure-catalog-v1";
  const SCORE_STORAGE_KEY = "super_labirynt_scores";
  const STARTS = [
    { row: 0, col: 0, openings: ["E", "S"], startColor: "#74b8df" },
    { row: 0, col: 6, openings: ["W", "S"], startColor: "#d94e43" },
    { row: 6, col: 6, openings: ["N", "W"], startColor: "#168d7e" },
    { row: 6, col: 0, openings: ["N", "E"], startColor: "#e1c52e" },
  ];
  const FIXED_INTERIOR = [
    { row: 0, col: 2, treasure: 24, openings: ["E", "W"], symbolRotation: 0 },
    { row: 0, col: 4, treasure: 19, openings: ["E", "W"], symbolRotation: 0 },
    { row: 2, col: 0, treasure: 1, openings: ["N", "S"], symbolRotation: 0 },
    { row: 2, col: 2, treasure: 10, openings: ["N", "S"], symbolRotation: 0 },
    { row: 2, col: 4, treasure: 17, openings: ["E", "W"], symbolRotation: 0 },
    { row: 2, col: 6, treasure: 22, openings: ["N", "S"], symbolRotation: 0 },
    { row: 4, col: 0, treasure: 23, openings: ["N", "S"], symbolRotation: 0 },
    { row: 4, col: 2, treasure: 15, openings: ["E", "W"], symbolRotation: 0 },
    { row: 4, col: 4, treasure: 18, openings: ["E", "W"], symbolRotation: 0 },
    { row: 4, col: 6, treasure: 9, openings: ["N", "S"], symbolRotation: 0 },
    { row: 6, col: 2, treasure: 2, openings: ["E", "W"], symbolRotation: 0 },
    { row: 6, col: 4, treasure: 3, openings: ["E", "W"], symbolRotation: 0 },
  ];
  const DIRECTIONS = {
    N: { row: -1, col: 0, opposite: "S" },
    E: { row: 0, col: 1, opposite: "W" },
    S: { row: 1, col: 0, opposite: "N" },
    W: { row: 0, col: -1, opposite: "E" },
  };
  const ARROWS = [
    ...[1, 3, 5].map((index) => ({ direction: "S", index, row: 0, col: index + 1, symbol: "↓" })),
    ...[1, 3, 5].map((index) => ({ direction: "N", index, row: 8, col: index + 1, symbol: "↑" })),
    ...[1, 3, 5].map((index) => ({ direction: "E", index, row: index + 1, col: 0, symbol: "→" })),
    ...[1, 3, 5].map((index) => ({ direction: "W", index, row: index + 1, col: 8, symbol: "←" })),
  ];

  const elements = {
    board: document.querySelector("#board"),
    arrows: document.querySelector("#insertion-arrows"),
    spareTile: document.querySelector("#spare-tile"),
    spareShape: document.querySelector("#spare-shape"),
    rotateButton: document.querySelector("#rotate-button"),
    endTurnButton: document.querySelector("#end-turn-button"),
    endTurnLabel: document.querySelector("#end-turn-label"),
    endTurnIcon: document.querySelector("#end-turn-icon"),
    actionHint: document.querySelector("#action-hint"),
    stepNumber: document.querySelector("#step-number"),
    instructionText: document.querySelector("#instruction-text"),
    instructionKey: document.querySelector("#instruction-key"),
    turnStatus: document.querySelector("#turn-status"),
    activePlayerName: document.querySelector("#active-player-name"),
    activePlayerToken: document.querySelector("#active-player-token"),
    targetImage: document.querySelector("#target-image"),
    targetSymbol: document.querySelector("#target-symbol"),
    targetTitle: document.querySelector("#target-title"),
    targetCount: document.querySelector("#target-count"),
    previewDialog: document.querySelector("#tile-preview-dialog"),
    previewTile: document.querySelector("#tile-preview"),
    previewTitle: document.querySelector("#tile-preview-title"),
    previewCaption: document.querySelector("#tile-preview-caption"),
    targetPreviewDialog: document.querySelector("#target-preview-dialog"),
    targetPreviewTitle: document.querySelector("#target-preview-title"),
    targetPreviewImage: document.querySelector("#target-preview-image"),
    targetPreviewSymbol: document.querySelector("#target-preview-symbol"),
    targetPreviewCaption: document.querySelector("#target-preview-caption"),
    progressFill: document.querySelector("#progress-fill"),
    playerList: document.querySelector("#player-list"),
    playerCount: document.querySelector("#player-count"),
    opponentMode: document.querySelector("#opponent-mode"),
    computerDifficulty: document.querySelector("#computer-difficulty"),
    difficultyLabel: document.querySelector(".difficulty-label"),
    rulesDialog: document.querySelector("#rules-dialog"),
    newGameDialog: document.querySelector("#new-game-dialog"),
    victoryDialog: document.querySelector("#victory-dialog"),
    victoryTitle: document.querySelector("#victory-title"),
    victoryMessage: document.querySelector("#victory-message"),
  };

  let state;
  let aiTimer = null;
  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function makeTile(type, openings, fixed = false, treasure = null, startColor = null, symbolRotation = 0) {
    return { id: crypto.randomUUID(), type, openings, fixed, treasure, startColor, symbolRotation, stoneSeed: Math.floor(Math.random() * 3) };
  }

  function randomTile(fixed = false) {
    const types = ["corner", "corner", "tee", "tee", "straight"];
    const type = types[Math.floor(Math.random() * types.length)];
    const pattern = {
      corner: ["N", "E"],
      tee: ["N", "E", "W"],
      straight: ["N", "S"],
    }[type];
    const rotation = Math.floor(Math.random() * 4);
    return makeTile(type, rotateOpenings(pattern, rotation), fixed);
  }

  function rotateOpenings(openings, turns) {
    const order = ["N", "E", "S", "W"];
    return openings.map((direction) => order[(order.indexOf(direction) + turns) % 4]);
  }

  function newGame(playerCount = Number(elements.playerCount.value)) {
    clearTimeout(aiTimer);
    aiTimer = null;
    const fixedPositions = new Set([
      ...STARTS.map(({ row, col }) => `${row},${col}`),
      ...FIXED_INTERIOR.map(({ row, col }) => `${row},${col}`),
    ]);
    const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    const fixedTiles = [];

    STARTS.forEach((start) => {
      const tile = makeTile("corner", start.openings, true, null, start.startColor);
      board[start.row][start.col] = tile;
      fixedTiles.push(tile);
    });
    FIXED_INTERIOR.forEach(({ row, col, treasure, openings, symbolRotation }) => {
      const tile = makeTile("straight", openings, true, treasure, null, symbolRotation);
      board[row][col] = tile;
      fixedTiles.push(tile);
    });

    const availableCells = [];
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (!fixedPositions.has(`${row},${col}`)) availableCells.push({ row, col });
      }
    }

    const movableTiles = Array.from({ length: 34 }, () => randomTile());
    const pieces = shuffle(movableTiles);
    availableCells.forEach(({ row, col }) => {
      board[row][col] = pieces.pop();
    });
    const spare = pieces.pop();

    const movableTreasureIds = shuffle(TREASURE_IDS.filter((id) =>
      !FIXED_INTERIOR.some((tile) => tile.treasure === id),
    ));
    const movableTreasureTiles = shuffle([
      ...board.flat().filter((tile) => !tile.fixed),
      spare,
    ]);
    movableTreasureIds.forEach((id, index) => {
      movableTreasureTiles[index].treasure = id;
    });

    const goals = shuffle(TREASURE_IDS);
    const count = Math.max(2, Math.min(4, playerCount || 2));
    const players = Array.from({ length: count }, (_, index) => ({
      id: index,
      name: elements.opponentMode.value === "computer" && index > 0
        ? `Komputer ${index}`
        : `Gracz ${index + 1}`,
      color: COLORS[index],
      colorName: COLOR_NAMES[index],
      isComputer: elements.opponentMode.value === "computer" && index > 0,
      row: STARTS[Math.floor(index * STARTS.length / count)].row,
      col: STARTS[Math.floor(index * STARTS.length / count)].col,
      start: {
        row: STARTS[Math.floor(index * STARTS.length / count)].row,
        col: STARTS[Math.floor(index * STARTS.length / count)].col,
      },
      goals: goals.filter((_, goalIndex) => goalIndex % count === index),
      goalIndex: 0,
      returning: false,
    }));

    state = {
      board,
      spare,
      players,
      currentPlayer: 0,
      phase: "push",
      reachable: new Set(),
      previousInsertion: null,
      lastMessage: "",
      opponentMode: elements.opponentMode.value,
      difficulty: elements.computerDifficulty.value,
    };
    elements.computerDifficulty.hidden = state.opponentMode !== "computer";
    elements.difficultyLabel.hidden = state.opponentMode !== "computer";
    render();
  }

  function currentPlayer() {
    return state.players[state.currentPlayer];
  }

  function currentGoal(player = currentPlayer()) {
    return player.goals[player.goalIndex] ?? null;
  }

  function treasureName(id) {
    return treasureNames[id] ?? "Nieznany skarb";
  }

  function symbolImagePath(id) {
    return `${SYMBOL_DIRECTORY}/${String(id).padStart(2, "0")}.png`;
  }

  function setTreasureCard(templateImage, symbolImage, id) {
    setBlankCard(templateImage, symbolImage);
    symbolImage.src = symbolImagePath(id);
    symbolImage.alt = `Symbol: ${treasureName(id)}`;
    symbolImage.hidden = false;
  }

  function setBlankCard(templateImage, symbolImage) {
    templateImage.src = CARD_TEMPLATE_PATH;
    templateImage.alt = "";
    templateImage.classList.add("composite-card-template");
    symbolImage.hidden = true;
  }

  function tileArt(tile, extraClass = "") {
    const templateRotation = tileTemplateRotation(tile);
    const startMark = tile.startColor
      ? `<circle cx="50" cy="50" r="13" fill="#f2ead4" stroke="#26323a" stroke-width="1.4"/><circle cx="50" cy="50" r="10.5" fill="${tile.startColor}"/>`
      : "";
    const treasureLabel = tile.treasure ? treasureName(tile.treasure) : "Bez skarbu";
    const icon = tile.treasure
      ? `<img class="tile-icon is-prepared-symbol" src="${symbolImagePath(tile.treasure)}" alt="${treasureLabel}" title="${treasureLabel}" style="--symbol-rotation:${tile.fixed ? tile.symbolRotation : templateRotation}deg" draggable="false">`
      : "";
    const pawns = pawnsForTile(tile);
    const tileClasses = ["tile", tile.fixed ? "is-fixed" : "", extraClass].filter(Boolean).join(" ");
    return `<div class="${tileClasses}" data-tile-id="${tile.id}" data-openings="${tile.openings.join(" ")}" data-treasure-id="${tile.treasure ?? ""}" aria-label="${tile.treasure ? `Korytarz ze skarbem: ${treasureLabel}` : "Korytarz"}">
      <svg class="tile-art" viewBox="0 0 100 100" aria-hidden="true">
        <image href="${tileTemplatePath(tile.type)}" x="0" y="0" width="100" height="100" preserveAspectRatio="none" transform="rotate(${templateRotation} 50 50)"/>
        ${startMark}
      </svg>
      ${icon}
      <span class="tile-zoom" aria-hidden="true">⌕</span>
      ${pawns}
    </div>`;
  }

  function tileTemplatePath(type) {
    return {
      corner: "./1.png",
      straight: "./2.png",
      tee: "./3.png",
    }[type];
  }

  function tileTemplateRotation(tile) {
    const templateOpenings = {
      corner: ["N", "E"],
      straight: ["E", "W"],
      tee: ["E", "S", "W"],
    }[tile.type];
    const turns = [0, 1, 2, 3].find((rotation) => {
      const rotated = rotateOpenings(templateOpenings, rotation).sort();
      return rotated.join() === [...tile.openings].sort().join();
    });
    if (turns === undefined) {
      throw new Error(`Nieprawidłowy układ przejść kafelka typu ${tile.type}.`);
    }
    return turns * 90;
  }

  function treasureImagePath(id, source) {
    const directory = source === "card" ? "cards" : "tile-symbols";
    return `./assets/${directory}/${String(id).padStart(2, "0")}.webp`;
  }

  function loadCatalogPreferences() {
    try {
      const saved = localStorage.getItem(CATALOG_STORAGE_KEY);
      if (!saved) return;
      const preferences = JSON.parse(saved);
      if (!preferences || typeof preferences !== "object") {
        throw new TypeError("Zapisane ustawienia katalogu mają nieprawidłowy format.");
      }
      TREASURE_IDS.forEach((id) => {
        const name = preferences.names?.[id];
        if (typeof name === "string" && name.trim()) treasureNames[id] = name;
      });
    } catch (error) {
      console.error("Nie udało się wczytać ustawień katalogu skarbów.", error);
    }
  }

  function pawnsForTile(tile) {
    const players = state.players.filter((player) => state.board[player.row][player.col]?.id === tile.id);
    if (!players.length) return "";
    return `<span class="player-pawns">${players.map((player) =>
      `<span class="pawn" style="background:${player.color}" title="${player.name}">${player.id + 1}</span>`,
    ).join("")}</span>`;
  }

  function renderBoard() {
    elements.board.innerHTML = "";
    const player = currentPlayer();
    const goal = currentGoal(player);
    const tiles = state.board.flatMap((row, rowIndex) =>
      row.map((tile, colIndex) => {
        const classes = [
          tileIsReachable(rowIndex, colIndex) ? "reachable" : "not-reachable",
          player.row === rowIndex && player.col === colIndex ? "is-current-player" : "",
          tile.treasure === goal ? "is-current-goal" : "",
        ].filter(Boolean).join(" ");
        return tileArt(tile, classes);
      })
        .map((markup, colIndex) => {
          const absoluteCol = colIndex;
          const absoluteRow = rowIndex;
          const cell = document.createElement("div");
          cell.innerHTML = markup;
          const tileElement = cell.firstElementChild;
          tileElement.dataset.row = String(absoluteRow);
          tileElement.dataset.col = String(absoluteCol);
          tileElement.setAttribute("role", "button");
          tileElement.tabIndex = 0;
          tileElement.setAttribute("aria-label", `${tileElement.getAttribute("aria-label")}, rząd ${absoluteRow + 1}, kolumna ${absoluteCol + 1}`);
          return tileElement;
        }),
    );
    tiles.forEach((tile) => elements.board.append(tile));

    elements.board.classList.toggle("can-move", state.phase === "move");
    elements.board.querySelectorAll(".tile").forEach((tile) => {
      tile.addEventListener("click", (event) => {
        const row = Number(tile.dataset.row);
        const col = Number(tile.dataset.col);
        if (state.phase === "move" && tileIsReachable(row, col)) {
          selectDestination(row, col);
          return;
        }
        const clickedIcon = event.target.closest(".tile-icon");
        if (clickedIcon) {
          showTilePreview(row, col);
          return;
        }
        showTilePreview(row, col);
      });
      tile.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const row = Number(tile.dataset.row);
          const col = Number(tile.dataset.col);
          if (state.phase === "move" && tileIsReachable(row, col)) selectDestination(row, col);
          else showTilePreview(row, col);
        }
      });
    });
  }

  function showTilePreview(row, col) {
    if (state.phase === "thinking") return;
    const tile = state.board[row][col];
    elements.previewTile.innerHTML = tileArt(tile, "preview-tile").replace(/^<div[^>]*>|<\/div>$/g, "");
    elements.previewTitle.textContent = tile.treasure ? treasureName(tile.treasure) : "Korytarz bez skarbu";
    elements.previewCaption.textContent = tile.treasure
      ? `Pole ${row + 1}, ${col + 1} — ${shapeName(tile.type)} kafelek z symbolem „${treasureName(tile.treasure)}”.`
      : `Pole ${row + 1}, ${col + 1} — kafelek ${shapeName(tile.type)}.`;
    elements.previewDialog.showModal();
  }

  function showTargetPreview() {
    const player = currentPlayer();
    const goal = currentGoal(player);
    elements.targetPreviewImage.parentElement.classList.remove("is-symbol", "is-tile");
    elements.targetPreviewImage.parentElement.classList.toggle("is-card", Boolean(goal));
    if (!goal) {
      elements.targetPreviewTitle.textContent = "Powrót do bramy";
      elements.targetPreviewImage.src = "./assets/cover.webp";
      elements.targetPreviewImage.alt = "Powrót do bramy startowej";
      elements.targetPreviewImage.classList.remove("composite-card-template");
      elements.targetPreviewSymbol.hidden = true;
      elements.targetPreviewCaption.textContent = "Masz już wszystkie skarby. Wróć do swojej bramy, aby wygrać.";
      elements.targetPreviewDialog.showModal();
      return;
    }
    elements.targetPreviewTitle.textContent = treasureName(goal);
    setTreasureCard(elements.targetPreviewImage, elements.targetPreviewSymbol, goal);
    elements.targetPreviewCaption.textContent = `Cel poszukiwacza: ${treasureName(goal)}. Karta używa pustego wzoru i wyciętego symbolu.`;
    elements.targetPreviewDialog.showModal();
  }

  function shapeName(type) {
    return { corner: "zakrętowy", tee: "skrzyżowanie", straight: "prosty" }[type];
  }

  function tileIsReachable(row, col) {
    return state.reachable.has(`${row},${col}`);
  }

  function renderArrows() {
    elements.arrows.innerHTML = "";
    ARROWS.forEach(({ direction, index, row, col, symbol }) => {
      const button = document.createElement("button");
      const blocked = state.phase !== "push" || isReverseInsertion(direction, index);
      button.className = "insert-button";
      button.type = "button";
      button.textContent = symbol;
      button.style.gridRow = String(row + 1);
      button.style.gridColumn = String(col + 1);
      button.disabled = blocked;
      button.setAttribute("aria-label", `Wsuń kafelek od strony ${entrySideName(direction)}, rząd lub kolumna ${index + 1}`);
      button.title = button.getAttribute("aria-label");
      button.addEventListener("click", () => pushTile(direction, index));
      elements.arrows.append(button);
    });
  }

  function isReverseInsertion(direction, index) {
    if (!state.previousInsertion) return false;
    const opposite = DIRECTIONS[direction].opposite;
    return state.previousInsertion.index === index && state.previousInsertion.direction === opposite;
  }

  function directionName(direction) {
    return { N: "północnej", E: "wschodniej", S: "południowej", W: "zachodniej" }[direction];
  }

  function entrySideName(direction) {
    return directionName(DIRECTIONS[direction].opposite);
  }

  function pushTile(direction, index) {
    if (state.phase !== "push" || isReverseInsertion(direction, index)) return;
    const line = direction === "E" || direction === "W"
      ? [...state.board[index]]
      : state.board.map((row) => row[index]);
    const pushesTowardEnd = direction === "S" || direction === "E";
    const ejected = pushesTowardEnd ? line[SIZE - 1] : line[0];
    const nextLine = pushesTowardEnd
      ? [state.spare, ...line.slice(0, SIZE - 1)]
      : [...line.slice(1), state.spare];

    nextLine.forEach((tile, position) => {
      const row = direction === "E" || direction === "W" ? index : position;
      const col = direction === "E" || direction === "W" ? position : index;
      state.board[row][col] = tile;
    });
    state.players.forEach((player) => {
      const coordinate = direction === "E" || direction === "W" ? "col" : "row";
      if ((direction === "E" || direction === "W" ? player.row : player.col) !== index) return;
      const movingForward = direction === "E" || direction === "S";
      player[coordinate] = (player[coordinate] + (movingForward ? 1 : -1) + SIZE) % SIZE;
    });

    state.spare = ejected;
    state.previousInsertion = { direction, index };
    state.phase = "move";
    state.reachable = getReachable(state.board, currentPlayer().row, currentPlayer().col);
    state.lastMessage = `Korytarz wsunięty od strony ${entrySideName(direction)}. Wybierz osiągalne pole.`;
    render();
  }

  function getReachable(board, startRow, startCol) {
    const reached = new Set([`${startRow},${startCol}`]);
    const queue = [{ row: startRow, col: startCol }];
    for (let head = 0; head < queue.length; head += 1) {
      const { row, col } = queue[head];
      const tile = board[row][col];
      tile.openings.forEach((direction) => {
        const step = DIRECTIONS[direction];
        const nextRow = row + step.row;
        const nextCol = col + step.col;
        if (nextRow < 0 || nextRow >= SIZE || nextCol < 0 || nextCol >= SIZE) return;
        const neighbor = board[nextRow][nextCol];
        if (!neighbor.openings.includes(step.opposite)) return;
        const key = `${nextRow},${nextCol}`;
        if (reached.has(key)) return;
        reached.add(key);
        queue.push({ row: nextRow, col: nextCol });
      });
    }
    return reached;
  }

  function getDistances(board, startRow, startCol) {
    const distances = new Map([[`${startRow},${startCol}`, 0]]);
    const queue = [{ row: startRow, col: startCol }];
    for (let head = 0; head < queue.length; head += 1) {
      const { row, col } = queue[head];
      const nextDistance = distances.get(`${row},${col}`) + 1;
      board[row][col].openings.forEach((direction) => {
        const step = DIRECTIONS[direction];
        const nextRow = row + step.row;
        const nextCol = col + step.col;
        if (nextRow < 0 || nextRow >= SIZE || nextCol < 0 || nextCol >= SIZE) return;
        if (!board[nextRow][nextCol].openings.includes(step.opposite)) return;
        const key = `${nextRow},${nextCol}`;
        if (distances.has(key)) return;
        distances.set(key, nextDistance);
        queue.push({ row: nextRow, col: nextCol });
      });
    }
    return distances;
  }

  function simulateInsertion(direction, index, spare) {
    const board = state.board.map((row) => [...row]);
    const line = direction === "E" || direction === "W"
      ? [...board[index]]
      : board.map((row) => row[index]);
    const pushesTowardEnd = direction === "S" || direction === "E";
    const ejected = pushesTowardEnd ? line[SIZE - 1] : line[0];
    const nextLine = pushesTowardEnd
      ? [spare, ...line.slice(0, SIZE - 1)]
      : [...line.slice(1), spare];
    nextLine.forEach((tile, position) => {
      const row = direction === "E" || direction === "W" ? index : position;
      const col = direction === "E" || direction === "W" ? position : index;
      board[row][col] = tile;
    });

    const players = state.players.map((player) => ({ ...player }));
    players.forEach((player) => {
      const coordinate = direction === "E" || direction === "W" ? "col" : "row";
      if ((direction === "E" || direction === "W" ? player.row : player.col) !== index) return;
      const movingForward = direction === "E" || direction === "S";
      player[coordinate] = (player[coordinate] + (movingForward ? 1 : -1) + SIZE) % SIZE;
    });
    return { board, players, spare: ejected };
  }

  function findTarget(board, player) {
    if (player.returning) return player.start;
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (board[row][col].treasure === currentGoal(player)) return { row, col };
      }
    }
    return null;
  }

  function chooseAiPlan(player, difficulty) {
    if (difficulty === "amateur") {
      const insertions = ARROWS.filter(({ direction, index }) => !isReverseInsertion(direction, index));
      const insertion = insertions[Math.floor(Math.random() * insertions.length)];
      const turns = Math.floor(Math.random() * 4);
      const spare = { ...state.spare, openings: rotateOpenings(state.spare.openings, turns) };
      const simulation = simulateInsertion(insertion.direction, insertion.index, spare);
      const shiftedPlayer = simulation.players.find((entry) => entry.id === player.id);
      const reachable = [...getReachable(simulation.board, shiftedPlayer.row, shiftedPlayer.col)];
      const destination = reachable[Math.floor(Math.random() * reachable.length)].split(",").map(Number);
      return { ...insertion, turns, destination: { row: destination[0], col: destination[1] } };
    }

    let bestPlan = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const { direction, index } of ARROWS) {
      if (isReverseInsertion(direction, index)) continue;
      for (let turns = 0; turns < 4; turns += 1) {
        const spare = { ...state.spare, openings: rotateOpenings(state.spare.openings, turns) };
        const simulation = simulateInsertion(direction, index, spare);
        const shiftedPlayer = simulation.players.find((entry) => entry.id === player.id);
        const target = findTarget(simulation.board, shiftedPlayer);
        const distances = target
          ? getDistances(simulation.board, target.row, target.col)
          : new Map();
        const reachable = getReachable(simulation.board, shiftedPlayer.row, shiftedPlayer.col);
        const destinations = [...reachable].map((key) => {
          const [row, col] = key.split(",").map(Number);
          return { row, col, distance: distances.get(key) ?? Number.POSITIVE_INFINITY };
        });
        const bestDestination = destinations.reduce((best, candidate) =>
          candidate.distance < best.distance ? candidate : best,
        );
        const mobilityBonus = difficulty === "expert" ? Math.min(reachable.size, 24) * 0.12 : 0;
        const opponentThreats = difficulty === "expert"
          ? simulation.players
            .filter((opponent) => opponent.id !== player.id)
            .filter((opponent) => {
              const opponentTarget = findTarget(simulation.board, opponent);
              if (!opponentTarget) return false;
              const opponentReachable = getReachable(simulation.board, opponent.row, opponent.col);
              return opponentReachable.has(`${opponentTarget.row},${opponentTarget.col}`);
            }).length
          : 0;
        const distanceScore = target
          ? (Number.isFinite(bestDestination.distance) ? bestDestination.distance : SIZE * SIZE) * 100
          : SIZE * SIZE * 100;
        const score = distanceScore - mobilityBonus + opponentThreats * 18;
        if (score < bestScore) {
          bestScore = score;
          bestPlan = {
            direction,
            index,
            turns,
            destination: { row: bestDestination.row, col: bestDestination.col },
          };
        }
      }
    }
    if (!bestPlan) throw new Error("Komputer nie znalazł legalnego wsunięcia kafelka.");
    return bestPlan;
  }

  function startComputerTurn() {
    state.phase = "thinking";
    state.lastMessage = `${currentPlayer().name} przygotowuje ruch…`;
    render();
    aiTimer = window.setTimeout(playComputerTurn, 500);
  }

  function playComputerTurn() {
    aiTimer = null;
    if (state.phase !== "thinking" || !currentPlayer().isComputer) return;
    const player = currentPlayer();
    const plan = chooseAiPlan(player, state.difficulty);
    state.spare = { ...state.spare, openings: rotateOpenings(state.spare.openings, plan.turns) };
    state.phase = "push";
    pushTile(plan.direction, plan.index);
    if (state.phase === "won") return;
    state.reachable = getReachable(state.board, player.row, player.col);
    selectDestination(plan.destination.row, plan.destination.col);
    if (state.phase !== "won") finishTurn();
  }

  function selectDestination(row, col) {
    if (state.phase !== "move" || !tileIsReachable(row, col)) return;
    const player = currentPlayer();
    player.row = row;
    player.col = col;
    collectTreasure(player, state.board[row][col]);
    if (player.returning && row === player.start.row && col === player.start.col) {
      win(player);
      return;
    }
    state.phase = "end";
    state.lastMessage = `${player.name} zatrzymał się na polu ${row + 1}, ${col + 1}.`;
    render();
  }

  function collectTreasure(player, tile) {
    if (!tile.treasure || tile.treasure !== currentGoal(player)) return;
    tile.treasure = null;
    player.goalIndex += 1;
    if (player.goalIndex >= player.goals.length) {
      player.returning = true;
      state.lastMessage = `${player.name} zebrał wszystkie skarby! Wróć do swojej bramy.`;
    } else {
      state.lastMessage = `${player.name} odnalazł skarb! Czas szukać kolejnego.`;
    }
  }

  function finishTurn() {
    if (state.phase === "push" || state.phase === "thinking") return;
    state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
    state.phase = "push";
    state.reachable = new Set();
    state.lastMessage = "";
    if (currentPlayer().isComputer) {
      startComputerTurn();
      return;
    }
    render();
  }

  function win(player) {
    state.phase = "won";
    state.lastMessage = `${player.name} odniósł zwycięstwo!`;
    if (!player.isComputer) recordWin(player);
    render();
    elements.victoryTitle.textContent = `Brawo, ${player.name}!`;
    elements.victoryMessage.textContent = `${player.colorName} poszukiwacz odnalazł wszystkie skarby i wrócił do swojej bramy.`;
    elements.victoryDialog.showModal();
  }

  function recordWin(player) {
    try {
      const scores = JSON.parse(localStorage.getItem(SCORE_STORAGE_KEY) || "[]");
      if (!Array.isArray(scores) || !scores.every((entry) =>
        entry && typeof entry.nick === "string" && Number.isFinite(entry.score),
      )) {
        throw new TypeError("Zapisany ranking Super Labiryntu ma nieprawidłowy format.");
      }
      const existingScore = scores.find((entry) => entry.nick === player.name);
      if (existingScore) {
        existingScore.score += 1;
        existingScore.date = new Date().toLocaleDateString("pl");
      } else {
        scores.push({
          nick: player.name,
          score: 1,
          date: new Date().toLocaleDateString("pl"),
        });
      }
      scores.sort((first, second) => second.score - first.score);
      localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scores.slice(0, 10)));
    } catch (error) {
      console.error("Nie udało się zapisać zwycięstwa w rankingu Super Labiryntu.", error);
    }
  }

  function renderSidePanel() {
    const player = currentPlayer();
    const goal = currentGoal(player);
    elements.activePlayerName.textContent = player.name;
    elements.activePlayerToken.textContent = String(player.id + 1);
    elements.activePlayerToken.style.setProperty("--active-color", player.color);

    if (goal) {
      setTreasureCard(elements.targetImage, elements.targetSymbol, goal);
      elements.targetTitle.textContent = treasureName(goal);
      elements.targetCount.textContent = `Skarb ${player.goalIndex + 1} z ${player.goals.length}`;
    } else {
      elements.targetImage.src = "./assets/cover.webp";
      elements.targetImage.alt = "Powrót do bramy startowej";
      elements.targetImage.classList.remove("composite-card-template");
      elements.targetSymbol.hidden = true;
      elements.targetTitle.textContent = "Wróć do bramy";
      elements.targetCount.textContent = "Wszystkie skarby zebrane";
    }
    elements.progressFill.style.width = `${Math.round((player.goalIndex / player.goals.length) * 100)}%`;

    elements.spareTile.innerHTML = tileArt(state.spare).replace(/^<div[^>]*>|<\/div>$/g, "");
    elements.spareTile.classList.add("spare-tile");
    elements.spareTile.setAttribute("aria-label", "Kafelek zapasowy");
    elements.spareShape.textContent = { corner: "Zakole", tee: "Skrzyżowanie", straight: "Korytarz" }[state.spare.type];
    elements.rotateButton.disabled = state.phase !== "push";

    elements.playerList.innerHTML = state.players.map((entry, index) => {
      const collected = entry.goalIndex;
      const total = entry.goals.length;
      const score = entry.returning ? "Do bramy" : `${collected}/${total} skarbów`;
      return `<li class="player-row ${index === state.currentPlayer ? "active" : ""}">
        <span class="player-row-marker" style="--player-color:${entry.color}"></span>
        <span class="player-row-name">${entry.name}</span>
        <span class="player-row-score">${score}</span>
      </li>`;
    }).join("");

    const inPush = state.phase === "push";
    const inMove = state.phase === "move";
    const isActivePlayerAtStart = player.row === player.start.row && player.col === player.start.col;
    const thinking = state.phase === "thinking";
    const turnCaption = state.phase === "won" ? "Wyprawa zakończona" : thinking ? "Komputer myśli…" : inPush ? `Ruch: ${player.name}` : inMove ? "Wybierz drogę" : "Ruch wykonany";
    elements.turnStatus.innerHTML = `<span class="turn-dot" style="background:${player.color}"></span><span>${turnCaption}</span>`;
    elements.stepNumber.textContent = inPush ? "01" : inMove ? "02" : "03";
    elements.instructionText.textContent = state.lastMessage || (
      thinking
        ? `${player.name} planuje wsunięcie kafelka i ruch.`
        : inPush
        ? "Wybierz strzałkę, aby wsunąć kafelek do labiryntu."
        : inMove
          ? "Złote pola są osiągalne. Kliknij, aby przejść i sprawdzić swój cel."
          : "Zakończ turę, aby przekazać ruch następnemu graczowi."
    );
    elements.instructionKey.textContent = thinking ? "RUCH KOMPUTERA" : inPush ? "WSUŃ KORYTARZ" : inMove ? "WYBIERZ POLE" : "KONIEC RUCHU";
    elements.endTurnButton.disabled = inPush || thinking || state.phase === "won";
    elements.endTurnIcon.textContent = inMove ? "↷" : "✓";
    elements.endTurnLabel.textContent = inMove ? "Pomiń ruch" : "Zakończ turę";
    elements.actionHint.textContent = thinking
      ? "Komputer wykonuje swój ruch."
      : inPush
      ? "Ruch zaczyna się od wsunięcia kafelka."
      : inMove
        ? "Możesz też pominąć przejście."
        : isActivePlayerAtStart && player.returning
          ? "Jesteś przy swojej bramie."
          : "Labirynt czeka na kolejnego poszukiwacza.";
  }

  function render() {
    renderBoard();
    renderArrows();
    renderSidePanel();
  }

  elements.rotateButton.addEventListener("click", () => {
    if (state.phase !== "push") return;
    state.spare = { ...state.spare, openings: rotateOpenings(state.spare.openings, 1) };
    render();
  });
  elements.endTurnButton.addEventListener("click", finishTurn);
  elements.playerCount.addEventListener("change", () => {
    newGame(Number(elements.playerCount.value));
  });
  elements.opponentMode.addEventListener("change", () => newGame());
  elements.computerDifficulty.addEventListener("change", () => newGame());
  document.querySelector("#rules-button").addEventListener("click", () => elements.rulesDialog.showModal());
  document.querySelector("#new-game-button").addEventListener("click", () => elements.newGameDialog.showModal());
  document.querySelector("#target-art").addEventListener("click", showTargetPreview);
  document.querySelector("#target-art").addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showTargetPreview();
    }
  });
  document.querySelector("#confirm-new-game").addEventListener("click", () => {
    elements.newGameDialog.close();
    newGame();
  });
  document.querySelector("#victory-new-game").addEventListener("click", () => {
    elements.victoryDialog.close();
    newGame();
  });
  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });
  [elements.rulesDialog, elements.newGameDialog, elements.victoryDialog, elements.targetPreviewDialog, elements.previewDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  loadCatalogPreferences();
  newGame();
})();
