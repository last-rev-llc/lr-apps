/* ── Pricing Component ─────────────────────────────────────
   Displays pricing plans and handles Stripe checkout.
   
   Usage:
     <cc-pricing app="my-app"></cc-pricing>
   
   Plans are loaded from the app_configs table or can be set inline:
     <cc-pricing plans='[{"id":"free","name":"Free","price":0,"features":["5 items","Basic support"]},{"id":"pro","name":"Pro","price":9.99,"interval":"month","features":["Unlimited items","Priority support"],"stripe_price_id":"price_xxx","highlight":true}]'></cc-pricing>
   
   Attributes:
     app        — App ID to load config from Supabase
     plans      — JSON string of plan objects (overrides Supabase)
     checkout-url — Server endpoint for creating Stripe checkout sessions
*/

class CcPricing extends HTMLElement {
  connectedCallback() {
    this._appId = this.getAttribute('app') || window.sbAuth?.appId || 'default';
    this._checkoutUrl = this.getAttribute('checkout-url') || '';
    this._plans = [];
    this._currentPlan = 'free';
    this._loading = true;
    
    this._render();
    this._loadPlans();
  }

  async _loadPlans() {
    // Try inline plans first
    const inlinePlans = this.getAttribute('plans');
    if (inlinePlans) {
      try {
        this._plans = JSON.parse(inlinePlans);
        this._loading = false;
        await this._loadCurrentPlan();
        this._render();
        return;
      } catch (e) { /* fall through to Supabase */ }
    }

    // Load from app_configs
    try {
      if (window.supabase) {
        const configs = await window.supabase.select('app_configs', {
          filters: { app_id: `eq.${this._appId}` },
          limit: 1
        });
        if (configs[0]?.plans) {
          this._plans = configs[0].plans;
        }
      }
    } catch (e) {
      console.warn('Failed to load app config:', e);
    }

    // Default plans if none loaded
    if (this._plans.length === 0) {
      this._plans = [
        { id: 'free', name: 'Free', price: 0, features: ['Basic features', 'Community support'] },
        { id: 'pro', name: 'Pro', price: 9.99, interval: 'month', features: ['All features', 'Priority support', 'API access'], highlight: true },
        { id: 'enterprise', name: 'Enterprise', price: null, features: ['Custom integrations', 'Dedicated support', 'SLA guarantee'], cta: 'Contact Us' }
      ];
    }

    this._loading = false;
    await this._loadCurrentPlan();
    this._render();
  }

  async _loadCurrentPlan() {
    if (window.sbAuth?.isAuthenticated()) {
      try {
        const sub = await window.sbAuth.getSubscription();
        if (sub) this._currentPlan = sub.plan;
      } catch (e) { /* stay on free */ }
    }
  }

  _render() {
    if (this._loading) {
      this.innerHTML = `<div class="pr-loading">Loading plans...</div>`;
      return;
    }

    const annual = false; // TODO: add toggle
    
    this.innerHTML = `
      <div class="pr-container">
        <div class="pr-header">
          <h2 class="pr-title">Choose Your Plan</h2>
          <p class="pr-subtitle">Start free, upgrade when you're ready</p>
        </div>
        <div class="pr-grid">
          ${this._plans.map(plan => this._planCardHTML(plan)).join('')}
        </div>
      </div>`;

    // Bind checkout buttons
    this.querySelectorAll('[data-plan-id]').forEach(btn => {
      btn.onclick = () => this._handlePlanSelect(btn.dataset.planId);
    });
  }

  _planCardHTML(plan) {
    const isCurrent = plan.id === this._currentPlan;
    const priceHTML = plan.price === null
      ? '<span class="pr-price-custom">Custom</span>'
      : plan.price === 0
        ? '<span class="pr-price-amount">$0</span><span class="pr-price-period">forever</span>'
        : `<span class="pr-price-amount">$${plan.price}</span><span class="pr-price-period">/${plan.interval || 'month'}</span>`;
    
    const ctaText = isCurrent ? 'Current Plan' : (plan.cta || (plan.price === 0 ? 'Get Started' : 'Subscribe'));
    
    return `
      <div class="pr-card ${plan.highlight ? 'pr-highlight' : ''} ${isCurrent ? 'pr-current' : ''}">
        ${plan.highlight ? '<div class="pr-badge">Most Popular</div>' : ''}
        <h3 class="pr-plan-name">${plan.name}</h3>
        <div class="pr-price">${priceHTML}</div>
        <ul class="pr-features">
          ${(plan.features || []).map(f => `
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ${f}
            </li>`).join('')}
        </ul>
        <button class="pr-cta ${plan.highlight ? 'pr-cta-primary' : ''}" 
                data-plan-id="${plan.id}" ${isCurrent ? 'disabled' : ''}>
          ${ctaText}
        </button>
      </div>`;
  }

