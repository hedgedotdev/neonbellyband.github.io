// Neon Belly — small no-build-step touches.

// "Last updated" stamp. Fills every element with id="last-updated" or id="footer-updated" on the page.
(function () {
  var opts = { year: "numeric", month: "short", day: "numeric" };
  var stamp = new Date().toLocaleDateString(undefined, opts);
  ["last-updated", "footer-updated"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = stamp;
  });
})();

// ---------------------------------------------------------------
// Real TV static in the hero.
//
// CSS noise (SVG turbulence) reads as soft blobs, not broadcast snow.
// Actual static is per-pixel random luminance, so we paint it: a small
// canvas (cheap) of pure random gray pixels, upscaled with pixelated
// rendering to keep the speckle crisp. Redrawn ~20fps and occasionally
// disturbed by a brighter horizontal roll band, like a detuned set.
// ---------------------------------------------------------------
(function () {
  var heroes = document.querySelectorAll(".hero");
  if (!heroes.length) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Still paint one frame so it isn't a dead flat panel, but don't animate.
    heroes.forEach(function (hero) { mount(hero, false); });
    return;
  }
  heroes.forEach(function (hero) { mount(hero, true); });

  function mount(hero, animate) {
    var canvas = document.createElement("canvas");
    canvas.className = "static-canvas";
    hero.insertBefore(canvas, hero.firstChild);
    hero.classList.add("static-on");

    // Scanline pass goes last in the DOM so it paints over the headline.
    var lines = document.createElement("div");
    lines.className = "crt-lines";
    hero.appendChild(lines);

    // Sigil sits behind the headline (both z-index 1, headline later in the
    // DOM), so the type reads over the shape.
    var sigilWrap = document.createElement("div");
    sigilWrap.className = "hero-sigil-wrap";
    sigilWrap.innerHTML = '<div class="hero-sigil"></div>';
    hero.insertBefore(sigilWrap, canvas.nextSibling);

    // Centre it on the wordmark rather than on the hero box: hero padding
    // differs per page, so a fixed offset leaves the triangle sitting low.
    function placeSigil() {
      var title = hero.querySelector(".hero-title");
      if (!title) return;
      var h = hero.getBoundingClientRect();
      var t = title.getBoundingClientRect();

      // Size to the hero and to the wordmark, whichever is tighter: the hero
      // clips overflow, so an oversized triangle loses its top bar.
      var size = Math.min(340, h.height - 26, Math.max(190, t.width * 1.35));
      if (size < 120) { sigilWrap.style.display = ""; return; }

      // Keep it centred on the wordmark, but pull it back inside the hero if
      // that would push the top edge out of frame.
      var centre = (t.top - h.top) + t.height / 2;
      var min = size / 2 + 10;
      var max = h.height - size / 2 - 10;
      if (max > min) centre = Math.min(Math.max(centre, min), max);

      sigilWrap.style.width = size + "px";
      sigilWrap.style.height = size + "px";
      sigilWrap.style.top = centre + "px";
    }
    placeSigil();
    window.addEventListener("resize", placeSigil);
    // fonts land after first paint and change the title box, so re-measure
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(placeSigil);
    }

    // Tube glow / corner falloff sits above everything.
    var glow = document.createElement("div");
    glow.className = "tv-glow";
    hero.appendChild(glow);

    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    var w, h, image, buf;
    var visible = true;
    var pageVisible = document.visibilityState !== "hidden";

    // The canvas is upscaled to fill the hero, so its internal resolution has
    // to track the hero's aspect ratio — a fixed-size buffer gets stretched
    // wider than tall and the snow smears into horizontal streaks.
    // PX is the on-screen size of one noise pixel. On phones, coarser snow
    // and a slower redraw preserve the effect without burning battery.
    function mobileHero() {
      return window.matchMedia && window.matchMedia("(max-width: 700px)").matches;
    }

    function pixelSize() {
      return mobileHero() ? 8 : 3;
    }

    function frameMs() {
      return mobileHero() ? 240 : 50;
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      var px = pixelSize();
      var nw = Math.max(8, Math.round(rect.width / px));
      var nh = Math.max(8, Math.round(rect.height / px));
      if (nw === w && nh === h) return;
      w = canvas.width = nw;
      h = canvas.height = nh;
      image = ctx.createImageData(w, h);
      buf = image.data;
    }

    resize();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        frame();
      }, 150);
    });

    // Every pixel is independent. Correlating neighbours horizontally (run
    // lengths) or biasing whole rows both read as stretched horizontal
    // lines rather than snow, so neither is used here.
    function frame() {
      for (var i = 0, n = w * h; i < n; i++) {
        var v = (Math.random() * 255) | 0;
        var p = i << 2;
        buf[p] = v;
        buf[p + 1] = v;
        buf[p + 2] = v;
        // Sparse hot pixels carry the sparkle; the rest stay faint so the
        // snow reads as texture behind the type, not a curtain over it.
        buf[p + 3] = v > 215 ? 155 : 60;
      }
      ctx.putImageData(image, 0, 0);
    }

    frame();
    if (!animate || mobileHero()) return;

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        visible = !!(entries[0] && entries[0].isIntersecting);
      });
      observer.observe(hero);
    }

    document.addEventListener("visibilitychange", function () {
      pageVisible = document.visibilityState !== "hidden";
    });

    // Desktop runs ~20fps; phones run ~4fps with fewer pixels. Use a timer
    // instead of waking on every requestAnimationFrame; the canvas only wakes
    // when it is time to draw.
    (function loop() {
      window.setTimeout(function () {
        if (visible && pageVisible) {
          frame();
        }
        loop();
      }, frameMs());
    })();
  }
})();

