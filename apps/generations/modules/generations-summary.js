class GenerationsSummary extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:16px;">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#8b5cf6);display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <div>
          <div style="font-weight:600;font-size:.95rem;">Generations Quiz</div>
          <div style="color:var(--muted);font-size:.8rem;">What generation are you?</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;padding:0 16px 16px;flex-wrap:wrap;">
        <span style="padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:600;background:#6b728022;color:#6b7280">Silent</span>
        <span style="padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:600;background:#f59e0b22;color:#f59e0b">Boomer</span>
        <span style="padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:600;background:#8b5cf622;color:#8b5cf6">Gen X</span>
        <span style="padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:600;background:#3b82f622;color:#3b82f6">Millennial</span>
        <span style="padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:600;background:#10b98122;color:#10b981">Gen Z</span>
        <span style="padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:600;background:#ec489922;color:#ec4899">Gen Alpha</span>
      </div>`;
  }
}
customElements.define('generations-summary', GenerationsSummary);
