/*
 * Batch Search Block (AEM EDS Compatible, Fixed Header Issue)
 * Filters content in a 2-column table based on a search input.
 */

import { sampleRUM } from '../../scripts/aem.js';

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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

  if (noResults) noResults.style.display = found === 0 ? 'block' : 'none';
  sampleRUM('search-performed', { query, resultsFound: found });
}

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

  // 🧹 Clean header / extra rows that shouldn't be parsed
  rows = rows.filter((row) => {
    const firstCellText = row.querySelector('div')?.textContent.trim().toLowerCase();
    // remove header-like rows or empty ones
    return (
      firstCellText &&
      !firstCellText.includes('heading') &&
      !firstCellText.includes('address')
    );
  });

  // 🩹 If any row has more than one column before search input, skip it
  if (rows.length && rows[0].children.length > 1) {
    rows.shift();
  }

  const inputRow = rows[0];
  const buttonRow = rows[1];
  const hasResults = rows.length > 2;

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

  block.innerHTML = '';
  block.appendChild(searchForm);

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

  performSearch(block, '');
}
