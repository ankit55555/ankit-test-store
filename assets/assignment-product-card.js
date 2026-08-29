class AssignmentProductCard extends HTMLElement {
  constructor() {
    super();
    this.isAdding = false;
    this.onSwatchClick = this.onSwatchClick.bind(this);
    this.onQuickAddClick = this.onQuickAddClick.bind(this);
  }

  connectedCallback() {
    this.variantInput = this.querySelector('[data-variant-input]');
    this.quickAddButton = this.querySelector('[data-quick-add]');
    this.errorEl = this.querySelector('[data-quick-add-error]');
    this.colorOptionPosition = parseInt(this.dataset.colorOptionPosition || '0', 10);
    this.variants = this.parseVariants();

    this.querySelectorAll('[data-swatch]').forEach((button) => {
      button.addEventListener('click', this.onSwatchClick);
    });

    if (this.quickAddButton) {
      this.quickAddButton.addEventListener('click', this.onQuickAddClick);
    }
  }

  disconnectedCallback() {
    this.querySelectorAll('[data-swatch]').forEach((button) => {
      button.removeEventListener('click', this.onSwatchClick);
    });

    if (this.quickAddButton) {
      this.quickAddButton.removeEventListener('click', this.onQuickAddClick);
    }
  }

  parseVariants() {
    const node = this.querySelector('[data-variant-json]');
    if (!node) return [];

    try {
      return JSON.parse(node.textContent);
    } catch (error) {
      return [];
    }
  }

  onSwatchClick(event) {
    const button = event.currentTarget;
    const value = button.dataset.value;
    if (!value) return;

    const variant = this.findVariantForColor(value);
    if (!variant) return;

    this.querySelectorAll('[data-swatch]').forEach((swatch) => {
      const isSelected = swatch === button;
      swatch.classList.toggle('is-selected', isSelected);
      swatch.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });

    this.applyVariant(variant, button);
  }

  findVariantForColor(colorValue) {
    const key = `option${this.colorOptionPosition}`;
    const matches = this.variants.filter((variant) => variant[key] === colorValue);
    return matches.find((variant) => variant.available) || matches[0] || null;
  }

  applyVariant(variant, swatchButton) {
    if (this.variantInput) {
      this.variantInput.value = variant.id;
    }

    this.querySelectorAll('[data-card-link]').forEach((link) => {
      link.href = variant.url;
    });

    const image = this.querySelector('[data-card-image]');
    if (image) {
      const mediaSrc = swatchButton?.dataset.mediaSrc || variant.featured_media?.src;
      const mediaSrcset = swatchButton?.dataset.mediaSrcset;
      const mediaAlt = swatchButton?.dataset.mediaAlt || variant.featured_media?.alt;

      if (mediaSrc) image.src = mediaSrc;
      if (mediaSrcset) image.srcset = mediaSrcset;
      if (mediaAlt) image.alt = mediaAlt;
    }

    const formattedPrice = swatchButton?.dataset.variantPriceFormatted;
    const formattedCompare = swatchButton?.dataset.variantCompareFormatted;
    this.updatePrice(
      variant.price,
      variant.compare_at_price,
      formattedPrice,
      formattedCompare
    );

    if (this.quickAddButton) {
      this.quickAddButton.disabled = !variant.available;
    }
  }

  updatePrice(priceCents, compareAtCents, formattedPrice, formattedCompare) {
    const current = this.querySelector('[data-price-current]');
    const compare = this.querySelector('[data-price-compare]');

    if (current) {
      current.textContent = formattedPrice || this.formatMoney(priceCents);
    }

    if (compare) {
      if (compareAtCents && compareAtCents > priceCents) {
        compare.textContent = formattedCompare || this.formatMoney(compareAtCents);
        compare.classList.remove('hidden');
      } else {
        compare.textContent = '';
        compare.classList.add('hidden');
      }
    }
  }

  formatMoney(cents) {
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      return window.Shopify.formatMoney(cents);
    }

    return (cents / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'USD',
    });
  }

  onQuickAddClick() {
    if (this.isAdding || !this.variantInput?.value) return;

    this.isAdding = true;
    this.clearError();
    this.quickAddButton.classList.add('loading');
    this.quickAddButton.disabled = true;

    const variantId = this.variantInput.value;
    const config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];

    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', 1);

    const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
    if (cart) {
      formData.append(
        'sections',
        cart.getSectionsToRender().map((section) => section.id)
      );
      formData.append('sections_url', window.location.pathname);
      cart.setActiveElement(document.activeElement);
    }

    config.body = formData;

    fetch(`${window.routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          this.showError(response.description || response.message || 'Could not add to cart.');
          publish(PUB_SUB_EVENTS.cartError, {
            source: 'assignment-product-card',
            productVariantId: variantId,
            errors: response.errors || response.description,
            message: response.message,
          });
          return;
        }

        if (!cart) {
          window.location = window.routes.cart_url;
          return;
        }

        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'assignment-product-card',
          productVariantId: variantId,
          cartData: response,
        }).then(() => {
          cart.renderContents(response);
        });
      })
      .catch(() => {
        this.showError('Could not add to cart. Please try again.');
      })
      .finally(() => {
        this.isAdding = false;
        this.quickAddButton.classList.remove('loading');

        const variant = this.variants.find((item) => String(item.id) === String(variantId));
        this.quickAddButton.disabled = !(variant && variant.available);
      });
  }

  showError(message) {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.classList.remove('hidden');
  }

  clearError() {
    if (!this.errorEl) return;
    this.errorEl.textContent = '';
    this.errorEl.classList.add('hidden');
  }
}

if (!customElements.get('assignment-product-card')) {
  customElements.define('assignment-product-card', AssignmentProductCard);
}
