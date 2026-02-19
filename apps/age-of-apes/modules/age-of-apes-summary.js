class AgeOfApesSummary extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<div class="card" style="cursor:pointer;" onclick="window.open('https://age-of-apes.adam-harris.alphaclaw.app','_blank','noopener')">
      <div class="card-top"><div class="card-title">🦍 Age of Apes Guide</div></div>
      <div class="card-desc">Game databases, calculators, and strategy guides</div>
      <div class="card-meta">
        <span class="badge" style="background:var(--orange);color:#000;">7 Calculators</span>
        <span class="badge" style="background:var(--green);color:#000;">Database</span>
      </div>
    </div>`;
  }
}
customElements.define('age-of-apes-summary', AgeOfApesSummary);
