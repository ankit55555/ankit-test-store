if (!customElements.get('bds-configurator')) {
  const FRAME_ONLY = 2; // printing option index for "No fabric (frame only)"
  const WITH_FRAME = 0; // hardware option index for "With aluminum frame"
  const PRINT_ONLY = 1; // hardware option index for "Replacement print only (no frame)"
  const MAX_FILE_BYTES = 20 * 1024 * 1024;

  customElements.define(
    'bds-configurator',
    class BdsConfigurator extends HTMLElement {
      connectedCallback() {
        const data = JSON.parse(this.querySelector('[data-bds-data]').textContent);
        this.variants = data.variants;
        this.optionNames = data.options;
        this.moneyFormat = this.dataset.moneyFormat || '${{amount}}';

        this.form = this.querySelector('form[data-type="add-to-cart-form"]');
        this.variantInput = this.form.querySelector('[name="id"]');
        this.submitButton = this.form.querySelector('[type="submit"]');
        this.fileInput = this.querySelector('[data-bds-file]');
        this.designProperty = this.querySelector('[data-bds-design-property]');
        this.artworkStatus = this.querySelector('[data-bds-artwork-status]');
        this.qtyInput = this.querySelector('[data-bds-qty-input]');

        this.state = {
          size: this.checkedIndex('size'),
          print: this.checkedIndex('print'),
          frame: this.checkedIndex('frame'),
          artwork: this.querySelector('[data-bds-option="artwork"]:checked')?.value || 'upload',
        };

        this.addEventListener('change', this.onChange.bind(this));
        this.addEventListener('click', this.onClick.bind(this));
        this.qtyInput.addEventListener('input', () => this.renderTotal());
        this.form.addEventListener('submit', this.beforeAddToCart.bind(this), true);
        this.setupDropzone();
        this.setupLeadForms();

        this.render();
        this.openModalFromUrl();
      }

      checkedIndex(name) {
        const input = this.querySelector(`[data-bds-option="${name}"]:checked`);
        return input ? Number(input.value) : 0;
      }

      /* ---------- State ---------- */

      onChange(event) {
        const input = event.target;
        const option = input.dataset.bdsOption;
        if (!option) return;

        if (option === 'artwork') {
          this.state.artwork = input.value;
        } else {
          this.state[option] = Number(input.value);
          // Frame only ships with the frame, so "print only" can't be combined with it.
          if (option === 'print' && this.state.print === FRAME_ONLY) this.state.frame = WITH_FRAME;
        }
        this.render();
      }

      findVariant(size = this.state.size, print = this.state.print, frame = this.state.frame) {
        const wanted = [this.optionNames[0][size], this.optionNames[1][print], this.optionNames[2][frame]];
        return this.variants.find((v) => v.options.every((value, i) => value === wanted[i]));
      }

      get isFrameOnly() {
        return this.state.print === FRAME_ONLY;
      }

      /* ---------- Rendering ---------- */

      render() {
        const variant = this.findVariant();
        this.syncRadios();
        this.renderPrices();
        this.renderAvailability();
        this.renderArtwork();
        this.renderSummary(variant);
        this.renderTotal(variant);
        this.renderVariant(variant);
      }

      syncRadios() {
        ['size', 'print', 'frame'].forEach((name) => {
          this.querySelectorAll(`[data-bds-option="${name}"]`).forEach((input) => {
            input.checked = Number(input.value) === this.state[name];
          });
        });
      }

      renderPrices() {
        const { size, print, frame } = this.state;
        this.querySelectorAll('[data-bds-card-price]').forEach((el) => {
          const index = Number(el.dataset.index);
          let variant;
          if (el.dataset.bdsCardPrice === 'size') variant = this.findVariant(index, print, frame);
          if (el.dataset.bdsCardPrice === 'print') {
            variant = this.findVariant(size, index, index === FRAME_ONLY ? WITH_FRAME : frame);
          }
          if (el.dataset.bdsCardPrice === 'frame') variant = this.findVariant(size, print, index);
          el.textContent = variant ? this.formatMoney(variant.price) : '';
        });
      }

      renderAvailability() {
        const printOnly = this.querySelector(`[data-bds-option="frame"][value="${PRINT_ONLY}"]`);
        if (printOnly) {
          printOnly.disabled = this.isFrameOnly;
          printOnly.closest('.bds-card').classList.toggle('is-disabled', this.isFrameOnly);
        }
        this.querySelector('[data-bds-combo-note]').hidden = !this.isFrameOnly;
      }

      renderArtwork() {
        const frameOnly = this.isFrameOnly;
        this.querySelector('[data-bds-artwork-body]').hidden = frameOnly;
        this.querySelector('[data-bds-artwork-skip]').hidden = !frameOnly;
        this.querySelector('[data-bds-panel="upload"]').hidden = this.state.artwork !== 'upload';
        this.querySelector('[data-bds-panel="design"]').hidden = this.state.artwork !== 'design';
        this.designProperty.disabled = frameOnly || this.state.artwork !== 'design';
      }

      artworkLabel() {
        if (this.isFrameOnly) return 'Not needed';
        if (this.state.artwork === 'design') return 'Free 2D design review';
        return this.fileInput.files.length ? this.fileInput.files[0].name : 'I’ll send it after checkout';
      }

      renderSummary() {
        const sizeLabel = this.optionNames[0][this.state.size].replace(/ft/g, ' ft').replace(' x ', ' × ');
        const printLabel = this.labelFor('print');
        const frameLabel = this.isFrameOnly ? 'Aluminum frame included' : this.labelFor('frame');
        const artwork = this.artworkLabel();

        this.setText('[data-bds-value="size"]', sizeLabel);
        this.setText('[data-bds-value="build"]', this.isFrameOnly ? printLabel : `${printLabel} · ${frameLabel}`);
        this.setText('[data-bds-value="artwork"]', this.isFrameOnly ? 'Not needed' : this.state.artwork === 'design' ? 'Design help' : 'My artwork');
        this.setText('[data-bds-summary="size"]', sizeLabel);
        this.setText('[data-bds-summary="print"]', printLabel);
        this.setText('[data-bds-summary="frame"]', frameLabel);
        this.setText('[data-bds-summary="artwork"]', artwork);

        const selection = `${sizeLabel} / ${printLabel} / ${frameLabel}`;
        this.querySelectorAll('[data-bds-selection-field]').forEach((field) => (field.value = selection));
      }

      renderTotal(variant = this.findVariant()) {
        if (!variant) return;
        const qty = Math.max(1, parseInt(this.qtyInput.value, 10) || 1);
        this.setText('[data-bds-price]', this.formatMoney(variant.price));
        this.setText('[data-bds-total]', this.formatMoney(variant.price * qty));
      }

      renderVariant(variant) {
        const label = this.submitButton.querySelector('span');
        if (!variant) {
          this.submitButton.disabled = true;
          label.textContent = window.variantStrings.unavailable;
          return;
        }
        this.variantInput.value = variant.id;
        this.variantInput.disabled = false;
        this.submitButton.disabled = !variant.available;
        label.textContent = variant.available ? window.variantStrings.addToCart : window.variantStrings.soldOut;

        if (variant.mediaId) this.showMedia(String(variant.mediaId));

        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }

      labelFor(name) {
        const input = this.querySelector(`[data-bds-option="${name}"][value="${this.state[name]}"]`);
        return input ? input.dataset.label : '';
      }

      setText(selector, text) {
        this.querySelectorAll(selector).forEach((el) => (el.textContent = text));
      }

      /* ---------- Gallery ---------- */

      showMedia(mediaId) {
        const thumb = this.querySelector(`[data-bds-thumb][data-media-id="${mediaId}"]`);
        if (thumb) this.selectThumb(thumb);
      }

      selectThumb(thumb) {
        const main = this.querySelector('[data-bds-main-image]');
        if (!main) return;
        main.srcset = thumb.dataset.srcset;
        main.src = thumb.dataset.src;
        this.querySelectorAll('[data-bds-thumb]').forEach((t) => t.removeAttribute('aria-current'));
        thumb.setAttribute('aria-current', 'true');
      }

      /* ---------- Clicks: thumbs, quantity, modals ---------- */

      onClick(event) {
        const thumb = event.target.closest('[data-bds-thumb]');
        if (thumb) return this.selectThumb(thumb);

        const qtyButton = event.target.closest('[data-bds-qty]');
        if (qtyButton) {
          const next = (parseInt(this.qtyInput.value, 10) || 1) + Number(qtyButton.dataset.bdsQty);
          this.qtyInput.value = Math.max(1, next);
          return this.renderTotal();
        }

        const opener = event.target.closest('[data-bds-open]');
        if (opener) return this.openModal(opener.dataset.bdsOpen);

        const closer = event.target.closest('[data-bds-close]');
        if (closer) return closer.closest('dialog').close();

        // Click on the backdrop closes the dialog.
        if (event.target.matches('dialog.bds-modal')) event.target.close();
      }

      openModal(name) {
        const dialog = this.querySelector(`[data-bds-modal="${name}"]`);
        if (!dialog || dialog.open) return;
        dialog.showModal();
        dialog.querySelector('input:not([type="hidden"]), textarea')?.focus();
      }

      openModalFromUrl() {
        // After a non-JS (native) contact form post, reopen the modal that was submitted.
        const params = new URLSearchParams(window.location.search);
        if (!params.has('contact_posted') && !window.location.hash.startsWith('#BdsQuote') && !window.location.hash.startsWith('#BdsDesign')) return;
        const name = window.location.hash.startsWith('#BdsDesign') ? 'design' : 'quote';
        this.openModal(name);
      }

      /* ---------- Artwork upload ---------- */

      setupDropzone() {
        const drop = this.querySelector('[data-bds-drop]');
        const chip = this.querySelector('[data-bds-file-chip]');
        const error = this.querySelector('[data-bds-file-error]');

        const update = () => {
          const file = this.fileInput.files[0];
          error.hidden = true;
          if (file && file.size > MAX_FILE_BYTES) {
            error.textContent = 'That file is over 20 MB. Please add to cart and send it after checkout instead.';
            error.hidden = false;
            this.fileInput.value = '';
          }
          const hasFile = this.fileInput.files.length > 0;
          chip.hidden = !hasFile;
          drop.hidden = hasFile;
          if (hasFile) this.querySelector('[data-bds-file-name]').textContent = this.fileInput.files[0].name;
          this.renderSummary();
        };

        this.fileInput.addEventListener('change', update);
        this.querySelector('[data-bds-file-remove]').addEventListener('click', () => {
          this.fileInput.value = '';
          update();
        });

        ['dragenter', 'dragover'].forEach((type) =>
          drop.addEventListener(type, (event) => {
            event.preventDefault();
            drop.classList.add('is-dragging');
          })
        );
        ['dragleave', 'drop'].forEach((type) =>
          drop.addEventListener(type, () => drop.classList.remove('is-dragging'))
        );
        drop.addEventListener('drop', (event) => {
          event.preventDefault();
          if (!event.dataTransfer.files.length) return;
          this.fileInput.files = event.dataTransfer.files;
          update();
        });
      }

      // Runs in the capture phase, before Dawn's product-form builds its FormData.
      beforeAddToCart() {
        const uploading = !this.isFrameOnly && this.state.artwork === 'upload';
        const hasFile = this.fileInput.files.length > 0;
        this.fileInput.disabled = !(uploading && hasFile);
        this.artworkStatus.disabled = !(uploading && !hasFile);
        setTimeout(() => {
          this.fileInput.disabled = false;
          this.artworkStatus.disabled = true;
        });
      }

      /* ---------- Lead forms ---------- */

      setupLeadForms() {
        this.querySelectorAll('[data-bds-lead-form]').forEach((form) => {
          form.addEventListener('submit', (event) => this.submitLeadForm(event, form));
        });
      }

      async submitLeadForm(event, form) {
        if (!form.checkValidity()) {
          event.preventDefault();
          form.reportValidity();
          return;
        }
        event.preventDefault();

        const button = form.querySelector('[type="submit"]');
        const error = form.querySelector('[data-bds-form-error]');
        button.disabled = true;
        error.hidden = true;

        try {
          const response = await fetch(form.action, { method: 'POST', body: new FormData(form) });
          // Shopify may require a captcha challenge; fall back to a native submit so it can be shown.
          if (response.url.includes('/challenge')) return form.submit();
          if (!response.ok || !response.url.includes('contact_posted=true')) throw new Error('not posted');

          form.querySelector('[data-bds-form-body]').hidden = true;
          form.querySelector('[data-bds-form-success]').hidden = false;
          form.reset();
        } catch (e) {
          error.textContent = 'Something went wrong. Please try again, or email us and we’ll help right away.';
          error.hidden = false;
        } finally {
          button.disabled = false;
        }
      }

      /* ---------- Money ---------- */

      formatMoney(cents) {
        const format = (value, decimals, thousands = ',', decimal = '.') => {
          const [whole, fraction] = (value / 100).toFixed(decimals).split('.');
          return whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (fraction ? decimal + fraction : '');
        };
        return this.moneyFormat.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
          switch (key) {
            case 'amount_no_decimals':
              return format(cents, 0);
            case 'amount_with_comma_separator':
              return format(cents, 2, '.', ',');
            case 'amount_no_decimals_with_comma_separator':
              return format(cents, 0, '.', ',');
            case 'amount_with_apostrophe_separator':
              return format(cents, 2, "'", '.');
            default:
              return format(cents, 2);
          }
        });
      }
    }
  );
}
