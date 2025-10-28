/*
 * Batch Search Block
 * Enables client-side search across a list of result items within the block.
 * Authors structure as a table in Docs/Sheets:
 * Row 1: Search input placeholder (text in first col)
 * Row 2: Search button text (text in first col)
 * Row 3+: Result items (text in first col, optional image/link in second)
 * If rows missing, creates defaults.
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
 * Builds a result item from a row.
 * @param {Element} row The row element
 * @returns {Element} Decorated result-item div
 */
function buildResultItem(row) {
  const resultDiv = document.createElement('div');
  resultDiv.classList.add('result-item');

  // Assume first col: text; second: optional image/link
  const cols = [...row.querySelectorAll('div')];
  if (cols.length > 0) {
    // Text content
    const textDiv = document.createElement('div');
    textDiv.textContent = cols[0].textContent.trim();
    resultDiv.appendChild(textDiv);

    // Optional image/link in second col
    if (cols.length > 1 && cols[1].querySelector('a, img')) {
      const media = cols[1].firstElementChild.cloneNode(true);
      resultDiv.insertBefore(media, textDiv);
    }
  }

  return resultDiv;
}

/**
 * Decorates the block: Parses table rows into input/button/results.
 * Creates defaults if insufficient rows.
 * @param {Element} block The batch-search block
 */
export default function decorate(block) {
  // Standard AEM block decoration: wrap text nodes
  const rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length === 0) {
    console.warn('Batch Search block has no rows; creating minimal defaults.');
    // Create minimal structure
    block.innerHTML = `
      <div><div>Search...</div></div>
      <div><div>Search</div></div>
      <div class="no-results" style="display: none;">No results found.</div>
    `;
    // Re-query rows after insert
    rows.length = 0;
    rows.push(...block.querySelectorAll(':scope > div'));
  }

  let inputRow = rows[0];
  let buttonRow = rows[1];
  let hasResults = rows.length > 2;

  // Build input from first row
  const searchForm = document.createElement('div');
  searchForm.classList.add('search-form');
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = inputRow ? inputRow.querySelector('div')?.textContent.trim() || 'Search...' : 'Search...';
  input.setAttribute('aria-label', 'Search input');
  searchForm.appendChild(input);

  // Build button from second row
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = buttonRow ? buttonRow.querySelector('div')?.textContent.trim() || 'Search' : 'Search';
  button.setAttribute('aria-label', 'Search');
  searchForm.appendChild(button);

  // Clear block and append search form
  block.innerHTML = '';
  block.appendChild(searchForm);

  // Build results from subsequent rows
  const resultsContainer = document.createElement('div');
  resultsContainer.classList.add('results-container');
  if (hasResults) {
    rows.slice(2).forEach((row) => {
      const resultItem = buildResultItem(row);
      resultsContainer.appendChild(resultItem);
    });
  } else {
    // Add a sample result if none
    const sampleResult = document.createElement('div');
    sampleResult.classList.add('result-item');
    sampleResult.textContent = 'Sample result item';
    resultsContainer.appendChild(sampleResult);
  }
  block.appendChild(resultsContainer);

  // Add no-results if missing
  let noResults = block.querySelector('.no-results');
  if (!noResults) {
    noResults = document.createElement('div');
    noResults.classList.add('no-results');
    noResults.textContent = 'No results found.';
    noResults.style.display = 'none';
    resultsContainer.appendChild(noResults);
  }

  const debouncedSearch = debounce((query) => performSearch(block, query), 300);

  const handleSearch = () => {
    const query = input.value.trim().toLowerCase();
    debouncedSearch(query);
  };

  input.addEventListener('input', handleSearch);
  button.addEventListener('click', handleSearch);

  // Initial state: show all results, hide no-results
  performSearch(block, '');
}