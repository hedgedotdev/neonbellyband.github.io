const bandConfig = {
  bookingEmail: "booking@neonbellyband.com",
  instagramUrl: "https://www.instagram.com/neonbelly_band",
  facebookUrl: "https://www.facebook.com/neonbellyTN/",
  facebookPageName: "neonbellyTN",
  instagramPosts: [
    // Add public Instagram post URLs here, for example:
    // "https://www.instagram.com/p/POST_ID/"
  ],
  shows: [
    {
      month: "TBA",
      day: "01",
      venue: "Next show loading",
      city: "Announce your date",
      note: "Update script.js with confirmed bookings."
    },
    {
      month: "TBA",
      day: "02",
      venue: "Club or festival",
      city: "City, ST",
      note: "Doors, ticket link, and age details fit here."
    },
    {
      month: "TBA",
      day: "03",
      venue: "Private event",
      city: "Booking available",
      note: "Use the contact section for quotes."
    }
  ],
  photos: [
    { src: "", caption: "Live lights" },
    { src: "", caption: "Band shot" },
    { src: "", caption: "Crowd noise" }
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function scrollToTopIfNeeded() {
  if (window.location.hash !== "#top") return;
  const jump = () => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  };
  jump();
  requestAnimationFrame(jump);
  setTimeout(jump, 80);
}

function initConfigContent() {
  const bookingEmail = $("#bookingEmail");
  const instagramLink = $("#instagramLink");
  const facebookLink = $("#facebookLink");
  const showGrid = $("#showGrid");
  const photoGrid = $("#photoGrid");
  const instagramPosts = $("#instagramPosts");
  const facebookFrame = $("#facebookFrame");

  bookingEmail.href = `mailto:${bandConfig.bookingEmail}`;
  bookingEmail.textContent = bandConfig.bookingEmail;
  instagramLink.href = bandConfig.instagramUrl;
  facebookLink.href = bandConfig.facebookUrl;

  showGrid.innerHTML = bandConfig.shows.map((show) => `
    <article class="show-card">
      <div class="show-date"><span>${show.month}</span><strong>${show.day}</strong></div>
      <h3>${show.venue}</h3>
      <p>${show.city}</p>
      <p>${show.note}</p>
    </article>
  `).join("");

  photoGrid.innerHTML = bandConfig.photos.map((photo) => {
    const image = photo.src ? `<img src="${photo.src}" alt="${photo.caption}">` : "";
    return `<figure class="photo-card" data-caption="${photo.caption}">${image}</figure>`;
  }).join("");

  if (bandConfig.instagramPosts.length) {
    instagramPosts.innerHTML = bandConfig.instagramPosts.map((url) => `
      <blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14"></blockquote>
    `).join("");
  } else {
    instagramPosts.innerHTML = `
      <blockquote class="instagram-media instagram-profile" data-instgrm-permalink="${bandConfig.instagramUrl}/" data-instgrm-version="14"></blockquote>
    `;
  }
  const instagramScript = document.createElement("script");
  instagramScript.async = true;
  instagramScript.src = "https://www.instagram.com/embed.js";
  document.body.append(instagramScript);

  const encodedFacebook = encodeURIComponent(bandConfig.facebookUrl);
  facebookFrame.innerHTML = `
    <iframe
      title="Neon Belly Facebook feed"
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      src="https://www.facebook.com/plugins/page.php?href=${encodedFacebook}&tabs=timeline&width=500&height=760&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true">
    </iframe>
  `;
}

function initArcadeTabs() {
  const tabs = $$(".game-tab");
  const panels = $$(".game-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const game = tab.dataset.game;
      tabs.forEach((item) => {
        item.classList.toggle("active", item === tab);
        item.setAttribute("aria-selected", item === tab ? "true" : "false");
      });
      panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === game));
      document.dispatchEvent(new CustomEvent("arcade-tab-change", { detail: { game } }));
    });
  });
}

