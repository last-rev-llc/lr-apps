/**
 * TQAvatar - User avatar with initials fallback
 * 
 * @element tq-avatar
 * @attr {string} name - User name (for initials)
 * @attr {string} role - User role
 * @attr {string} size - sm|md|lg|xl
 * @attr {string} src - Image URL
 */
export class TQAvatar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['name', 'role', 'size', 'src'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
    }
  }

  getInitials(name) {
    if (!name) return '?';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getColorFromName(name) {
    if (!name) return 'var(--gray-400, #9ca3af)';
    
    const colors = [
      'var(--trinity-blue, #2c5f8d)',
      'var(--trinity-light-blue, #4a90c8)',
      'var(--trinity-accent, #6ab0dd)',
      'var(--info, #3b82f6)',
      'var(--success, #10b981)',
      'var(--warning, #f59e0b)',
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  render() {
    const name = this.getAttribute('name') || '';
    const role = this.getAttribute('role') || '';
    const size = this.getAttribute('size') || 'md';
    const src = this.getAttribute('src');

    const sizes = {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem',
      xl: '4rem'
    };

    const fontSizes = {
      sm: '0.75rem',
      md: '0.875rem',
      lg: '1rem',
      xl: '1.25rem'
    };

    const initials = this.getInitials(name);
    const bgColor = this.getColorFromName(name);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
        }

        .avatar {
          width: ${sizes[size]};
          height: ${sizes[size]};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: ${fontSizes[size]};
          background: ${bgColor};
          color: white;
          font-family: var(--font-sans, sans-serif);
          flex-shrink: 0;
          overflow: hidden;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--gray-900, #111827);
          line-height: 1.2;
        }

        .role {
          font-size: 0.75rem;
          color: var(--gray-600, #4b5563);
          line-height: 1.2;
        }

        .info:empty {
          display: none;
        }
      </style>
      <div class="avatar">
        ${src ? `<img src="${src}" alt="${name}" />` : initials}
      </div>
      ${name || role ? `
        <div class="info">
          ${name ? `<div class="name">${name}</div>` : ''}
          ${role ? `<div class="role">${role}</div>` : ''}
        </div>
      ` : ''}
    `;
  }
}

customElements.define('tq-avatar', TQAvatar);
