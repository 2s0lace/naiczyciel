(function initEduLanding() {
  const hero = document.querySelector('[data-edu-hero]');
  if (!hero) return;

  const stepButtons = Array.from(hero.querySelectorAll('.edu-step-card[data-step]'));
  const scrollTrigger = document.querySelector('[data-scroll-to]');

  function setActiveStep(stepValue) {
    const target = String(stepValue || '1');
    hero.dataset.activeStep = target;

    stepButtons.forEach((button) => {
      const isActive = button.dataset.step === target;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  stepButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveStep(button.dataset.step));
  });

  if (scrollTrigger) {
    scrollTrigger.addEventListener('click', () => {
      const selector = scrollTrigger.getAttribute('data-scroll-to');
      const target = selector ? document.querySelector(selector) : null;
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  setActiveStep(hero.dataset.activeStep || '1');
})();
