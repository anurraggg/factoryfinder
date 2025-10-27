// factory-finder.js
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable func-names */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */

import {
  readBlockConfig,
} from '../../scripts/aem.js';

/**
 * Filters factory items based on search query.
 * @param {Element} container The container of factory items.
 * @param {string} query The search term.
 */
function filterFactories(container, query) {
  const items = container.querySelectorAll('.factory-item');
  let visibleCount = 0;

  items.forEach((item) => {
    const text = item.textContent.toLowerCase();
    const matches = query === '' || text.includes(query.toLowerCase());
    if (matches) {
      item.classList.remove('hidden');
      visibleCount++;
    } else {
      item.classList.add('hidden');
    }
  });

  // Show/hide no-results message
  const noResults = container.parentElement.querySelector('.no-results');
  if (noResults) {
    noResults.style.display = visibleCount === 0 && query !== '' ? 'block' : 'none';
  }
}

/**
 * Handles search input and button click.
 * @param {Element} input The search input.
 * @param {Element} button The search button.
 * @param {Element} container The factories container.
 */
function setupSearch(input, button, container) {
  const handleSearch = () => {
    const query = input.value.trim();
    filterFactories(container, query);
  };

  input.addEventListener('keyup', handleSearch);
  button.addEventListener('click', handleSearch);

  // Initial load: show all
  handleSearch();
}

/**
 * Builds a factory item from row data.
 * @param {string} code The factory code.
 * @param {string} details The factory details HTML.
 * @returns {Element} The factory item element.
 */
function buildFactoryItem(code, details) {
  const item = document.createElement('div');
  item.classList.add('factory-item');

  const codeEl = document.createElement('div');
  codeEl.classList.add('factory-code');
  codeEl.textContent = code;

  const detailsEl = document.createElement('div');
  detailsEl.classList.add('factory-details');
  detailsEl.innerHTML = details;

  item.appendChild(codeEl);
  item.appendChild(detailsEl);

  return item;
}

/**
 * Decorates the block: Parses pre-table text and table into UI.
 * @param {Element} block The block element.
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  // Extract static content: Everything before the first table
  let staticContent = '';
  let tableStart = null;
  block.childNodes.forEach((node, index) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'TABLE') {
      tableStart = index;
      return;
    }
    staticContent += node.textContent || node.innerHTML || '';
  });

  // Clear and rebuild static part
  const staticEl = document.createElement('div');
  staticEl.innerHTML = staticContent.replace(/\n/g, '<br>'); // Preserve line breaks
  staticEl.classList.add('static-content');
  block.innerHTML = '';

  // Title extraction (first h1 or bold)
  const titleMatch = staticContent.match(/FACTORY FINDER/i);
  if (titleMatch) {
    const title = document.createElement('h2');
    title.classList.add('title');
    title.textContent = 'FACTORY FINDER';
    block.appendChild(title);
  }

  // Search bar
  const searchContainer = document.createElement('div');
  searchContainer.classList.add('search-container');

  const input = document.createElement('input');
  input.type = 'text';
  input.classList.add('search-input');
  input.placeholder = 'Type First Two Characters of the Batch No.';
  input.setAttribute('aria-label', 'Search factories by batch code or keyword');

  const button = document.createElement('button');
  button.classList.add('search-button');
  button.setAttribute('aria-label', 'Search');
  button.innerHTML = 'Q'; // Placeholder for magnifying glass

  searchContainer.appendChild(input);
  searchContainer.appendChild(button);
  block.appendChild(searchContainer);

  // Instructions and product section (from static)
  const instructions = document.createElement('div');
  instructions.classList.add('instructions');
  instructions.innerHTML = staticContent.replace(/FACTORY FINDER/i, '').trim().replace(/\n/g, '<br>');
  block.appendChild(instructions);

  const productMatch = staticContent.match(/Wheat Flour.*$/i);
  if (productMatch) {
    const productEl = document.createElement('div');
    productEl.classList.add('product-section');
    productEl.innerHTML = productMatch[0].replace(/\n/g, '<br>');
    block.appendChild(productEl);
  }

  // Parse table for factories
  const table = block.querySelector('table');
  if (table) {
    const factoriesContainer = document.createElement('div');
    factoriesContainer.classList.add('factories-container');

    const tbody = table.querySelector('tbody') || table;
    tbody.querySelectorAll('tr').forEach((row) => {
      const cols = [...row.children];
      if (cols.length >= 2) {
        const code = cols[0].textContent.trim();
        const details = cols[1].innerHTML || cols[1].textContent;
        const item = buildFactoryItem(code, details);
        factoriesContainer.appendChild(item);
      }
    });

    const noResults = document.createElement('div');
    noResults.classList.add('no-results');
    noResults.textContent = 'No factories match your search. Try different keywords.';
    factoriesContainer.appendChild(noResults);

    block.appendChild(factoriesContainer);

    // Setup search after DOM insertion
    setupSearch(input, button, factoriesContainer);
  }
}