# Project preview media

Every project already has an interactive live repository snapshot. Selecting a
project updates the preview with its latest GitHub activity, primary language,
stars, and default-branch commit count. Repository metadata and commit history
load independently, so one unavailable endpoint does not blank the entire
preview. This gives the preview a useful default before demonstration media
exists.

The same preview surface is wired to the filenames below. Media is disabled by
default, so missing files never produce requests or broken-player states. When
enabled, the video takes over the repository snapshot while it plays.

| Project | WebM | MP4 fallback | Poster |
| --- | --- | --- | --- |
| HaLoop | `haloop.webm` | `haloop.mp4` | `haloop-poster.webp` |
| BadmintonManager | `badminton-manager.webm` | `badminton-manager.mp4` | `badminton-manager-poster.webp` |
| The Lank Forenzo Simulator | `lank-forenzo.webm` | `lank-forenzo.mp4` | `lank-forenzo-poster.webp` |
| SemantrisPlus | `semantris-plus.webm` | `semantris-plus.mp4` | `semantris-plus-poster.webp` |

To publish a preview:

1. Add the WebM, MP4, and WebP poster using the corresponding filenames.
2. In `index.html`, change that project's `data-preview-enabled` value from
   `false` to `true`.
3. Test hover and keyboard focus on desktop, then the Preview button and native
   video controls on a touch-sized viewport.

Recommended clips are muted, loop cleanly, last roughly 6–10 seconds, and show
one legible interaction rather than a complete product tour. Keep each preview
small enough for quick loading; the page uses `preload="none"` until the project
is activated.
