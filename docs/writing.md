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
4. Add an entry at the top of `.writing-list` in `writing.html`, following the
   existing title, date, word count, summary, and link pattern. Give the count
   span a `data-word-count-for="<slug>"` attribute matching the article folder;
   the article starter already has its own `data-word-count` marker. Preserve the
   animated ending below the list. Keep each listed article linked from the index.
   For an unlisted article, use the workflow below instead of adding an index entry.
5. Preview and review before committing. The article's `.article-closing` class
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
