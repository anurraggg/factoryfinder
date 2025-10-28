/*
 * Batch Search Block
 * Enables client-side search across a list of result items within the block.
 * Authors structure: Optional input/button rows, followed by result rows (e.g., divs with text).
 * If input/button missing, dynamically creates a basic search form.
 * Filters results in real-time on input/button click.
 * Debounced for performance (300ms delay on input).
 */

import { sampleRUM } from '../../scripts/aem.js';

/**
 * Debounces a function to limit execution frequency.
 * @param {Function} func The function to debounce
 * @param {number} wait Delay in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Performs the search: Filters result items by query, toggles visibility.
 * @param {Element} block The batch-search block
 * @param {string} query Search query
 */
function performSearch(block, query) {
  const results = block.querySelectorAll('.result-item');
  const noResults = block.querySelector('.no-results');
  let found = 0;

  results.forEach((item) => {
    const text = item.textContent.toLowerCase();
    if (text.includes(query)) {
      item.style.display = 'block';
      found += 1;
    } else {
      item.style.display = 'none';
    }
  });

  if (noResults) {
    noResults.style.display = found === 0 ? 'block' : 'none';
  }

  // Optional: Sample RUM for search performance
  sampleRUM('search-performed', { query, resultsFound: found });
}

/**
 * Creates a default search form if missing.
 * @param {Element} block The batch-search block
 * @returns {Object} {input, button} The created elements
 */
function createDefaultSearchForm(block) {
  // Clear block and create form structure
  block.innerHTML = `
    <div class="search-form">
      <input type="text" placeholder="Search..." aria-label="Search input">
      <button type="button" aria-label="Search">Search</button>
    </div>
    <div class="no-results" style="display: none;">No results found.</div>
  `;

  const input = block.querySelector('input');
  const button = block.querySelector('button');
  const noResults = block.querySelector('.no-results');

  return { input, button, noResults };
}

/**
 * Decorates the block: Sets up input/button listeners with debounced search.
 * Dynamically creates form if missing for better authoring flexibility.
 * @param {Element} block The batch-search block
 */
export default function decorate(block) {
  let input = block.querySelector('input');
  let button = block.querySelector('button');
  let noResults = block.querySelector('.no-results');

  // If missing, create default form (assumes results are after)
  if (!input || !button) {
    console.warn('Batch Search block missing input or button; creating defaults.');
    const formElements = createDefaultSearchForm(block);

    // Append existing children (results) after the new form
    const searchForm = block.querySelector('.search-form');
    Array.from(block.children).forEach((child) => {
      if (child !== searchForm && !child.classList.contains('no-results')) {
        searchForm.after(child);
      }
    });

    input = formElements.input;
    button = formElements.button;
    noResults = formElements.noResults;
  }

  const debouncedSearch = debounce((query) => performSearch(block, query), 300);

  const handleSearch = () => {
    const query = input.value.trim().toLowerCase();
    debouncedSearch(query);
  };

  input.addEventListener('input', handleSearch);
  button.addEventListener('click', handleSearch);

  // Initial hide of no-results if present and no query
  if (noResults && input.value.trim() === '') {
    noResults.style.display = 'none';
  }
}