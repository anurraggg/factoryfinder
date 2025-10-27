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
 * Extracts factory code from heading (e.g., "01" from "(01) COMPANY").
 * @param {string} heading The heading text.
 * @returns {string} The code or empty string.
 */
function extractCode(heading) {
  const match = heading.match(/\(\s*(\d{2})\s*\)/);
  return match ? match[1] : '';
}

/**
 * Filters factory items based on search query, prioritizing code match.
 * @param {Element} container The container of factory items.
 * @param {string} query The search term.
 */
function filterFactories(container, query) {
  const items = container.querySelectorAll('.factory-item');
  let visibleCount = 0;
  const lowerQuery = query.toLowerCase().trim();

  if (lowerQuery === '') {
    // Show all if empty
    items.forEach((item) => {
      item.classList.remove('hidden');
      visibleCount++;
    });
  } else {
    items.forEach((item) => {
      const code = item.dataset.code || '';
      const text = item.textContent.toLowerCase();
      const codeMatch = code.startsWith(lowerQuery) || code.includes(lowerQuery);
      const textMatch = text.includes(lowerQuery);
      const matches = codeMatch || textMatch;
      if (matches) {
        item.classList.remove('hidden');
        visibleCount++;
      } else {
        item.classList.add('hidden');
      }
    });
  }

  // Show/hide no-results
  const noResults = container.parentElement.querySelector('.no-results');
  if (noResults) {
    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
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

  input.addEventListener('input', handleSearch); // Changed to 'input' for real-time
  button.addEventListener('click', handleSearch);

  // Initial: show all
  handleSearch();
}

/**
 * Builds a factory item from row data.
 * @param {string} heading The factory heading.
 * @param {string} addresses The addresses HTML.
 * @returns {Element} The factory item element.
 */
function buildFactoryItem(heading, addresses) {
  const item = document.createElement('div');
  item.classList.add('factory-item');

  const code = extractCode(heading);
  item.dataset.code = code;

  const headingEl = document.createElement('div');
  headingEl.classList.add('factory-heading');
  headingEl.innerHTML = heading; // Preserves bold/HTML

  const addressesEl = document.createElement('div');
  addressesEl.classList.add('factory-addresses');
  addressesEl.innerHTML = addresses;

  item.appendChild(headingEl);
  item.appendChild(addressesEl);

  return item;
}

/**
 * Decorates the block: Parses pre-table text and table into UI.
 * @param {Element} block The block element.
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  // Collect static content before first table
  let staticContent = '';
  let table = null;
  [...block.children].forEach((child) => {
    if (child.tagName === 'TABLE') {
      table = child;
      return;
    }
    staticContent += child.outerHTML || child.textContent;
  });

  // Clear block
  block.innerHTML = '';

  // Title (if in static, or hardcoded)
  const titleEl = document.createElement('h2');
  titleEl.classList.add('title');
  titleEl.textContent = 'FACTORY FINDER'; // Hardcoded; remove if not needed
  block.appendChild(titleEl);

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
  button.innerHTML = 'Q';

  searchContainer.appendChild(input);
  searchContainer.appendChild(button);
  block.appendChild(searchContainer);

  // Instructions from static (exclude title/product if separate)
  if (staticContent) {
    const instructions = document.createElement('div');
    instructions.classList.add('instructions');
    instructions.innerHTML = staticContent.replace(/FACTORY FINDER/i, '').trim();
    block.appendChild(instructions);
  }

  // Product section (extract from static if present)
  const productMatch = staticContent.match(/Wheat Flour.*$/i) || staticContent.match(/Multi Millet.*$/i); // Flexible
  if (productMatch) {
    const productEl = document.createElement('div');
    productEl.classList.add('product-section');
    productEl.innerHTML = productMatch[0].replace(/\n/g, '<br>');
    block.appendChild(productEl);
  }

  // Parse table
  if (table) {
    const factoriesContainer = document.createElement('div');
    factoriesContainer.classList.add('factories-container');

    const rows = table.querySelectorAll('tr');
    rows.forEach((row) => {
      const cols = [...row.children];
      if (cols.length >= 2) {
        const heading = cols[0].innerHTML.trim() || cols[0].textContent.trim();
        const addresses = cols[1].innerHTML.trim() || cols[1].textContent.trim();
        if (heading && addresses) {
          const item = buildFactoryItem(heading, addresses);
          factoriesContainer.appendChild(item);
        }
      }
    });

    const noResults = document.createElement('div');
    noResults.classList.add('no-results');
    noResults.style.display = 'none';
    noResults.textContent = 'No factories match your search. Try different keywords.';
    factoriesContainer.appendChild(noResults);

    block.appendChild(factoriesContainer);

    // Setup search
    setupSearch(input, button, factoriesContainer);
  }
}