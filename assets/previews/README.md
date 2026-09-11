# Project preview media

Selecting a project updates the panel's short summary, **Novelty**, optional
**Built on** credit, and a project-specific setup or installation action. Novelty
describes the project's distinctive approach, not an industry-first claim or an
individual contribution. These details live in the card's `data-preview-summary`,
`data-preview-novelty`, `data-preview-foundation`, `data-preview-action-label`, and
`data-preview-action-url` attributes.

The GitHub snapshot shows repository activity, language, stars, commit count,
and the latest default-branch commit title, date, and link. Metadata and commit
history load independently; an unavailable endpoint leaves the other useful.
Empty repositories show “No commits yet.” Full failures keep the project details
and action available. The timestamp records when data was fetched, including
cached snapshots; Refresh explicitly fetches that project's data again.

The panel sticks on desktop only when it fits within the viewport. On smaller
screens, selecting Preview scrolls to the project details. Selection updates via
hover, keyboard focus, or the Preview button; automatic scroll selection pauses
while the pointer or keyboard focus is inside the detail panel.

The same preview surface is wired to the filenames below. Media is disabled by
default, so missing files never produce requests or broken-player states. When
enabled, the video takes over the repository snapshot while it plays.

| Project | WebM | MP4 fallback | Poster |
| --- | --- | --- | --- |
| HaLoop | `haloop.webm` | `haloop.mp4` | `haloop-poster.webp` |
| Binary Markdown | `binary-markdown.webm` | `binary-markdown.mp4` | `binary-markdown-poster.webp` |
| BadmintonManager | `badminton-manager.webm` | `badminton-manager.mp4` | `badminton-manager-poster.webp` |
| The Lank Forenzo Simulator | `lank-forenzo.webm` | `lank-forenzo.mp4` | `lank-forenzo-poster.webp` |

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
