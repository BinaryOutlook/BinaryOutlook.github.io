# Writing on Binary Outlook

The site is plain HTML, CSS, and JavaScript. Articles are complete static pages:
their text and links work without JavaScript, and there is no build step or
Markdown conversion. The page layout is shared; article outlines are unrestricted.

## Files

- `writing.html`: the chronological index, newest entries first, followed by the
  existing animated contour section.
- `writing/<slug>/index.html`: each article's canonical HTML source and stable URL.
- `writing.css`: shared index and article styles, loaded after `styles.css`.
- `_templates/article.html`: a copyable starter for another article. This is a
  source template, not a published article; its relative paths assume it has been
  copied to `writing/<slug>/index.html`.
- `scripts/update-writing-counts.py`: synchronizes the word counts shown below
  dates on the index and article pages.

## Add an article

1. Choose a short, durable lowercase slug with hyphens. Create
   `writing/<slug>/` and copy `_templates/article.html` into it as `index.html`.
2. Replace every occurrence of these placeholders:

   | Placeholder | Example |
   | --- | --- |
   | `ARTICLE_TITLE` | A Small Tool Worth Keeping |
   | `ARTICLE_DESCRIPTION` | What I learned from maintaining a small developer tool. |
   | `ARTICLE_SLUG` | a-small-tool-worth-keeping |
   | `PUBLICATION_DATE_ISO` | 2026-09-21 |
   | `PUBLICATION_DATE_DISPLAY` | 21 September 2026 |

   Escape text used in HTML: `&` becomes `&amp;`, `<` becomes `&lt;`, and double
   quotes inside attribute values become `&quot;`. Check the document title,
   description, Open Graph metadata, canonical URL, and visible date together.
3. Replace the entire `<p>ARTICLE_BODY</p>` element inside `.article-prose` with
   the article's HTML. Use paragraphs and links freely; add section
   headings only when they help the piece. The article title is the sole `h1`;
   sections begin at `h2`. Body styles also cover lists, quotations, figures,
   captions, and code. Escape code samples inside `<pre><code>…</code></pre>`.
   For a wide table, use an `.article-table` wrapper with `tabindex="0"`,
   `role="region"`, and an accessible label so keyboard users can scroll it.
   Give informative images useful alternative text. Equations or interactive
   illustrations require their own implementation when a future article needs them.
4. Plan a useful photo or illustration alongside the draft, following the visual
   workflow below. Include it where possible; if no visual helps, record that
   decision in the delivery notes. The template includes a commented cover figure
   and sharing metadata, ready to fill in when an image is selected.
5. Add an entry at the top of `.writing-list` in `writing.html`, following the
   existing title, date, word count, summary, and link pattern. Give the count
   span a `data-word-count-for="<slug>"` attribute matching the article folder;
   the article starter already has its own `data-word-count` marker. Preserve the
   animated ending below the list. Keep each listed article linked from the index.
   For an unlisted article, use the workflow below instead of adding an index entry.
6. Preview and review before committing. The article's `.article-closing` class
   is optional; use it when a closing sentence warrants a little extra space.

An optional `.article-cover` figure goes between the header and `.article-prose`.
Keep the image in `assets/writing/`, supply descriptive alternative text and
its actual dimensions, and use a caption to identify an AI-generated image.
Set `og:image` and `og:image:alt` for article-specific sharing previews.

Place cited works in an `.article-references` section after `.article-prose`.
Use a heading, a brief invitation to explore, and a linked list with author or
project credit. Keep references and image captions outside `.article-prose`.

After editing the article body or adding an index entry, refresh counts:

```sh
python3 scripts/update-writing-counts.py
python3 scripts/update-writing-counts.py --check
```

Counts include the text inside `.article-prose`, including the closing sentence;
they exclude the title, byline, image caption, and cited works. Apostrophes and
hyphens within words stay joined, while em dashes separate words. Counts are
stored in HTML so they remain available without JavaScript. `--check` reports
stale counts without modifying files.

## Photos and illustrations

> Please, if possible, add a photo that explains one of the key concepts, or
> provide a useful illustration.