function initKickDrumGame() {
  const canvas = $("#kickCanvas");
  const ctx = canvas.getContext("2d");
  const button = $("#kickButton");
  const resetButton = $("#kickReset");
  const meter = $("#kickMeter");
  const targetsEl = $("#kickTargets");
  const shotsEl = $("#kickShots");
  const bestEl = $("#kickBest");
  const bestKey = "neonbelly.kick.best";
  const gravity = 980;
  const floor = 316;
  let drum;
  let blocks;
  let guitars;
  let particles;
  let shots = 0;
  let charge = 0;
  let charging = false;
  let fired = false;
  let last = 0;
  let raf = 0;
  let loopRunning = false;
  let active = $(".game-panel.active")?.dataset.panel === "tap";

  bestEl.textContent = localStorage.getItem(bestKey) || "0";

  function reset() {
    drum = { x: 104, y: floor - 23, r: 23, vx: 0, vy: 0, resting: true };
    blocks = [
      { x: 506, y: floor - 34, w: 26, h: 68, vx: 0, vy: 0, rot: 0, spin: 0, hit: false, cooldown: 0 },
      { x: 558, y: floor - 34, w: 26, h: 68, vx: 0, vy: 0, rot: 0, spin: 0, hit: false, cooldown: 0 },
      { x: 532, y: floor - 84, w: 104, h: 22, vx: 0, vy: 0, rot: 0, spin: 0, hit: false, cooldown: 0 },
      { x: 500, y: floor - 132, w: 24, h: 70, vx: 0, vy: 0, rot: 0, spin: 0, hit: false, cooldown: 0 },
      { x: 564, y: floor - 132, w: 24, h: 70, vx: 0, vy: 0, rot: 0, spin: 0, hit: false, cooldown: 0 },
      { x: 532, y: floor - 178, w: 98, h: 22, vx: 0, vy: 0, rot: 0, spin: 0, hit: false, cooldown: 0 }
    ];
    guitars = [
      { x: 524, y: floor - 45, knocked: false, wobble: 0 },
      { x: 532, y: floor - 123, knocked: false, wobble: 0 },
      { x: 532, y: floor - 216, knocked: false, wobble: 0 }
    ];
    particles = [];
    charge = 0;
    charging = false;
    fired = false;
    meter.style.width = "0%";
    button.classList.remove("charging");
    stopLoop();
    syncScore();
    draw();
  }

  function isMoving() {
    const drumMoving = !drum.resting || Math.abs(drum.vx) > 1 || Math.abs(drum.vy) > 1;
    const blockMoving = blocks.some((block) => block.hit && (Math.abs(block.vx) > 1 || Math.abs(block.vy) > 1 || Math.abs(block.spin) > 0.1));
    return charging || drumMoving || blockMoving || particles.length > 0;
  }

  function startLoop() {
    if (loopRunning || !active || document.hidden) return;
    loopRunning = true;
    last = performance.now();
    raf = requestAnimationFrame(step);
  }

  function stopLoop() {
    if (!loopRunning) return;
    cancelAnimationFrame(raf);
    loopRunning = false;
  }

  function syncScore() {
    const knocked = guitars.filter((guitar) => guitar.knocked).length;
    targetsEl.textContent = String(knocked);
    shotsEl.textContent = String(shots);
    const score = Math.max(0, knocked * 100 - Math.max(0, shots - 1) * 15);
    const best = Number(localStorage.getItem(bestKey) || 0);
    if (knocked === guitars.length && score > best) {
      localStorage.setItem(bestKey, String(score));
      bestEl.textContent = String(score);
    }
  }

  function drawPedal() {
    ctx.save();
    ctx.translate(68, floor - 10);
    ctx.strokeStyle = "#08d9ff";
    ctx.fillStyle = "rgba(8,217,255,0.12)";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#08d9ff";
    ctx.beginPath();
    ctx.roundRect(-28, -16, 70, 18, 7);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(42, -8);
    ctx.quadraticCurveTo(70, -56 - charge * 0.3, 106, -28);
    ctx.stroke();
    ctx.fillStyle = "#ff19b8";
    ctx.beginPath();
    ctx.arc(110, -28, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGuitar(guitar) {
    ctx.save();
    ctx.translate(guitar.x, guitar.y);
    ctx.rotate(guitar.knocked ? -0.95 : Math.sin(guitar.wobble) * 0.08);
    ctx.shadowBlur = 16;
    ctx.shadowColor = guitar.knocked ? "#65ff7f" : "#ff19b8";
    ctx.strokeStyle = guitar.knocked ? "#65ff7f" : "#ff19b8";
    ctx.fillStyle = guitar.knocked ? "rgba(101,255,127,0.3)" : "rgba(255,25,184,0.34)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(0, 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-8, 17, 13, 18, -0.4, 0, Math.PI * 2);
    ctx.ellipse(10, 17, 13, 18, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff7ff";
    ctx.font = "900 12px Inter";
    ctx.fillText("GTR", -13, 22);
    ctx.restore();
  }

  function drawBlock(block) {
    ctx.save();
    ctx.translate(block.x, block.y);
    ctx.rotate(block.rot);
    ctx.fillStyle = block.hit ? "rgba(255,202,69,0.34)" : "rgba(8,217,255,0.22)";
    ctx.strokeStyle = block.hit ? "#ffca45" : "#08d9ff";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 14;
    ctx.shadowColor = block.hit ? "#ffca45" : "#08d9ff";
    ctx.fillRect(-block.w / 2, -block.h / 2, block.w, block.h);
    ctx.strokeRect(-block.w / 2, -block.h / 2, block.w, block.h);
    ctx.restore();
  }

  function drawDrum() {
    ctx.save();
    ctx.translate(drum.x, drum.y);
    ctx.shadowBlur = 24;
    ctx.shadowColor = "#ff19b8";
    const gradient = ctx.createRadialGradient(-8, -10, 5, 0, 0, drum.r);
    gradient.addColorStop(0, "#fff7ff");
    gradient.addColorStop(0.24, "#ff19b8");
    gradient.addColorStop(1, "#60117e");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, drum.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff7ff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = "900 10px Inter";
    ctx.fillStyle = "#fff7ff";
    ctx.fillText("KICK", -13, 4);
    ctx.restore();
  }

  function drawParticles() {
    particles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 14;
      ctx.shadowColor = particle.color;
      ctx.fillRect(particle.x, particle.y, 4, 4);
      ctx.restore();
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#050407");
    bg.addColorStop(0.55, "#10091e");
    bg.addColorStop(1, "#031720");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(8,217,255,0.14)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,25,184,0.16)";
    ctx.fillRect(0, floor, canvas.width, canvas.height - floor);
    ctx.strokeStyle = "#ff19b8";
    ctx.beginPath();
    ctx.moveTo(0, floor);
    ctx.lineTo(canvas.width, floor);
    ctx.stroke();

    drawPedal();
    guitars.forEach(drawGuitar);
    blocks.forEach(drawBlock);
    drawDrum();
    drawParticles();

    ctx.fillStyle = "rgba(255,247,255,0.76)";
    ctx.font = "900 12px Inter";
    ctx.fillText("Hold / release pedal or press Space", 22, 28);
  }

  function burst(x, y, color) {
    for (let i = 0; i < 14; i += 1) {
      particles.push({
        x,
        y,
        vx: -90 + Math.random() * 180,
        vy: -150 + Math.random() * 110,
        color,
        life: 1
      });
    }
  }

  function hitBlock(block, forceX, forceY) {
    block.cooldown = 0.18;
    if (!block.hit) burst(block.x, block.y, "#ffca45");
    block.hit = true;
    block.vx += forceX;
    block.vy += forceY;
    block.spin += forceX * 0.004;
    blocks.forEach((nearby) => {
      if (nearby === block || nearby.hit) return;
      const closeEnough = Math.abs(nearby.x - block.x) < 125 && Math.abs(nearby.y - block.y) < 185;
      if (!closeEnough) return;
      nearby.hit = true;
      nearby.cooldown = 0.18;
      nearby.vx += forceX * 0.34 + (nearby.x - block.x) * 1.4;
      nearby.vy -= 90 + Math.random() * 45;
      nearby.spin += (nearby.x >= block.x ? 1 : -1) * (2.5 + Math.random() * 1.5);
      burst(nearby.x, nearby.y, "#ffca45");
    });
  }

  function launch() {
    if (!charging) return;
    charging = false;
    button.classList.remove("charging");
    fired = true;
    shots += 1;
    const power = 0.58 + charge / 92;
    drum.x = 104;
    drum.y = floor - 23;
    drum.vx = 540 * power;
    drum.vy = -340 * power;
    drum.resting = false;
    charge = 0;
    meter.style.width = "0%";
    syncScore();
    startLoop();
  }

  function startCharge() {
    if ($(".game-panel.active")?.dataset.panel !== "tap") return;
    if (!drum.resting) return;
    charging = true;
    button.classList.add("charging");
    startLoop();
  }

  function rectCircleCollision(block) {
    const dx = Math.abs(drum.x - block.x);
    const dy = Math.abs(drum.y - block.y);
    return dx <= block.w / 2 + drum.r && dy <= block.h / 2 + drum.r;
  }

  function knockTargets() {
    guitars.forEach((guitar) => {
      if (guitar.knocked) return;
      const drumHit = Math.hypot(drum.x - guitar.x, drum.y - guitar.y) < drum.r + 35;
      const blockHit = blocks.some((block) => block.hit && Math.abs(block.x - guitar.x) < block.w / 2 + 58 && Math.abs(block.y - guitar.y) < block.h / 2 + 58);
      if (drumHit || blockHit) {
        guitar.knocked = true;
        burst(guitar.x, guitar.y, "#65ff7f");
      }
    });
  }

  function step(now) {
    if (!active || document.hidden) {
      stopLoop();
      return;
    }
    const dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now;

    if (charging) {
      charge = (charge + dt * 82) % 100;
      meter.style.width = `${charge}%`;
    }

    if (!drum.resting) {
      drum.vy += gravity * dt;
      drum.x += drum.vx * dt;
      drum.y += drum.vy * dt;
      drum.vx *= 0.985;
      if (drum.y + drum.r > floor) {
        drum.y = floor - drum.r;
        drum.vy *= -0.18;
        drum.vx *= 0.56;
        if (Math.abs(drum.vy) < 65) drum.vy = 0;
        if (Math.abs(drum.vx) < 22) drum.vx = 0;
        if (drum.vy === 0 && drum.vx === 0) drum.resting = true;
      }
    }

    blocks.forEach((block) => {
      block.cooldown = Math.max(0, block.cooldown - dt);
      if (block.cooldown <= 0 && !drum.resting && rectCircleCollision(block)) {
        hitBlock(block, drum.vx * 0.24, drum.vy * 0.08 - 90);
        drum.vx *= -0.36;
        drum.vy -= 80;
      }
      if (block.hit) {
        block.vy += gravity * dt;
        block.x += block.vx * dt;
        block.y += block.vy * dt;
        block.rot += block.spin * dt;
        block.vx *= 0.96;
        block.spin *= 0.94;
        if (block.y + block.h / 2 > floor) {
          block.y = floor - block.h / 2;
          block.vy *= -0.08;
          block.vx *= 0.48;
          block.spin *= 0.45;
          if (Math.abs(block.vy) < 75) block.vy = 0;
          if (Math.abs(block.vx) < 16) block.vx = 0;
          if (Math.abs(block.spin) < 0.35) block.spin = 0;
        }
      }
    });

    if (charging || !drum.resting) guitars.forEach((guitar) => { guitar.wobble += dt * 8; });
    particles.forEach((particle) => {
      particle.vy += gravity * 0.6 * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt * 1.4;
    });
    particles = particles.filter((particle) => particle.life > 0);

    knockTargets();
    syncScore();
    draw();
    if (isMoving()) {
      raf = requestAnimationFrame(step);
    } else {
      stopLoop();
    }
  }

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    startCharge();
  });
  button.addEventListener("pointerup", launch);
  button.addEventListener("pointerleave", launch);
  resetButton.addEventListener("click", () => {
    shots = 0;
    reset();
  });
  document.addEventListener("arcade-tab-change", (event) => {
    active = event.detail.game === "tap";
    if (active) {
      draw();
      if (isMoving()) startLoop();
    } else {
      stopLoop();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopLoop();
    } else if (active) {
      draw();
      if (isMoving()) startLoop();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.code === "Space" && $(".game-panel.active")?.dataset.panel === "tap") {
      event.preventDefault();
      if (!charging) startCharge();
    }
  });
  window.addEventListener("keyup", (event) => {
    if (event.code === "Space" && $(".game-panel.active")?.dataset.panel === "tap") {
      event.preventDefault();
      launch();
    }
  });

  reset();
}