  async _handlePlanSelect(planId) {
    const plan = this._plans.find(p => p.id === planId);
    if (!plan) return;

    // Free plan — just sign up
    if (plan.price === 0) {
      if (!window.sbAuth?.isAuthenticated()) {
        // Trigger sign up
        document.querySelector('cc-user-auth')?._showModal('signup');
      }
      return;
    }

    // Contact plan
    if (plan.price === null) {
      this.dispatchEvent(new CustomEvent('contact-sales', { bubbles: true, detail: { plan } }));
      return;
    }

    // Paid plan — need auth first
    if (!window.sbAuth?.isAuthenticated()) {
      document.querySelector('cc-user-auth')?._showModal('signup');
      return;
    }

    // Create Stripe checkout session
    if (!plan.stripe_price_id) {
      console.warn('No Stripe price ID configured for plan:', planId);
      this._showToast('Stripe not configured for this plan yet', 'error');
      return;
    }

    if (!this._checkoutUrl) {
      console.warn('No checkout URL configured');
      this._showToast('Checkout not configured yet', 'error');
      return;
    }

    try {
      const btn = this.querySelector(`[data-plan-id="${planId}"]`);
      btn.disabled = true;
      btn.textContent = 'Redirecting...';

      const session = window.sbAuth.getSession();
      const res = await fetch(this._checkoutUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          price_id: plan.stripe_price_id,
          app_id: this._appId,
          success_url: window.location.origin + window.location.pathname + '?checkout=success',
          cancel_url: window.location.origin + window.location.pathname + '?checkout=cancel'
        })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (e) {
      this._showToast(e.message, 'error');
      const btn = this.querySelector(`[data-plan-id="${planId}"]`);
      if (btn) { btn.disabled = false; btn.textContent = plan.cta || 'Subscribe'; }
    }
  }

  _showToast(message, type = 'info') {
    const toast = document.querySelector('cc-toast');
    if (toast?.show) toast.show(message, type);
    else console.warn(message);
  }
}

customElements.define('cc-pricing', CcPricing);

/* ── Styles ── */
(function() {
  if (document.getElementById('cc-pricing-styles')) return;
  const style = document.createElement('style');
  style.id = 'cc-pricing-styles';
  style.textContent = `
    .pr-container { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; }
    .pr-header { text-align: center; margin-bottom: 2rem; }
    .pr-title { font-size: 28px; font-weight: 700; color: var(--text, #e0e0e0); margin: 0 0 8px; }
    .pr-subtitle { font-size: 16px; color: var(--text-muted, #888); margin: 0; }
    
    .pr-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem; align-items: start;
    }
    
    .pr-card {
      position: relative; background: var(--surface, #1a1a2e); border: 1px solid var(--border, #333);
      border-radius: 16px; padding: 2rem; display: flex; flex-direction: column;
      transition: transform .2s, border-color .2s;
    }
    .pr-card:hover { transform: translateY(-2px); }
    .pr-highlight { border-color: var(--accent, #f59e0b); }
    .pr-current { border-color: #22c55e; }
    
    .pr-badge {
      position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
      background: var(--accent, #f59e0b); color: #000; padding: 4px 16px;
      border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap;
    }
    
    .pr-plan-name { font-size: 18px; font-weight: 600; color: var(--text, #e0e0e0); margin: 0 0 12px; }
    .pr-price { margin-bottom: 20px; }
    .pr-price-amount { font-size: 36px; font-weight: 800; color: var(--text, #e0e0e0); }
    .pr-price-period { font-size: 14px; color: var(--text-muted, #888); margin-left: 4px; }
    .pr-price-custom { font-size: 24px; font-weight: 700; color: var(--text, #e0e0e0); }
    
    .pr-features { list-style: none; padding: 0; margin: 0 0 24px; flex: 1; }
    .pr-features li {
      display: flex; align-items: center; gap: 8px; padding: 6px 0;
      font-size: 14px; color: var(--text, #e0e0e0);
    }
    
    .pr-cta {
      width: 100%; padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border, #333);
      background: var(--surface, #1a1a2e); color: var(--text, #e0e0e0);
      font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s;
    }
    .pr-cta:hover { border-color: var(--accent, #f59e0b); }
    .pr-cta-primary { background: var(--accent, #f59e0b); color: #000; border-color: var(--accent, #f59e0b); }
    .pr-cta-primary:hover { opacity: .9; }
    .pr-cta:disabled { opacity: .5; cursor: not-allowed; }
    
    .pr-loading { text-align: center; padding: 2rem; color: var(--text-muted, #888); }
    
    @media (max-width: 768px) {
      .pr-grid { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
})();