// ---------------------------------------------------------------
// Next-show countdown.
//
// The first .show-row in each .shows-list is treated as the next show.
// Add data-show-date="YYYY-MM-DD" to that row and this drops a date badge
// into its .details text. Past dates intentionally render no countdown.
// ---------------------------------------------------------------
(function () {
  var DAY = 24 * 60 * 60 * 1000;
  var lists = document.querySelectorAll(".shows-list");
  if (!lists.length) return;

  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  lists.forEach(function (list) {
    var row = list.querySelector(".show-row");
    if (!row) return;

    var raw = row.getAttribute("data-show-date");
    var match = raw && raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return;

    var showDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    var days = Math.round((showDate.getTime() - today.getTime()) / DAY);
    if (days < 0) return;

    var details = row.querySelector(".details");
    if (!details || details.querySelector(".show-countdown")) return;

    var dateText = document.createElement("span");
    dateText.className = "show-date-text";
    while (details.firstChild) {
      dateText.appendChild(details.firstChild);
    }

    var badge = document.createElement("span");
    badge.className = "show-countdown";
    badge.textContent = days === 0 ? "SHOW TODAY" : days + " " + (days === 1 ? "DAY" : "DAYS") + " AWAY";
    details.appendChild(badge);
    details.appendChild(dateText);
  });
})();

// ---------------------------------------------------------------
// Empty shows list -> booking call to action.
//
// Any .shows-list[data-empty-cta] that holds no .show-row gets the CTA
// instead, so adding a real show is just pasting a .show-row into the
// container and the CTA disappears on its own. The secondary "see booking
// info" line is hidden while the CTA is up so the ask is not made twice.
// ---------------------------------------------------------------
(function () {
  var lists = document.querySelectorAll(".shows-list[data-empty-cta]");
  if (!lists.length) return;

  lists.forEach(function (list) {
    if (list.querySelector(".show-row")) return;

    var href = list.getAttribute("data-booking-href") || "booking.html";

    var box = document.createElement("div");
    box.className = "shows-empty";
    box.innerHTML =
      '<span class="shows-empty-head">No shows on the books right now</span>' +
      '<a class="btn book" href="' + href + '">Book Us Now</a>';
    list.appendChild(box);

    var section = list.closest("section");
    if (section) {
      var secondary = section.querySelector(".shows-secondary");
      if (secondary) secondary.style.display = "none";
    }
  });
})();

