class AssignmentCountdown extends HTMLElement {
  constructor() {
    super();
    this.intervalId = null;
    this.units = ['days', 'hours', 'minutes', 'seconds'];
    this.onSectionLoad = this.onSectionLoad.bind(this);
    this.onSectionUnload = this.onSectionUnload.bind(this);
  }

  connectedCallback() {
    document.addEventListener('shopify:section:load', this.onSectionLoad);
    document.addEventListener('shopify:section:unload', this.onSectionUnload);
    this.start();
  }

  disconnectedCallback() {
    document.removeEventListener('shopify:section:load', this.onSectionLoad);
    document.removeEventListener('shopify:section:unload', this.onSectionUnload);
    this.stop();
  }

  onSectionLoad(event) {
    if (event.target.contains(this)) {
      this.start();
    }
  }

  onSectionUnload(event) {
    if (event.target.contains(this)) {
      this.stop();
    }
  }

  start() {
    this.stop();
    this.expiredMessage = this.dataset.expiredMessage || 'Drop is live';
    const target = this.parseTarget(this.dataset.target);

    if (!target) {
      this.showExpired();
      return;
    }

    this.tick(target);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.intervalId = window.setInterval(() => this.tick(target), 1000);
  }

  stop() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  parseTarget(value) {
    if (!value || !value.trim()) return null;
    const timestamp = Date.parse(value.trim());
    if (Number.isNaN(timestamp)) return null;
    return timestamp;
  }

  tick(target) {
    const remaining = target - Date.now();

    if (remaining <= 0) {
      this.showExpired();
      this.stop();
      return;
    }

    const parts = this.getParts(remaining);

    this.units.forEach((unit) => {
      const value = Math.min(parts[unit], 99);
      const padded = String(value).padStart(2, '0');
      const tens = this.querySelector(`[data-digit="${unit}-tens"]`);
      const ones = this.querySelector(`[data-digit="${unit}-ones"]`);
      const live = this.querySelector(`[data-live="${unit}"]`);

      if (tens) tens.textContent = padded.charAt(0);
      if (ones) ones.textContent = padded.charAt(1);
      if (live) live.textContent = `${parts[unit]} ${unit}`;
    });

    this.classList.remove('is-expired');
    const expired = this.querySelector('.assignment-countdown__expired');
    if (expired) expired.hidden = true;
    const grid = this.querySelector('.assignment-countdown__grid');
    if (grid) grid.hidden = false;
  }

  getParts(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds -= days * 86400;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds -= hours * 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds - minutes * 60;

    return { days, hours, minutes, seconds };
  }

  showExpired() {
    this.classList.add('is-expired');
    const grid = this.querySelector('.assignment-countdown__grid');
    if (grid) grid.hidden = true;

    const expired = this.querySelector('.assignment-countdown__expired');
    if (expired) {
      expired.textContent = this.expiredMessage;
      expired.hidden = false;
    }
  }
}

if (!customElements.get('assignment-countdown')) {
  customElements.define('assignment-countdown', AssignmentCountdown);
}
