// ==========================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ==========================

let coins = 100;
let eggPrice = 100;
let eggs = [];
let monsters = [];
let decor = [];
let lastUpdate = Date.now();
let topZ = 10;
let deleteMode = false;
let originalX = 0;
let originalY = 0;

// Глобальный музыкальный цикл
const GLOBAL_LOOP_DURATION = 83 * 1000; // 83 секунды
let globalLoopStartTime = null;
let isGlobalLoopRunning = false;

// Один звук на каждую редкость
let globalSounds = {
  common: null,
  rare: null,
  ultrarare: null,
  epic: null,
  mythic: null,
  legendary: null
};

// Активность звуков
let activeSounds = {
  common: false,
  rare: false,
  ultrarare: false,
  epic: false,
  mythic: false,
  legendary: false
};

const coinsEl = document.getElementById('coins');
const incubatorSlot = document.getElementById('incubator-slot');
const fieldArea = document.getElementById('field-area');
const buyEggBtn = document.getElementById('buy-egg');

const RARITIES = {
  common:     { name: 'Обычная',     hatchTime: 30,  incomePerSec: 1,  weight: 38 },
  rare:       { name: 'Редкая',      hatchTime: 60,  incomePerSec: 3,  weight: 25 },
  ultrarare:  { name: 'Ультраредкая',hatchTime: 100, incomePerSec: 5,  weight: 15 },
  epic:       { name: 'Эпическая',   hatchTime: 150, incomePerSec: 8,  weight: 10 },
  mythic:     { name: 'Мифическая',  hatchTime: 200, incomePerSec: 10,  weight: 8 },
  legendary:  { name: 'Легендарная', hatchTime: 400, incomePerSec: 15, weight: 4 }
};

// ==========================
// ОБНОВЛЕНИЕ МОНЕТ
// ==========================

function updateCoinsDisplay() {
  coinsEl.textContent = coins.toFixed(2);
}

// ==========================
// РЕДКОСТЬ ЯЙЦА
// ==========================

function randomRarity() {
  const total = Object.values(RARITIES).reduce((s, r) => s + r.weight, 0);
  let rnd = Math.random() * total;
  for (const [key, r] of Object.entries(RARITIES)) {
    if (rnd < r.weight) return key;
    rnd -= r.weight;
  }
  return 'common';
}

// ==========================
// ПОКУПКА ЯЙЦА
// ==========================

function buyEgg() {
  if (coins < eggPrice) return;

  coins -= eggPrice;
  // динамическое увеличение цены
    if (eggPrice > 3000) {
    eggPrice = Math.floor(eggPrice * 1.05);
    } else if (eggPrice > 1500) {
    eggPrice = Math.floor(eggPrice * 1.10);
    } else if (eggPrice > 800) {
    eggPrice = Math.floor(eggPrice * 1.15);
    } else {
    eggPrice = Math.floor(eggPrice * 1.20); 
    }

  updateCoinsDisplay();
  updateEggPriceDisplay();

  const rarityKey = randomRarity();
  const rarity = RARITIES[rarityKey];

  eggs.push({
    id: Date.now(),
    rarityKey,
    hatchEndTime: Date.now() + rarity.hatchTime * 1000,
    status: 'incubating'
  });

  renderIncubator();
  saveGame();
}

function updateEggPriceDisplay() {
  buyEggBtn.textContent = `Купить яйцо (${eggPrice} монет)`;
}

// ==========================
// РЕНДЕР ИНКУБАТОРА
// ==========================

function renderIncubator() {
  incubatorSlot.innerHTML = '';

  eggs.forEach(egg => {
    const wrap = document.createElement('div');
    wrap.className = 'egg-wrapper';

    if (egg.status === 'incubating') {
      const img = document.createElement('img');
      img.src = 'assets/eggs/egg_basic.png';
      img.className = 'egg-img';

      const label = document.createElement('div');
      label.className = 'egg-label';
      label.textContent = RARITIES[egg.rarityKey].name;

      const timer = document.createElement('div');
      timer.className = 'egg-timer';
      timer.id = `timer-${egg.id}`;

      wrap.appendChild(img);
      wrap.appendChild(label);
      wrap.appendChild(timer);

    } else if (egg.status === 'hatched') {
      const btn = document.createElement('button');
      btn.textContent = `Вылупился ${RARITIES[egg.rarityKey].name}! Разместить`;
      btn.onclick = () => placeMonsterFromEgg(egg);
      wrap.appendChild(btn);
    }

    incubatorSlot.appendChild(wrap);
  });
}

