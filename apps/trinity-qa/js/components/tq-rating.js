/**
 * TQRating - Star rating component
 * 
 * @element tq-rating
 * @attr {number} value - Rating value (1-5)
 * @attr {boolean} editable - Allow editing
 * @attr {string} size - sm|md|lg
 * @fires tq-change - Fired when rating changes
 */
export class TQRating extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hoverValue = 0;
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-rating');
    this.render();
    this.setupEventHandlers();
  }

  static get observedAttributes() {
    return ['value', 'editable', 'size'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
      this.setupEventHandlers();
    }
  }

  get value() {
    return parseFloat(this.getAttribute('value')) || 0;
  }

  set value(val) {
    this.setAttribute('value', val);
  }

  setupEventHandlers() {
    const editable = this.hasAttribute('editable');
    if (!editable) return;

    const stars = this.shadowRoot.querySelectorAll('.star');
    stars.forEach((star, index) => {
      const rating = index + 1;

      star.addEventListener('mouseenter', () => {
        this._hoverValue = rating;
        this.updateStars();
      });

      star.addEventListener('mouseleave', () => {
        this._hoverValue = 0;
        this.updateStars();
      });

      star.addEventListener('click', () => {
        this.value = rating;
        this.dispatchEvent(new CustomEvent('tq-change', {
          detail: { value: rating },
          bubbles: true,
          composed: true
        }));
      });
    });

    const container = this.shadowRoot.querySelector('.rating-container');
    container.addEventListener('mouseleave', () => {
      this._hoverValue = 0;
      this.updateStars();
    });
  }

  updateStars() {
    const stars = this.shadowRoot.querySelectorAll('.star');
    const displayValue = this._hoverValue || this.value;

    stars.forEach((star, index) => {
      const rating = index + 1;
      if (rating <= displayValue) {
        star.classList.add('filled');
      } else {
        star.classList.remove('filled');
      }
    });
  }

  render() {
    const value = this.value;
    const editable = this.hasAttribute('editable');
    const size = this.getAttribute('size') || 'md';

    const sizes = {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem'
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        .rating-container {
          display: flex;
          gap: 0.25rem;
          align-items: center;
        }

        .star {
          font-size: ${sizes[size]};
          color: var(--gray-300, #d1d5db);
          transition: color 0.2s ease, transform 0.1s ease;
          cursor: ${editable ? 'pointer' : 'default'};
          user-select: none;
        }

        .star.filled {
          color: var(--trinity-gold, #d4af37);
        }

        .star:hover {
          transform: ${editable ? 'scale(1.1)' : 'none'};
        }

        .value-label {
          margin-left: 0.5rem;
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
          font-family: var(--font-sans, sans-serif);
        }
      </style>
      <div class="rating-container">
        ${[1, 2, 3, 4, 5].map(i => `
          <span class="star ${i <= value ? 'filled' : ''}" data-rating="${i}">★</span>
        `).join('')}
        ${value > 0 ? `<span class="value-label">${value.toFixed(1)}</span>` : ''}
      </div>
    `;

    this.setupEventHandlers();
  }
}

customElements.define('tq-rating', TQRating);
