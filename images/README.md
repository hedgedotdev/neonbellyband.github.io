# Images

Drop real photos in here and swap the matching `.photo-placeholder` `<div>`
for an `<img>` tag. Expected filenames the pages already reference in their
placeholder captions:

- `images/band-photo.jpg` — main band photo, used on the homepage sidebar
- `images/members/vocals.jpg`
- `images/members/guitar-lead.jpg`
- `images/members/guitar-rhythm.jpg`
- `images/members/bass.jpg`
- `images/members/drums.jpg`

Example swap, on the homepage:

```html
<!-- before -->
<div class="photo-placeholder profile">BAND PHOTO COMING SOON</div>

<!-- after -->
<img src="images/band-photo.jpg" alt="Neon Belly band photo" class="photo-placeholder profile">
```

The `.photo-placeholder` classes (`profile`, `thumb`, `member`) already set
fixed square sizes, so an `<img>` with the same class will keep the layout
consistent — add `object-fit: cover;` in `css/style.css` if your photos
aren't already square.
