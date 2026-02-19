// lr-app-card — Glass-style app card with category coloring
class LrAppCard extends HTMLElement {
  connectedCallback() {
    const name = this.getAttribute('name') || '';
    const desc = this.getAttribute('desc') || '';
    const href = this.getAttribute('href') || '#';
    const tags = (this.getAttribute('tags') || '').split(',').filter(Boolean);
    const cat = this.getAttribute('category') || 'default';

    const tagHTML = tags.map(t => `<span class="lr-app-tag">${t.trim()}</span>`).join('');

    this.innerHTML = `
      <a class="lr-app-card cat-${cat}" href="${href}">
        <div class="lr-app-card__name">${name}</div>
        <div class="lr-app-card__desc">${desc}</div>
        ${tagHTML ? `<div class="lr-app-card__tags">${tagHTML}</div>` : ''}
      </a>`;
  }
}
customElements.define('lr-app-card', LrAppCard);
