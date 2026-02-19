#!/usr/bin/env node
/**
 * Build blog HTML files from JSON data files.
 * 
 * Source of truth: blog/data/*.json
 * Output: blog/*.html (fully static, SEO-friendly)
 * Also syncs: data/blog-posts.json (listing index)
 * 
 * Usage: node scripts/build-blogs.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'blog', 'data');
const BLOG_DIR = path.join(ROOT, 'blog');
const INDEX_FILE = path.join(ROOT, 'data', 'blog-posts.json');

// Escape HTML attribute values
const escAttr = s => (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function buildPost(post) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="../js/lr-head.js"></script>
  <script src="../js/lr-layout.js"></script>
</head>
<body class="lp">

  <lr-head
    title="${escAttr(post.pageTitle || post.title + ' — Last Rev')}"
    description="${escAttr(post.description)}"
  ></lr-head>

  <lr-layout active="blog" cta-text="Get in Touch" cta-href="mailto:hello@lastrev.com">
    <div class="blog-post-container">
      <cc-blog mode="post" title="${escAttr(post.title)}" author="${escAttr(post.author)}" date="${escAttr(post.date)}" category="${escAttr(post.category)}" read-time="${escAttr(post.readTime)}" back-href="../blog.html">
        <div slot="content">
${post.content}
        </div>
      </cc-blog>
    </div>
  </lr-layout>

</body>
</html>
`;
}

function buildIndex(posts) {
  return posts
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(p => ({
      title: p.title,
      slug: p.slug,
      excerpt: p.description,
      author: p.author,
      date: p.date,
      category: p.category,
      readTime: p.readTime,
      featured: p.featured || false,
      href: `blog/${p.slug}.html`,
      promoImage: p.promoImage || ''
    }));
}

// --- Main ---
const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
const posts = [];

for (const file of jsonFiles) {
  const post = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  posts.push(post);

  const html = buildPost(post);
  const outPath = path.join(BLOG_DIR, `${post.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log(`✓ blog/${post.slug}.html`);
}

// Sync blog index
const index = buildIndex(posts);
fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
console.log(`✓ data/blog-posts.json (${index.length} posts)`);

console.log(`\nBuild complete: ${posts.length} blog posts`);
