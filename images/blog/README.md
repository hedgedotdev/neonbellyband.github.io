# Blog photos

Placeholder tiles in `blog.html` name the exact file each slot expects:

- `the-pond-2026-07-11-1.jpg` … `-2.jpg`, `-3.jpg` — debut show at The Pond
- `kimbros-2026-08-08-1.jpg` … `-2.jpg`, `-3.jpg` — Kimbro's

To swap one in, replace the placeholder `<div class="post-photo">…</div>`
with an `<img>` inside the same `<figure>`:

```html
<figure>
  <img src="images/blog/kimbros-2026-08-08-1.jpg" alt="Neon Belly at Kimbro's">
  <figcaption>The room, mid-set</figcaption>
</figure>
```

Landscape 4:3 crops match the placeholder shape. Any count works — add or
remove `<figure>` blocks and the row reflows.
