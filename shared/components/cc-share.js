// ─── Share Buttons ─────────────────────────────────────
// <cc-share text="..." url="..." image-url="..." label="Share"></cc-share>
// Emits 'share' event with {platform, text, url}
// Supports: copy, twitter/x, facebook, reddit, native share API
class CcShare extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  static get observedAttributes() { return ['text', 'url', 'image-url']; }
  attributeChangedCallback() { if (this.isConnected) this.render(); }

  get _text() { return this.getAttribute('text') || ''; }
  get _url() { return this.getAttribute('url') || window.location.href; }
  get _imageUrl() { return this.getAttribute('image-url') || ''; }

  _share(platform) {
    const text = this._text;
    const url = this._url;
    const shareText = text;
    const encoded = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(url);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encoded}`,
      reddit: `https://www.reddit.com/submit?title=${encoded}&url=${encodedUrl}`,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        window.showToast?.('Copied to clipboard');
      });
      return;
    }

    if (platform === 'native' && navigator.share) {
      const shareData = { title: document.title, text: shareText, url };
      // Try sharing with image if available
      if (this._imageUrl && navigator.canShare) {
        this._shareWithImage(shareData);
      } else {
        navigator.share(shareData).catch(() => {});
      }
      return;
    }

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    } else {
      // Fallback
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        window.showToast?.('Copied to clipboard — paste it anywhere!');
      });
    }

    this.dispatchEvent(new CustomEvent('share', { detail: { platform, text, url } }));
  }

  async _shareWithImage(shareData) {
    try {
      const resp = await fetch(this._imageUrl);
      const blob = await resp.blob();
      const file = new File([blob], 'share-image.png', { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ ...shareData, files: [file] });
        return;
      }
    } catch (e) { /* fall through */ }
    navigator.share(shareData).catch(() => {});
  }

  async _download() {
    if (!this._imageUrl) return;
    try {
      const resp = await fetch(this._imageUrl);
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `share-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      window.showToast?.('Image saved!');
    } catch (e) {
      window.open(this._imageUrl, '_blank');
      window.showToast?.('Opened in new tab — right-click to save');
    }
  }

  render() {
    const hasImage = !!this._imageUrl;
    this.innerHTML = `
      <div class="cc-share-bar">
        <button class="cc-share-btn cc-share-copy" title="Copy to clipboard" data-platform="copy">
          <i data-lucide="copy"></i>
        </button>
        <button class="cc-share-btn cc-share-twitter" title="Share on X/Twitter" data-platform="twitter">
          <i data-lucide="twitter"></i>
        </button>
        <button class="cc-share-btn cc-share-facebook" title="Share on Facebook" data-platform="facebook">
          <i data-lucide="facebook"></i>
        </button>
        <button class="cc-share-btn cc-share-reddit" title="Share on Reddit" data-platform="reddit">
          <i data-lucide="message-square"></i>
        </button>
        ${hasImage ? `<button class="cc-share-btn cc-share-download" title="Download image" data-action="download">
          <i data-lucide="download"></i>
        </button>` : ''}
        <button class="cc-share-btn cc-share-native" title="Share via..." data-platform="native">
          <i data-lucide="share-2"></i>
        </button>
      </div>
    `;

    this.querySelectorAll('[data-platform]').forEach(btn => {
      btn.addEventListener('click', () => this._share(btn.dataset.platform));
    });
    this.querySelector('[data-action="download"]')?.addEventListener('click', () => this._download());

    window.refreshIcons?.();
  }
}
customElements.define('cc-share', CcShare);