function initDodgeGame() {
  const canvas = $("#dodgeCanvas");
  const ctx = canvas.getContext("2d");
  const start = $("#dodgeStart");
  const scoreEl = $("#dodgeScore");
  const livesEl = $("#dodgeLives");
  const bestEl = $("#dodgeBest");
  const bestKey = "neonbelly.dodge.best";
  const keys = new Set();
  let player;
  let items;
  let score;
  let lives;
  let running = false;
  let last = 0;
  let spawn = 0;
  let raf = 0;

  bestEl.textContent = localStorage.getItem(bestKey) || "0";

  function reset() {
    player = { x: canvas.width / 2, y: canvas.height - 42, w: 60, h: 18 };
    items = [];
    score = 0;
    lives = 3;
    spawn = 0;
    scoreEl.textContent = "0";
    livesEl.textContent = "3";
  }

  function drawGrid() {
    ctx.strokeStyle = "rgba(8,217,255,0.14)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#050407");
    bg.addColorStop(0.5, "#110822");
    bg.addColorStop(1, "#031720");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    items.forEach((item) => {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.fillStyle = item.kind === "note" ? "#65ff7f" : "#ff19b8";
      ctx.shadowBlur = 22;
      ctx.shadowColor = ctx.fillStyle;
      if (item.kind === "note") {
        ctx.beginPath();
        ctx.arc(0, 0, item.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(item.r * 0.5, -item.r * 2.2, 5, item.r * 2.2);
      } else {
        ctx.rotate(item.y * 0.02);
        ctx.fillRect(-item.r, -item.r, item.r * 2, item.r * 2);
        ctx.strokeStyle = "#fff";
        ctx.strokeRect(-item.r * 0.5, -item.r * 0.5, item.r, item.r);
      }
      ctx.restore();
    });

    ctx.save();
    ctx.fillStyle = "#08d9ff";
    ctx.shadowBlur = 26;
    ctx.shadowColor = "#08d9ff";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 24);
    ctx.lineTo(player.x + player.w / 2, player.y + 16);
    ctx.lineTo(player.x - player.w / 2, player.y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function spawnItem() {
    items.push({
      x: 28 + Math.random() * (canvas.width - 56),
      y: -28,
      r: 12 + Math.random() * 10,
      vy: 110 + Math.random() * 110 + score * 2,
      kind: Math.random() > 0.32 ? "note" : "static"
    });
  }

  function collide(item) {
    return (
      Math.abs(item.x - player.x) < player.w / 2 + item.r &&
      Math.abs(item.y - player.y) < player.h + item.r
    );
  }

  function endRun() {
    running = false;
    cancelAnimationFrame(raf);
    const best = Number(localStorage.getItem(bestKey) || 0);
    if (score > best) {
      localStorage.setItem(bestKey, String(score));
      bestEl.textContent = String(score);
    }
    draw();
  }

  function loop(now) {
    if (document.hidden || $(".game-panel.active")?.dataset.panel !== "dodge") {
      endRun();
      return;
    }
    const dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now;

    if (keys.has("ArrowLeft") || keys.has("KeyA")) player.x -= 330 * dt;
    if (keys.has("ArrowRight") || keys.has("KeyD")) player.x += 330 * dt;
    player.x = Math.max(32, Math.min(canvas.width - 32, player.x));

    spawn -= dt;
    if (spawn <= 0) {
      spawnItem();
      spawn = Math.max(0.34, 0.82 - score * 0.012);
    }

    items.forEach((item) => { item.y += item.vy * dt; });
    items = items.filter((item) => {
      if (collide(item)) {
        if (item.kind === "note") {
          score += 1;
          scoreEl.textContent = String(score);
        } else {
          lives -= 1;
          livesEl.textContent = String(lives);
          if (lives <= 0) endRun();
        }
        return false;
      }
      return item.y < canvas.height + 34;
    });

    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  start.addEventListener("click", () => {
    if (document.hidden) return;
    if (running) cancelAnimationFrame(raf);
    reset();
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  });

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(event.code)) {
      keys.add(event.code);
      if ($(".game-panel.active")?.dataset.panel === "dodge") event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => keys.delete(event.code));
  document.addEventListener("arcade-tab-change", (event) => {
    if (event.detail.game !== "dodge" && running) endRun();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) endRun();
  });
  reset();
  draw();
}

