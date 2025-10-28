/*
 * Batch Search Block
 * Enables client-side search across a list of result items within the block.
 * Authors structure: Input row, button row, followed by result rows (e.g., divs with text).
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
 * Decorates the block: Sets up input/button listeners with debounced search.
 * @param {Element} block The batch-search block
 */
export default function decorate(block) {
  const input = block.querySelector('input');
  const button = block.querySelector('button');

  if (!input || !button) {
    console.warn('Batch Search block missing input or button');
    return;
  }

  const debouncedSearch = debounce((query) => performSearch(block, query), 300);

  const handleSearch = () => {
    const query = input.value.trim().toLowerCase();
    debouncedSearch(query);
  };

  input.addEventListener('input', handleSearch);
  button.addEventListener('click', handleSearch);

  // Initial hide of no-results if present
  const noResults = block.querySelector('.no-results');
  if (noResults) {
    noResults.style.display = 'none';
  }
}