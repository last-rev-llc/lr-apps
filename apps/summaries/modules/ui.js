// UI module - rendering and DOM management
// Handles card creation, display, and interactions

const UI = (() => {
  // Create a summary card HTML
  function createSummaryCard(item) {
    const title = Summaries.getTitle(item);
    const shortSummary = Summaries.getShortSummary(item);
    const pills = Summaries.getPills(item);
    const date = Summaries.formatDate(item.created_at);

    const pillsHtml = pills.map(p => `<span class="pill ${p.className}">${p.text}</span>`).join('');

    const card = document.createElement('div');
    card.className = 'summary-card';
    card.innerHTML = `
      <div class="summary-header">
        <h3 class="summary-title">${escapeHtml(title)}</h3>
      </div>
      <div class="summary-meta">
        ${pillsHtml}
        <span style="margin-left: auto; white-space: nowrap;">${date}</span>
      </div>
      <p class="summary-text">${escapeHtml(shortSummary)}</p>
      <div class="summary-expanded" style="display: none;">
        ${renderExpandedContent(item)}
      </div>
    `;

    // Toggle expanded view
    card.addEventListener('click', () => {
      const expanded = card.querySelector('.summary-expanded');
      const isHidden = expanded.style.display === 'none';
      expanded.style.display = isHidden ? 'block' : 'none';
    });

    return card;
  }

  // Render expanded content
  function renderExpandedContent(item) {
    const longSummary = Summaries.getLongSummary(item);
    const details = Summaries.getDetails(item);

    let html = `<div class="expanded-section">
      <div class="expanded-section-title">Full Summary</div>
      <p style="margin: 0; line-height: 1.5; color: var(--color-text);">${escapeHtml(longSummary)}</p>
    </div>`;

    if (details.items1 && details.items1.length > 0) {
      const items = Array.isArray(details.items1) ? details.items1 : [details.items1];
      const itemsHtml = items.map(i => `<li>${escapeHtml(String(i))}</li>`).join('');
      html += `<div class="expanded-section">
        <div class="expanded-section-title">${escapeHtml(details.label1)}</div>
        <ul class="expanded-items">${itemsHtml}</ul>
      </div>`;
    }

    if (details.items2 && details.items2.length > 0) {
      const items = Array.isArray(details.items2) ? details.items2 : [details.items2];
      const itemsHtml = items.map(i => `<li>${escapeHtml(String(i))}</li>`).join('');
      html += `<div class="expanded-section">
        <div class="expanded-section-title">${escapeHtml(details.label2)}</div>
        <ul class="expanded-items">${itemsHtml}</ul>
      </div>`;
    }

    return html;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  // Render grouped summaries
  function renderGrouped(container, groupedData) {
    container.innerHTML = '';

    if (!groupedData || groupedData.length === 0) {
      container.innerHTML = '<cc-empty-state message="No summaries found" description="Try adjusting your filters"></cc-empty-state>';
      return;
    }

    groupedData.forEach(group => {
      // Day header
      const header = document.createElement('div');
      header.className = 'day-header';
      header.textContent = group.label;
      container.appendChild(header);

      // Cards for this day
      group.summaries.forEach(item => {
        const card = createSummaryCard(item);
        container.appendChild(card);
      });
    });
  }

  // Render flat list
  function renderFlat(container, summaries) {
    container.innerHTML = '';

    if (!summaries || summaries.length === 0) {
      container.innerHTML = '<cc-empty-state message="No summaries found" description="Try adjusting your filters"></cc-empty-state>';
      return;
    }

    summaries.forEach(item => {
      const card = createSummaryCard(item);
      container.appendChild(card);
    });
  }

  // Show loading state
  function showLoading(container) {
    container.innerHTML = '<div class="loading">Loading summaries...</div>';
  }

  // Show error state
  function showError(container, message) {
    container.innerHTML = `<cc-empty-state message="Error loading summaries" description="${escapeHtml(message)}"></cc-empty-state>`;
  }

  return {
    createSummaryCard,
    renderGrouped,
    renderFlat,
    showLoading,
    showError,
    escapeHtml
  };
})();

window.UI = UI;
