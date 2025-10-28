/**
 * Decorates the batch-search-container block.
 * @param {Element} block The block element
 */
 export default async function decorate(block) {
  const input = block.querySelector('input');
  const button = block.querySelector('button');
  const items = [...block.querySelectorAll(':scope .result-item')];

  if (!input || !button || items.length === 0) {
    console.warn('Batch search block missing required elements');
    return;
  }

  // Add A11y attributes
  input.setAttribute('aria-label', 'Search items');
  button.setAttribute('aria-label', 'Search');
  input.setAttribute('type', 'search');

  // No results element (create if not present)
  let noResults = block.querySelector('.no-results');
  if (!noResults) {
    noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.textContent = 'No results found.';
    noResults.style.display = 'none';
    block.appendChild(noResults);
  }

  // Search function
  const performSearch = () => {
    const query = input.value.trim().toLowerCase();
    let matchCount = 0;

    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      if (text.includes(query)) {
        item.style.display = 'block';
        matchCount++;
      } else {
        item.style.display = 'none';
      }
    });

    noResults.style.display = matchCount === 0 ? 'block' : 'none';
  };

  // Live search on input
  input.addEventListener('input', performSearch);

  // Button click
  button.addEventListener('click', (e) => {
    e.preventDefault();
    performSearch();
    input.focus(); // A11y: Keep focus on input
  });

  // Keyboard support for button (Enter on input)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      button.click();
    }
  });

  // Initial hide no-results
  noResults.style.display = 'none';

  block.dataset.blockStatus = 'loaded';
}