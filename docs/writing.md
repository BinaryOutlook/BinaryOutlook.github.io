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
   existing title, date, summary, and link pattern. Preserve the animated ending
   below the list. Keep each public article linked from the index.
5. Preview and review before committing. The article's `.article-closing` class
   is optional; use it when a closing sentence warrants a little extra space.

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
