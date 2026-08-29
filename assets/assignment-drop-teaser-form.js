class AssignmentDropTeaserForm extends HTMLElement {
  constructor() {
    super();
    this.onSubmit = this.onSubmit.bind(this);
  }

  connectedCallback() {
    this.form = this.querySelector('form');
    this.submitButton = this.querySelector('[type="submit"]');

    if (this.form) {
      this.form.addEventListener('submit', this.onSubmit);
    }
  }

  disconnectedCallback() {
    if (this.form) {
      this.form.removeEventListener('submit', this.onSubmit);
    }
  }

  onSubmit() {
    if (!this.submitButton || this.submitButton.disabled) return;

    this.submitButton.disabled = true;
    this.submitButton.setAttribute('aria-busy', 'true');

    window.setTimeout(() => {
      if (this.submitButton) {
        this.submitButton.disabled = false;
        this.submitButton.removeAttribute('aria-busy');
      }
    }, 4000);
  }
}

if (!customElements.get('assignment-drop-teaser-form')) {
  customElements.define('assignment-drop-teaser-form', AssignmentDropTeaserForm);
}