function initMemoryGame() {
  const board = $("#memoryBoard");
  const movesEl = $("#memoryMoves");
  const matchesEl = $("#memoryMatches");
  const bestEl = $("#memoryBest");
  const start = $("#memoryStart");
  const bestKey = "neonbelly.memory.best";
  const icons = ["MIC", "AMP", "RIF", "KIK", "PCK", "CRT"];
  let cards = [];
  let first = null;
  let lock = false;
  let moves = 0;
  let matches = 0;

  function shuffle(items) {
    return items
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  function syncScore() {
    movesEl.textContent = String(moves);
    matchesEl.textContent = String(matches);
    bestEl.textContent = localStorage.getItem(bestKey) || "--";
  }

  function render() {
    board.innerHTML = cards.map((card, index) => `
      <button class="memory-card ${card.revealed ? "revealed" : ""} ${card.matched ? "matched" : ""}" type="button" data-index="${index}" aria-label="Memory card">
        ${card.revealed || card.matched ? card.value : "NB"}
      </button>
    `).join("");
  }

  function newGame() {
    cards = shuffle([...icons, ...icons]).map((value) => ({ value, revealed: false, matched: false }));
    first = null;
    lock = false;
    moves = 0;
    matches = 0;
    syncScore();
    render();
  }

  board.addEventListener("click", (event) => {
    const button = event.target.closest(".memory-card");
    if (!button || lock) return;
    const index = Number(button.dataset.index);
    const card = cards[index];
    if (!card || card.revealed || card.matched) return;

    card.revealed = true;
    if (first === null) {
      first = index;
      render();
      return;
    }

    moves += 1;
    const previous = cards[first];
    if (previous.value === card.value) {
      previous.matched = true;
      card.matched = true;
      matches += 1;
      first = null;
      if (matches === icons.length) {
        const best = Number(localStorage.getItem(bestKey) || 999);
        if (moves < best) localStorage.setItem(bestKey, String(moves));
      }
      syncScore();
      render();
      return;
    }

    lock = true;
    syncScore();
    render();
    setTimeout(() => {
      previous.revealed = false;
      card.revealed = false;
      first = null;
      lock = false;
      render();
    }, 650);
  });

  start.addEventListener("click", newGame);
  newGame();
}

document.addEventListener("DOMContentLoaded", () => {
  initConfigContent();
  initArcadeTabs();
  initKickDrumGame();
  initDodgeGame();
  initMemoryGame();
  scrollToTopIfNeeded();
  window.addEventListener("hashchange", scrollToTopIfNeeded);
  $$('a[href="#top"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      history.pushState(null, "", "#top");
      scrollToTopIfNeeded();
    });
  });
});