// ==========================
// ТАЙМЕРЫ ЯИЦ
// ==========================

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function checkHatching() {
  let needRerender = false;

  eggs.forEach(egg => {
    const remaining = (egg.hatchEndTime - Date.now()) / 1000;

    if (egg.status === 'incubating') {
      if (remaining > 0) {
        const timerEl = document.getElementById(`timer-${egg.id}`);
        if (timerEl) {
          timerEl.textContent = "До вылупления: " + formatTime(remaining);
        }
      } else {
        egg.status = 'hatched';
        needRerender = true;
      }
    }
  });

  if (needRerender) {
    renderIncubator();
  }
}

// ==========================
// ГЛОБАЛЬНЫЙ МУЗЫКАЛЬНЫЙ ЦИКЛ
// ==========================

function startGlobalLoop() {
  globalLoopStartTime = performance.now();
  isGlobalLoopRunning = true;
}

function getGlobalLoopPosition() {
  if (!isGlobalLoopRunning) return 0;

  const now = performance.now();
  const elapsed = now - globalLoopStartTime;

  return (elapsed % GLOBAL_LOOP_DURATION) / 1000;
}

function ensureSoundLoaded(rarityKey) {
  if (!globalSounds[rarityKey]) {
    const audio = new Audio(`assets/sounds/${rarityKey}.MP3`);
    audio.loop = true;
    audio.volume = 1.0;
    globalSounds[rarityKey] = audio;
  }
}

function playRaritySound(rarityKey) {
  ensureSoundLoaded(rarityKey);

  const audio = globalSounds[rarityKey];
  const pos = getGlobalLoopPosition();

  audio.currentTime = pos;
  audio.play();
  activeSounds[rarityKey] = true;
}

function stopRaritySound(rarityKey) {
  if (globalSounds[rarityKey]) {
    globalSounds[rarityKey].pause();
    globalSounds[rarityKey].currentTime = 0;
  }
  activeSounds[rarityKey] = false;
}

// ==========================
// РАЗМЕЩЕНИЕ МОНСТРА
// ==========================

function placeMonsterFromEgg(egg) {
  eggs = eggs.filter(e => e.id !== egg.id);
  renderIncubator();

  const rarity = RARITIES[egg.rarityKey];

  const monster = {
    id: Date.now(),
    rarityKey: egg.rarityKey,
    incomePerSec: rarity.incomePerSec,
    x: 100,
    y: 100
  };

  monsters.push(monster);

  if (!isGlobalLoopRunning) {
    startGlobalLoop();
  }

  if (!activeSounds[monster.rarityKey]) {
    playRaritySound(monster.rarityKey);
  }

  renderField();
  saveGame();
}

// ==========================
// DRAG & DROP + УДАЛЕНИЕ
// ==========================

function makeDraggable(div, obj) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  div.addEventListener('mousedown', e => {
    isDragging = true;

    const rect = div.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    originalX = obj.x;
    originalY = obj.y;

    topZ++;
    div.style.zIndex = topZ;
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;

    const fieldRect = fieldArea.getBoundingClientRect();
    const objRect = div.getBoundingClientRect();

    let newX = e.clientX - fieldRect.left - offsetX;
    let newY = e.clientY - fieldRect.top - offsetY;

    newX = Math.max(-50, Math.min(newX, fieldRect.width - objRect.width + 50));
    newY = Math.max(0, Math.min(newY, fieldRect.height - objRect.height));

    obj.x = newX;
    obj.y = newY;

    div.style.left = newX + 'px';
    div.style.top = newY + 'px';

    if (newX > fieldRect.width - objRect.width) {
      div.style.filter = "brightness(0.4) sepia(1) hue-rotate(-50deg) saturate(5)";
      deleteMode = true;
    } else {
      div.style.filter = "none";
      deleteMode = false;
    }
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;

    div.style.filter = "none";

    if (deleteMode) {
      showDeleteDialog(obj);
    } else {
      saveGame();
    }
  });
}

function showDeleteDialog(obj) {
  const confirmDelete = confirm("Удалить объект?");

  if (confirmDelete) {
    if (monsters.includes(obj)) {
      const rarity = obj.rarityKey;

      monsters = monsters.filter(m => m !== obj);

      const stillExists = monsters.some(m => m.rarityKey === rarity);

      if (!stillExists) {
        stopRaritySound(rarity);
      }

      if (monsters.length === 0) {
        isGlobalLoopRunning = false;
        globalLoopStartTime = null;
      }
    }

    if (decor.includes(obj)) {
      decor = decor.filter(d => d !== obj);
    }

    renderField();
    saveGame();
  } else {
    obj.x = originalX;
    obj.y = originalY;
    renderField();
  }
}

// ==========================
// РЕНДЕР ПОЛЯ
// ==========================