// ---------------------------------------------------------------
// Sleeve switcher.
//
// A small record in the corner opens a grid of "sleeve" tiles. Each tile
// is an abstract composition built from its own theme's colours: a nod to
// the record the palette came from, never a reproduction of the artwork.
// Picking one sets the palette plus the display and title faces chosen to
// suit that cover, and the choice persists across pages and visits.
// ---------------------------------------------------------------
(function () {
  var K_THEME = "neonbelly-theme";
  var K_FONT  = "neonbelly-font";
  var K_TITLE = "neonbelly-title";
  var DEFAULT_ID = "utero";

  var SETS = [
    { id: "foo",            name: "Foo",           font: "oswald",      title: "yellowtail" },
    { id: "dirt",           name: "Dirt",          font: "stencilbold", title: "wetpaint" },
    { id: "core",           name: "Core",          font: "teko",        title: "archivo" },
    { id: "mellon",         name: "Mellon Collie", font: "josefin",     title: "yellowtail" },
    { id: "masterofreality", name: "Master of Reality", font: "teko",   title: "puddles" },
    { id: "badmotorfinger", name: "Badmotor",      font: "barlow",      title: "distressed" },
    { id: "utero",          name: "In Utero",      font: "typewriter",  title: "" },
    { id: "rustinpeace",    name: "Rust in Peace", font: "stencilbold", title: "burned" },
    { id: "evilempire",     name: "Evil Empire",   font: "barlow",      title: "spray" },
    { id: "poison",         name: "Open Up",       font: "teko",        title: "lacquer" },
    { id: "powerage",       name: "Powerage",      font: "stencilbold", title: "distressed" },
    { id: "gish",           name: "Gish",          font: "josefin",     title: "vinyl" }
  ];

  function attr(name, val) {
    if (val) document.documentElement.setAttribute(name, val);
    else document.documentElement.removeAttribute(name);
  }

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function applySet(set) {
    attr("data-theme", set.id);
    attr("data-font", set.font);
    attr("data-title", set.title);
    store(K_THEME, set.id);
    store(K_FONT, set.font);
    store(K_TITLE, set.title);
  }

  // no chooser for the faces any more, so they always come from the set
  function find(id) {
    for (var i = 0; i < SETS.length; i++) {
      if (SETS[i].id === id) return SETS[i];
    }
    return null;
  }

  // In Utero is the default; a visitor's pick persists from then on
  var current = find(read(K_THEME)) || find(DEFAULT_ID) || SETS[0];
  attr("data-theme", current.id);
  attr("data-font", current.font);
  attr("data-title", current.title);
  try { localStorage.removeItem("neonbelly-effect"); } catch (e) {}
  document.documentElement.removeAttribute("data-effect");

  function build() {
    var btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Change the site's colour scheme");
    btn.title = "Change the look";
    
    var panel = document.createElement("div");
    panel.className = "theme-panel";
    panel.innerHTML = '<p class="theme-note">Pick a sleeve.</p>';

    var grid = document.createElement("div");
    grid.className = "sleeve-grid";

    SETS.forEach(function (set) {
      var tile = document.createElement("button");
      tile.className = "sleeve sv-" + set.id + (set.id === current.id ? " active" : "");
      tile.title = set.name;
      tile.setAttribute("aria-label", set.name);
      tile.innerHTML = "<span>" + set.name + "</span>";
      tile.addEventListener("click", function () {
        applySet(set);
        grid.querySelectorAll(".sleeve").forEach(function (x) {
          x.classList.remove("active");
        });
        tile.classList.add("active");
      });
      grid.appendChild(tile);
    });

    panel.appendChild(grid);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (!panel.contains(e.target)) panel.classList.remove("open");
    });

    // sit it in the nav alongside the other items; fall back to the corner
    // if a page ever lacks the nav
    var nav = document.querySelector(".nav-row .main-nav");
    if (nav) nav.appendChild(btn);
    else {
      btn.classList.add("theme-toggle-floating");
      document.body.appendChild(btn);
    }
    document.body.appendChild(panel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();

// ---------------------------------------------------------------
// Gallery lightbox.
//
// Every real photo inside a .post-gallery (posters and snapshots alike —
// the still-empty PHOTO placeholders aren't real <img> tags, so they're
// naturally skipped) opens full-size on click. The photos across the
// whole page are one flat, DOM-ordered list, so next/prev just walks that
// list: run off the end of one blog post's photos and > carries straight
// into the next post's. The title bar names whichever post the photo is
// from.
// ---------------------------------------------------------------
(function () {
  var imgs = Array.prototype.slice.call(document.querySelectorAll(".post-gallery img"));
  if (!imgs.length) return;

  function titleFor(img) {
    var post = img.closest("article.blog-post");
    if (post) {
      var h = post.querySelector("h2");
      if (h) return h.textContent.trim();
    }
    var hero = document.querySelector(".hero-title");
    if (hero) return hero.textContent.trim();
    return document.title;
  }

  var items = imgs.map(function (img) {
    return { src: img.getAttribute("data-full-src") || img.currentSrc || img.src, alt: img.alt || "", title: titleFor(img) };
  });

  var overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.innerHTML =
    '<button type="button" class="lightbox-close" aria-label="Close">&times;</button>' +
    '<button type="button" class="lightbox-prev" aria-label="Previous photo">&lsaquo;</button>' +
    '<figure class="lightbox-figure">' +
      '<figcaption class="lightbox-title"></figcaption>' +
      '<img class="lightbox-img" alt="">' +
    "</figure>" +
    '<button type="button" class="lightbox-next" aria-label="Next photo">&rsaquo;</button>';
  document.body.appendChild(overlay);

  var imgEl = overlay.querySelector(".lightbox-img");
  var titleEl = overlay.querySelector(".lightbox-title");
  var idx = 0;

  function show(i) {
    idx = (i + items.length) % items.length;
    var it = items[idx];
    imgEl.src = it.src;
    imgEl.alt = it.alt;
    titleEl.textContent = it.title;
  }

  function open(i) {
    show(i);
    overlay.classList.add("open");
    document.body.classList.add("lightbox-lock");
  }

  function close() {
    overlay.classList.remove("open");
    document.body.classList.remove("lightbox-lock");
    imgEl.src = "";
  }

  imgs.forEach(function (img, i) {
    img.addEventListener("click", function () { open(i); });
  });

  overlay.querySelector(".lightbox-prev").addEventListener("click", function () { show(idx - 1); });
  overlay.querySelector(".lightbox-next").addEventListener("click", function () { show(idx + 1); });
  overlay.querySelector(".lightbox-close").addEventListener("click", close);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) close();
  });

  document.addEventListener("keydown", function (e) {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "ArrowRight") show(idx + 1);
  });
})();
