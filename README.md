# Neon Belly

Official static website for Neon Belly, a Tennessee 90s rock / nu-metal band. The site is built as plain HTML, CSS, and browser JavaScript with Vite for local development and production builds.

## Features

- Animated landing screen using the real Neon Belly logo
- Booking contact section
- Instagram profile embed and Facebook page timeline embed
- Band photo slots ready for real assets
- Arcade cabinet section with three browser games:
  - Feedback Dodge
  - Kick Drum
  - Gear Flip
- Static hosting friendly: no server runtime or private API keys required

## Local Development

```bash
npm install
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173/`.

Production build and preview:

```bash
npm run build
npm run preview
```

The production build is generated in `dist/`.

## Project Structure

```text
neonbellyband.com/
├── assets/
│   ├── arcade-stage.png
│   ├── neon-belly-logo.png
│   └── neon-belly-logo-transparent.png
├── index.html
├── script.js
├── styles.css
├── package-lock.json
├── package.json
├── vite.config.js
└── README.md
```

## Edit Band Info

Update `bandConfig` at the top of `script.js`:

- `bookingEmail`
- `instagramUrl`
- `facebookUrl`
- `shows`
- `photos`
- `instagramPosts`

Facebook uses the official Page Plugin iframe for the public page timeline. Instagram uses the official embed script for the public profile or selected public posts; full live-feed pulling would require Meta API access and should not be done with exposed browser-side tokens.

## Add Photos

Place band images in `assets/`, then set each photo object:

```js
photos: [
  { src: "assets/live-1.jpg", caption: "Live lights" },
  { src: "assets/band-shot.jpg", caption: "Band shot" },
  { src: "assets/crowd.jpg", caption: "Crowd noise" }
]
```

## Logo Files

The downloaded band logo is copied to `assets/neon-belly-logo.png`. The site uses `assets/neon-belly-logo-transparent.png`, a transparent-background web copy generated from that source so the neon mark can sit directly on the stage backdrop.

## Hold The Set List

Keep song titles out of `index.html` and `script.js` until after the first show. The arcade memory game uses generic stage-gear labels, so it can stay live without revealing the set.

## Deployment

Repository remote:

```bash
git@github.com:hedgedotdev/neonbellyband.github.io.git
```

The root `index.html` can be served directly by GitHub Pages. For a bundled production deploy, run `npm run build` and publish `dist/` through GitHub Pages or a GitHub Actions Pages workflow.
