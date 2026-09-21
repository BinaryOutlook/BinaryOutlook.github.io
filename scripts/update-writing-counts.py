"""Refresh static word counts from article bodies; no browser JavaScript needed."""

import argparse
from html.parser import HTMLParser
from pathlib import Path
import re


class ArticleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.prose_depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "div":
            classes = dict(attrs).get("class", "").split()
            if self.prose_depth or "article-prose" in classes:
                self.prose_depth += 1

    def handle_endtag(self, tag):
        if tag == "div" and self.prose_depth:
            self.prose_depth -= 1

    def handle_data(self, data):
        if self.prose_depth:
            self.parts.append(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Report stale counts without writing files")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    index_path = root / "writing.html"
    index = index_path.read_text()
    changes = {}
    for article_path in sorted((root / "writing").glob("*/index.html")):
        article = article_path.read_text()
        body = ArticleText()
        body.feed(article)
        if not body.parts:
            raise ValueError(f"Missing article body: {article_path}")
        # Apostrophes and hyphens within words stay joined; em dashes separate words.
        count = len(re.findall(r"\b\w+(?:[’'-]\w+)*\b", " ".join(body.parts)))
        label = f"{count:,} words"
        updated_article, article_matches = re.subn(
            r'(<span\b[^>]*\bdata-word-count>)[^<]*(</span>)',
            lambda match: match[1] + label + match[2],
            article,
        )
        slug = article_path.parent.name
        index, index_matches = re.subn(
            rf'(<span\b[^>]*\bdata-word-count-for="{re.escape(slug)}">)[^<]*(</span>)',
            lambda match: match[1] + label + match[2],
            index,
        )
        if article_matches != 1 or index_matches != 1:
            raise ValueError(f"Expected one article and one index word-count marker for {slug}")
        if updated_article != article:
            changes[article_path] = updated_article
        print(f"{slug}: {label}")
    if index != index_path.read_text():
        changes[index_path] = index
    if args.check and changes:
        raise SystemExit("Word counts are stale. Run python3 scripts/update-writing-counts.py")
    for path, content in changes.items():
        path.write_text(content)


if __name__ == "__main__":
    main()
