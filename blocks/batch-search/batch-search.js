/*
 * Batch Search Block (AEM EDS Compatible)
 * Enables client-side search across tabular data.
 * Google Docs structure:
 * Row 1: Search input placeholder
 * Row 2: Button text
 * Row 3+: Result rows (2 columns: heading | address)
 */

import { sampleRUM } from '../../scripts/aem.js';

/**
 * Debounce utility — delays function calls for smoother search
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Highlights matched text inside an element
 */
function highlightText(element, query) {
  const text = element.textContent;
  if (!query) {
    element.innerHTML = text;
    return;
  }
  const regex = new RegExp(`(${query})`, 'gi');
  element.innerHTML = text.replace(regex, '<mark style="background: yellow;">$1</mark>');
}

/**
 * Filters and highlights result items by the search query
 */
function performSearch(block, query) {
  const results = block.querySelectorAll('.result-item');
  const noResults = block.querySelector('.no-results');
  let found = 0;

  results.forEach((item) => {
    const text = item.textContent.toLowerCase();
    const match = text.includes(query);
    if (match) {
      item.style.display = 'block';
      found += 1;

      // Highlight matching text inside heading and address
      const heading = item.querySelector('.result-heading');
      const address = item.querySelector('.result-address');
      if (heading) highlightText(heading, query);
      if (address) highlightText(address, query);
    } else {
      item.style.display = 'none';
    }
  });

  if (noResults) noResults.style.display = found === 0 ? 'block' : 'none';
  sampleRUM('search-performed', { query, resultsFound: found });
}

/**
 * Builds a single result item
 */
function buildResultItem(row) {
  const resultDiv = document.createElement('div');
  resultDiv.classList.add('result-item');

  const cols = [...row.querySelectorAll('div')];
  if (cols.length > 0) {
    const headingDiv = document.createElement('div');
    headingDiv.classList.add('result-heading');
    headingDiv.textContent = cols[0].textContent.trim();
    resultDiv.appendChild(headingDiv);

    if (cols.length > 1) {
      const addressDiv = document.createElement('div');
      addressDiv.classList.add('result-address');
      addressDiv.textContent = cols[1].textContent.trim();
      resultDiv.appendChild(addressDiv);
    }
  }

  return resultDiv;
}

/**
 * Main decorator for the batch-search block
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  if (rows.length === 0) {
    console.warn('Batch Search block has no rows; creating minimal defaults.');
    block.innerHTML = `
      <div><div>Search...</div></div>
      <div><div>Search</div></div>
      <div class="no-results" style="display: none;">No results found.</div>
    `;
    return;
  }

  // 🩹 Skip header if first row has more than one column (heading | address)
  if (rows.length && rows[0].children.length > 1) {
    rows.shift();
  }

  const inputRow = rows[0];
  const buttonRow = rows[1];
  const hasResults = rows.length > 2;

  // 🔍 Build search input + button
  const searchForm = document.createElement('div');
  searchForm.classList.add('search-form');

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder =
    inputRow?.querySelector('div')?.textContent.trim() || 'Search...';
  input.setAttribute('aria-label', 'Search input');
  searchForm.appendChild(input);

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent =
    buttonRow?.querySelector('div')?.textContent.trim() || 'Search';
  button.setAttribute('aria-label', 'Search');
  searchForm.appendChild(button);

  // 🧹 Clear block and rebuild
  block.innerHTML = '';
  block.appendChild(searchForm);

  // 🗂️ Build result list
  const resultsContainer = document.createElement('div');
  resultsContainer.classList.add('results-container');

  if (hasResults) {
    rows.slice(2).forEach((row) => {
      const resultItem = buildResultItem(row);
      resultsContainer.appendChild(resultItem);
    });
  } else {
    const sample = document.createElement('div');
    sample.classList.add('result-item');
    sample.textContent = 'Sample result item';
    resultsContainer.appendChild(sample);
  }

  block.appendChild(resultsContainer);

  // 🚫 No-results message
  let noResults = block.querySelector('.no-results');
  if (!noResults) {
    noResults = document.createElement('div');
    noResults.classList.add('no-results');
    noResults.textContent = 'No results found.';
    noResults.style.display = 'none';
    resultsContainer.appendChild(noResults);
  }

  // 🕵️ Hook up search behavior
  const debouncedSearch = debounce((query) => performSearch(block, query), 300);
  const handleSearch = () => {
    const query = input.value.trim().toLowerCase();
    debouncedSearch(query);
  };

  input.addEventListener('input', handleSearch);
  button.addEventListener('click', handleSearch);

  // Show all results initially
  performSearch(block, '');
}
