/* <cc-github-pr> — Shared GitHub PR display component
   Renders a PR with linked title, Jira ticket detection, repo link, and age.

   Usage as element:
     <cc-github-pr url="https://github.com/org/repo/pull/123" title="IAS-456 Fix header" repo="my-repo"></cc-github-pr>

   Usage as JS helper (for template literals):
     CCGitHubPR.render({ url, title, repo, repoUrl, author, age, body })
     CCGitHubPR.extractJira(text) — returns [{key:'IAS-123', url:'https://...'}]

   Jira base URL: https://lastrev.atlassian.net/browse/
*/
(function() {
  const JIRA_BASE = 'https://lastrev.atlassian.net/browse/';
  // Match common Jira ticket patterns: PROJECT-123
  const JIRA_RE = /\b([A-Z][A-Z0-9]+-\d+)\b/g;

  function extractJira(text) {
    if (!text) return [];
    const seen = new Set();
    const tickets = [];
    let m;
    while ((m = JIRA_RE.exec(text)) !== null) {
      const key = m[1];
      if (!seen.has(key)) {
        seen.add(key);
        tickets.push({ key, url: JIRA_BASE + key });
      }
    }
    return tickets;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function render(pr) {
    const url = pr.url || '#';
    const title = pr.title || '';
    const body = pr.body || pr.description || '';
    const repo = pr.repo || '';
    const repoUrl = pr.repoUrl || (url.match(/github\.com\/([^/]+\/[^/]+)/) ? `https://github.com/${url.match(/github\.com\/([^/]+\/[^/]+)/)[1]}` : '#');
    const author = pr.author || '';
    const age = pr.age || '';
    const ageClass = pr.ageClass || '';

    // Extract Jira tickets from title + body
    const tickets = extractJira(title + ' ' + body);

    const jiraHtml = tickets.map(t =>
      `<a href="${esc(t.url)}" target="_blank" rel="noopener" class="gh-pr-jira">${esc(t.key)}</a>`
    ).join(' ');

    // Strip Jira keys from title for cleaner display
    let cleanTitle = title;
    tickets.forEach(t => {
      cleanTitle = cleanTitle.replace(new RegExp('\\s*' + t.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[:\\s-]*', 'g'), ' ');
    });
    cleanTitle = cleanTitle.trim().replace(/^\s*[-–—:]\s*/, '');
    if (!cleanTitle) cleanTitle = title; // fallback if title was just the ticket

    return `<div class="gh-pr">
      <div class="gh-pr-main">
        ${jiraHtml ? `<span class="gh-pr-tickets">${jiraHtml}</span>` : ''}
        <a href="${esc(url)}" target="_blank" rel="noopener" class="gh-pr-title">${esc(cleanTitle)}</a>
      </div>
      <div class="gh-pr-meta">
        ${repo ? `<a href="${esc(repoUrl)}" target="_blank" rel="noopener" class="gh-pr-repo">${esc(repo)}</a>` : ''}
        ${author ? (window.CCUserPill ? CCUserPill.html({ githubHandle: author, name: author, size: 'sm', href: `https://github.com/${author}` }) : `<span class="gh-pr-author">${esc(author)}</span>`) : ''}
        ${age ? `<span class="gh-pr-age ${ageClass}">${age}</span>` : ''}
      </div>
    </div>`;
  }

  window.CCGitHubPR = { render, extractJira };

  class CcGithubPr extends HTMLElement {
    static get observedAttributes() { return ['url', 'title', 'repo', 'repo-url', 'author', 'age', 'body']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }
    _render() {
      this.innerHTML = render({
        url: this.getAttribute('url'),
        title: this.getAttribute('title'),
        repo: this.getAttribute('repo'),
        repoUrl: this.getAttribute('repo-url'),
        author: this.getAttribute('author'),
        age: this.getAttribute('age'),
        body: this.getAttribute('body'),
      });
    }
  }

  customElements.define('cc-github-pr', CcGithubPr);
})();
