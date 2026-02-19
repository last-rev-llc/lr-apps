class SlangTranslatorSummary extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<div class="card" style="text-align:center;padding:20px;">
      <div style="font-size:2rem;font-weight:900;background:linear-gradient(135deg,#8b5cf6,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Slang Translator</div>
      <p style="color:var(--muted);font-size:13px;margin:8px 0;">Gen Alpha ↔ Gen X — The Rosetta Stone for generational slang</p>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:12px;">
        <span class="st-gen-badge st-gen-alpha" style="display:inline-block;font-size:10px;padding:3px 10px;border-radius:8px;font-weight:700;background:rgba(139,92,246,.15);color:#a78bfa;">Gen Alpha</span>
        <span style="color:var(--muted);">↔</span>
        <span class="st-gen-badge st-gen-x" style="display:inline-block;font-size:10px;padding:3px 10px;border-radius:8px;font-weight:700;background:rgba(245,158,11,.15);color:#fbbf24;">Gen X</span>
      </div>
    </div>`;
  }
}
customElements.define('slang-translator-summary', SlangTranslatorSummary);
