/*
 * Batch Search Block (AEM EDS Compatible)
 * Enables client-side search across tabular data.
 * Google Docs structure:
 * Row 1: Search input placeholder
 * Row 2: Button text
 * Row 3+: Result rows (2 columns: heading | address)
 */

import { sampleRUM } from '../../scripts/aem.js';

/** Debounce utility */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/** Escape regex special chars in user query */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlights matched text inside an element using its stored original text.
 * Preserves original line breaks (stored in dataset.original).
 */
function highlightMatch(element, query) {
  const original = element.dataset.original || element.textContent || '';
  const originalHtml = original.replace(/\n/g, '<br>');
  if (!query) {
    element.innerHTML = originalHtml;
    return;
  }
  const esc = escapeRegExp(query);
  const regex = new RegExp(`(${esc})`, 'gi');
  const highlighted = originalHtml.replace(regex, '<mark class="eic-highlight">$1</mark>');
  element.innerHTML = highlighted;
}

/**
 * Filters and highlights result items by the search query
 * `query` is the raw user input (not lowercased). Matching is case-insensitive.
 */
function performSearch(block, query) {
  const qLower = (query || '').toLowerCase();
  const results = block.querySelectorAll('.result-item');
  const noResults = block.querySelector('.no-results');
  let found = 0;

  results.forEach((item) => {
    const text = item.dataset.searchText || item.textContent;
    const match = text.toLowerCase().includes(qLower);

    if (match || qLower === '') {
      item.style.display = 'block';
      found += 1;

      // highlight within stored elements
      const heading = item.querySelector('.result-heading');
      const address = item.querySelector('.result-address');
      if (heading) highlightMatch(heading, query);
      if (address) highlightMatch(address, query);
    } else {
      item.style.display = 'none';
    }
  });

  if (noResults) noResults.style.display = found === 0 ? 'block' : 'none';
  sampleRUM('search-performed', { query, resultsFound: found });
}

/** Build result DOM while preserving original text in data attributes */
function buildResultItem(row) {
  const resultDiv = document.createElement('div');
  resultDiv.classList.add('result-item');

  const cols = [...row.querySelectorAll('div')];
  let searchTextParts = [];

  if (cols.length > 0) {
    const headingDiv = document.createElement('div');
    headingDiv.classList.add('result-heading');
    const headingText = cols[0].textContent.trim();
    // store original text for reliable highlights and line-break preserving
    headingDiv.dataset.original = headingText;
    headingDiv.innerHTML = headingText.replace(/\n/g, '<br>');
    resultDiv.appendChild(headingDiv);
    searchTextParts.push(headingText);
  }

  if (cols.length > 1) {
    const addressDiv = document.createElement('div');
    addressDiv.classList.add('result-address');
    const addressText = cols[1].textContent.trim();
    addressDiv.dataset.original = addressText;
    addressDiv.innerHTML = addressText.replace(/\n/g, '<br>');
    resultDiv.appendChild(addressDiv);
    searchTextParts.push(addressText);
  }

  // store a combined searchable text (lowercase) for fast matching
  resultDiv.dataset.searchText = searchTextParts.join(' ').trim();

  return resultDiv;
}

/** Main decorator */
export default function decorate(block) {
  let rows = [...block.querySelectorAll(':scope > div')];

  if (rows.length === 0) {
    console.warn('Batch Search block has no rows; creating minimal defaults.');
    block.innerHTML = `
      <div><div>Search...</div></div>
      <div><div>Search</div></div>
      <div class="no-results" style="display: none;">No results found.</div>
    `;
    return;
  }

  // If first row looks like header (2+ cols), remove it so config rows line up
  if (rows.length && rows[0].children.length > 1) {
    rows.shift();
  }

  // Skip any accidental header text rows like "heading" / "address"
  rows = rows.filter((r) => {
    const t = r.querySelector('div')?.textContent?.trim()?.toLowerCase() || '';
    return !(t === 'heading' || t === 'address' || t === '');
  });

  const inputRow = rows[0];
  const buttonRow = rows[1];
  const hasResults = rows.length > 2;

  // Build search form
  const searchForm = document.createElement('div');
  searchForm.classList.add('search-form');

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder =
    (inputRow?.querySelector('div')?.textContent?.trim()) || 'Search...';
  input.setAttribute('aria-label', 'Search input');
  searchForm.appendChild(input);

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent =
    (buttonRow?.querySelector('div')?.textContent?.trim()) || 'Search';
  button.setAttribute('aria-label', 'Search');
  searchForm.appendChild(button);

  // rebuild block
  block.innerHTML = '';
  block.appendChild(searchForm);

  // results container
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

  // no-results element
  let noResults = block.querySelector('.no-results');
  if (!noResults) {
    noResults = document.createElement('div');
    noResults.classList.add('no-results');
    noResults.textContent = 'No results found.';
    noResults.style.display = 'none';
    resultsContainer.appendChild(noResults);
  }

  // search wiring
  const debouncedSearch = debounce((query) => performSearch(block, query), 300);
  const handleSearch = () => {
    const raw = input.value.trim();
    debouncedSearch(raw);
  };

  input.addEventListener('input', handleSearch);
  button.addEventListener('click', handleSearch);

  // initial show all
  performSearch(block, '');
}
