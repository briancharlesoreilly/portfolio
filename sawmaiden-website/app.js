(() => {
  'use strict';
  const cards = Array.from(document.querySelectorAll('.concept'));
  const filters = document.querySelector('.filters');
  const count = document.getElementById('concept-count');
  const dialog = document.querySelector('.viewer');
  const title = document.getElementById('viewer-title');
  const image = document.getElementById('viewer-image');
  const description = document.getElementById('viewer-description');
  const position = document.getElementById('viewer-position');
  const previous = document.getElementById('previous-concept');
  const next = document.getElementById('next-concept');
  const fullImage = document.getElementById('full-image-link');
  let activeCard = null;
  let opener = null;
  const visibleCards = () => cards.filter(card => !card.hidden);

  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    cards.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.group !== button.dataset.filter; });
    const group = button.dataset.filter === 'all' ? '' : button.dataset.filter === 'original' ? ' · original direction' : ' · subtle refinements';
    count.textContent = `${visibleCards().length} concepts${group}`;
  });
  filters.hidden = false;

  // Links keep working in browsers without native dialog support.
  if (!dialog || typeof dialog.showModal !== 'function') return;

  function showCard(card) {
    activeCard = card;
    const source = card.querySelector('img');
    const link = card.querySelector('[data-open-concept]');
    const heading = card.querySelector('h3').textContent;
    const group = card.dataset.group === 'original' ? 'Original direction' : 'Subtle refinement';
    document.getElementById('viewer-group').textContent = `Concept ${card.dataset.number} / ${group}`;
    title.textContent = heading;
    image.src = source.getAttribute('src');
    image.alt = source.alt;
    description.textContent = card.querySelector('.concept-description').textContent;
    fullImage.href = link.getAttribute('href');
    fullImage.setAttribute('aria-label', `Open ${heading} full-size image for zooming`);
    const visible = visibleCards();
    const index = visible.indexOf(card);
    previous.disabled = index === 0;
    next.disabled = index === visible.length - 1;
    position.textContent = `${index + 1} of ${visible.length}`;
    document.getElementById('viewer-announcement').textContent = `${heading}, ${index + 1} of ${visible.length}`;
    if (document.activeElement === previous && previous.disabled) next.focus();
    else if (document.activeElement === next && next.disabled) previous.focus();
  }

  document.querySelector('.concept-grid').addEventListener('click', event => {
    const link = event.target.closest('[data-open-concept]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    showCard(link.closest('.concept'));
    document.documentElement.classList.add('has-dialog');
    dialog.showModal();
  });

  const move = delta => {
    const visible = visibleCards();
    const target = visible[visible.indexOf(activeCard) + delta];
    if (target) showCard(target);
  };
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  document.getElementById('close-viewer').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('has-dialog');
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  });
})();
