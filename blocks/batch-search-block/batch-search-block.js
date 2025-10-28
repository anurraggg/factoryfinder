/**
 * Decorates the batch-search-container block.
 * @param {Element} block The block element
 */
 export default async function decorate(block) {
  // Parse rows as divs (AEM table structure)
  const rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length < 1) {
    console.warn('Batch search block has no content');
    return;
  }

  // Build search UI if not present
  let input = block.querySelector('input');
  let button = block.querySelector('button');
  if (!input) {
    input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Search items...';
    input.setAttribute('aria-label', 'Search items');
    block.insertBefore(input, block.firstChild);
  }
  if (!button) {
    button = document.createElement('button');
    button.textContent = 'Search';
    button.setAttribute('aria-label', 'Search');
    block.insertBefore(button, input.nextSibling);
  }

  // Parse items from rows (skip header if present; use textContent as item)
  const items = [];
  for (let i = 1; i < rows.length; i += 1) { // Skip row 0 (header)
    const cols = [...rows[i].querySelectorAll(':scope > div')];
    if (cols.length > 0) {
      const itemText = cols[0]?.textContent.trim() || ''; // Assume col 0 is item name
      if (itemText) {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.textContent = itemText;
        items.push(item);
        block.appendChild(item);
      }
    }
  }

  if (items.length === 0) {
    console.warn('No items found in batch search block table');
    return;
  }

  // No results element
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