function renderField() {
  fieldArea.innerHTML = '';

  decor.forEach(obj => {
    const div = document.createElement('div');
    div.className = 'decor';

    const img = document.createElement('img');
    img.src = `assets/decor/${obj.file}`;
    img.className = 'decor-img';

    div.appendChild(img);

    div.style.left = obj.x + 'px';
    div.style.top = obj.y + 'px';

    makeDraggable(div, obj);
    fieldArea.appendChild(div);
  });

  monsters.forEach(monster => {
    const div = document.createElement('div');
    div.className = 'monster singing';

    const img = document.createElement('img');
    img.src = `assets/lera/${monster.rarityKey}.png`;
    img.className = 'monster-img';

    const label = document.createElement('div');
    label.className = 'monster-label';
    label.textContent = RARITIES[monster.rarityKey].name;

    div.appendChild(img);
    div.appendChild(label);

    div.style.left = monster.x + 'px';
    div.style.top = monster.y + 'px';

    makeDraggable(div, monster);

    // НЕ перезапускаем звук, если он уже играет
    if (audioUnlocked && !activeSounds[monster.rarityKey]) {
      playRaritySound(monster.rarityKey);
    }


    fieldArea.appendChild(div);
  });
}

// ==========================
// ИГРОВОЙ ЦИКЛ
// ==========================

function gameLoop() {
  const now = Date.now();
  const dt = (now - lastUpdate) / 1000;
  lastUpdate = now;

  let income = 0;
  monsters.forEach(m => income += m.incomePerSec * dt);

  if (income > 0) {
    coins += income;
    coins = parseFloat(coins.toFixed(2));
    updateCoinsDisplay();
  }

  checkHatching();
  requestAnimationFrame(gameLoop);
}

// ==========================
// СОХРАНЕНИЕ
// ==========================

function saveGame() {
  localStorage.setItem('MSL_SAVE', JSON.stringify({
    coins,
    eggPrice,
    eggs,
    monsters,
    decor
  }));
}

function loadGame() {
  const data = localStorage.getItem('MSL_SAVE');
  if (!data) return;

  const save = JSON.parse(data);
  coins = save.coins ?? 100;
  eggPrice = save.eggPrice ?? 100;
  eggs = save.eggs ?? [];
  monsters = save.monsters ?? [];
  decor = save.decor ?? [];

  updateCoinsDisplay();
  updateEggPriceDisplay();
  renderIncubator();
  renderField();
}

// ==========================
// СБРОС
// ==========================

function resetGame() {
  if (!confirm("Вы уверены, что хотите сбросить прогресс?")) return;

  coins = 100;
  eggPrice = 100;
  eggs = [];
  monsters = [];
  decor = [];

  localStorage.removeItem('MSL_SAVE');

  updateCoinsDisplay();
  updateEggPriceDisplay();
  renderIncubator();
  renderField();
}

// ==========================
// МАГАЗИН ДЕКОРА
// ==========================

document.querySelectorAll('.buy-decor').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    buyDecor(type);
  });
});

function buyDecor(type) {
  const price = 500;
  if (coins < price) return;

  coins -= price;
  updateCoinsDisplay();

  const variants = {
    tree: ["tree1.png", "tree2.png", "tree3.png"],
    rock: ["rock1.png", "rock2.png", "rock3.png"],
    bush: ["bush1.png", "bush2.png", "bush3.png"],
    flower: ["flower1.png", "flower2.png", "flower3.png", "flower4.png", "flower5.png"],
    statue: ["statue1.png", "statue2.png", "statue3.png"],
    bed: ["bed1.png", "bed2.png", "bed3.png", "bed4.png", "bed5.png"]
  };

  const list = variants[type];
  if (!list) return;

  const file = list[Math.floor(Math.random() * list.length)];

  decor.push({
    id: Date.now(),
    type,
    file,
    x: 150,
    y: 150
  });

  renderField();
  saveGame();
}

// ==========================
// СТАРТ
// ==========================

document.getElementById('reset-btn').addEventListener('click', resetGame);
document.getElementById('save-btn').addEventListener('click', saveGame);
buyEggBtn.addEventListener('click', buyEgg);
let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  // если есть монстры — запускаем цикл
  if (monsters.length > 0 && !isGlobalLoopRunning) {
    startGlobalLoop();
  }

  // включаем звуки всех редкостей, которые должны играть
  const raritiesOnField = new Set(monsters.map(m => m.rarityKey));

  raritiesOnField.forEach(rarity => {
    if (!activeSounds[rarity]) {
      playRaritySound(rarity);
    }
  });
}

// любое взаимодействие пользователя разблокирует звук
document.addEventListener("click", unlockAudio);
document.addEventListener("keydown", unlockAudio);

loadGame();
updateCoinsDisplay();
updateEggPriceDisplay();
renderIncubator();
renderField();
gameLoop();