Make a visual decision for every article. Start with one image that helps a reader
understand or picture something in the essay. A cover is a useful default, but an
image can also sit beside the passage it explains. Keep the article readable on
its own, and leave the image out when it would only add decoration.

1. **Write a brief.** Identify the idea the image should make clearer, its place
   in the article, and a suitable medium. Let the essay determine the subject;
   avoid a generic laptop or technology image that could accompany any article.
2. **Choose the right tool.** Use image generation for imagined editorial scenes
   or conceptual illustrations. Use a real photograph, screenshot, or source
   excerpt when showing an actual place, project, or contribution. Use an editable
   diagram or plotting tool when exact labels, data, or technical relationships
   matter. Generated imagery should not stand in for documentary evidence.
3. **Generate and edit.** For a generated asset, use the built-in image generation
   tool and keep the prompt focused on the brief. Match the site's restrained
   ivory, dark ink, and rust palette where appropriate. Prefer images without
   embedded titles or labels; put explanatory text in HTML. Refine the composition
   with a targeted edit when needed, and keep the original output until a final
   version is selected.
4. **Review alongside the prose.** Inspect the image for misleading details,
   unwanted text, and awkward crops. Check factual diagrams against their sources.
   Write alt text describing the useful visual information and a caption that
   explains its relationship to the essay. Label generated imagery clearly, for
   example, “An imagined route network. AI-generated illustration.” Credit and
   link the source of a real photograph or screenshot, and check reuse permission.
5. **Prepare the asset.** Save the final image under `assets/writing/` with a
   descriptive filename. Use a reasonably sized JPEG or WebP for photographic
   imagery, or an appropriate format for a diagram. Record the source, creator,
   license where applicable, or generation tool and final prompt in
   `assets/writing/README.md`. Include any meaningful edits or format conversion.
6. **Place and check it.** Enable the template's cover figure and image metadata
   only after replacing every `ARTICLE_IMAGE_*` placeholder. Use the actual pixel
   width and height, a relative `img` path, and an absolute `og:image` URL. Preview
   on narrow and wide screens, check the image request succeeds, and confirm that
   its caption and sharing preview describe the selected image.

Cover captions stay outside `.article-prose` and do not affect the article's word
count. If placing a figure between passages, close `.article-prose` before the
figure and reopen it after the figure so its caption remains outside the count.
Run the count updater after changing the article markup. Adding an image to an
unlisted article does not change its publication status or add it to the index.

## Unlisted articles

To publish an article for direct-URL access without adding it to site navigation:

1. Add the boolean `data-unlisted` attribute to the page's `<article>` element.
2. Add `<meta name="robots" content="noindex, follow">` inside `<head>` to ask
   search engines not to index the page.
3. Omit its entry from `writing.html` and any feed or sitemap. Do not add incoming
   links from other site pages, including existing articles. The unlisted page can
   retain its normal navigation, return link, and source references.
4. Run the word-count commands above. The script requires exactly one count
   marker in the article and no matching count marker in the writing index.
5. Preview and verify the article using its exact URL, then publish normally.

Unlisted URLs are public, not access protected. Anyone with the URL can read or
share the page; `noindex` is an indexing request rather than access control.

To list the article later, remove `data-unlisted` and the `noindex` meta tag, add
its index entry with the matching word-count marker, and refresh the counts.

## Shared layout

Site navigation and footer markup are copied with the starter, as they are on
the existing pages. If these change, update the index, published articles, and
starter together. Change shared reading styles in `writing.css`; when changing
that stylesheet, update its version query in those pages and the starter too.

## Preview and publish

From the repository root, run:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/writing.html` and follow the article link. Check the
page on a narrow and wide screen, keyboard navigation, the mobile menu, source
links, and the return link. The text must remain readable with JavaScript
disabled; reduced-motion preferences should keep decorative animation still.
Use print preview for a long article. Check `git diff --check` before committing.

The HTML files are the deployment artifacts. Commit only the intended article,
index, and supporting changes. A local commit does not publish the site: use the
repository's configured GitHub Pages publication workflow, then verify the live
index and article URL. Preserve article URLs when revising their content; keep
the original publication date, and add a visible updated date for substantive
revisions when useful.

The first article lives at `/writing/in-search-of-the-free-and-free/`.
