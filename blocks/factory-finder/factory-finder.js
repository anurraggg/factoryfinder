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
 * Clears all highlights in an element.
 * @param {Element} element The element to clear highlights from.
 * @returns {void}
 */
function clearHighlights(element) {
  const highlights = element.querySelectorAll('.highlight');
  highlights.forEach((span) => {
    span.outerHTML = span.innerHTML;
  });
}

/**
 * Highlights matching text in an element by replacing text nodes.
 * @param {Element} element The element to highlight in.
 * @param {string} query The search term to highlight.
 * @returns {void}
 */
function highlightText(element, query) {
  if (!query.trim()) {
    clearHighlights(element);
    return;
  }

  clearHighlights(element);

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent;
    if (regex.test(text)) {
      const parent = node.parentNode;
      const highlighted = text.replace(regex, '<span class="highlight">$1</span>');
      const temp = document.createElement('div');
      temp.innerHTML = highlighted;
      const fragment = document.createDocumentFragment();
      while (temp.firstChild) {
        fragment.appendChild(temp.firstChild);
      }
      parent.replaceChild(fragment, node);
    }
  }
}

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
 * Filters factory items based on search query, prioritizing code match, and applies highlighting.
 * @param {Element} container The container of factory items.
 * @param {string} query The search term.
 */
function filterFactories(container, query) {
  const items = container.querySelectorAll('.factory-item');
  let visibleCount = 0;
  const lowerQuery = query.toLowerCase().trim();

  // Clear all previous highlights
  items.forEach((item) => clearHighlights(item));

  if (lowerQuery === '') {
    // Show all if empty (no highlights)
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
        // Apply highlighting to visible item
        const headingEl = item.querySelector('.factory-heading');
        const addressesEl = item.querySelector('.factory-addresses');
        if (headingEl) highlightText(headingEl, query);
        if (addressesEl) highlightText(addressesEl, query);
      } else {
        item.classList.add('hidden');
      }
    });
  }

  // Show/hide no-results
  const noResults = container.querySelector('.no-results');
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
    const query = input.value || ''; // Ensure string
    filterFactories(container, query);
  };

  // Real-time on typing (input + keyup for compatibility)
  input.addEventListener('input', handleSearch);
  input.addEventListener('keyup', handleSearch);

  // Manual trigger on button click
  button.addEventListener('click', (e) => {
    e.preventDefault();
    handleSearch();
    input.focus();
  });

  // Initial: show all, no highlights
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
  headingEl.innerHTML = heading; // Preserves bold/HTML from Docs

  const addressesEl = document.createElement('div');
  addressesEl.classList.add('factory-addresses');
  addressesEl.innerHTML = addresses;

  item.appendChild(headingEl);
  item.appendChild(addressesEl);

  return item;
}

/**
 * Decorates the block: Parses pre-table text and div rows into UI (fixed for EDS table rendering).
 * @param {Element} block The block element.
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  // Clear block first
  block.innerHTML = '';

  // Title (hardcoded; adjust if dynamic)
  const titleEl = document.createElement('h2');
  titleEl.classList.add('title');
  titleEl.textContent = 'FACTORY FINDER';
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

  // Parse for static content and factory rows (assumes EDS renders table rows as divs with 2+ children)
  let hasFactories = false;
  const factoriesContainer = document.createElement('div');
  factoriesContainer.classList.add('factories-container');

  block.querySelectorAll(':scope > *').forEach((child) => {
    if (child.children && child.children.length >= 2) {
      // Treat as factory row
      const cols = [...child.children];
      const heading = cols[0].innerHTML.trim() || cols[0].textContent.trim();
      const addresses = cols[1].innerHTML.trim() || cols[1].textContent.trim();
      if (heading && addresses) {
        const item = buildFactoryItem(heading, addresses);
        factoriesContainer.appendChild(item);
        hasFactories = true;
      }
    } else if (child.tagName === 'P' || child.tagName === 'DIV') {
      // Static content (e.g., instructions/product header)
      if (child.textContent.includes('Flour') || child.textContent.includes('Millet')) {
        const productEl = document.createElement('div');
        productEl.classList.add('product-section');
        productEl.innerHTML = child.innerHTML;
        block.appendChild(productEl);
      } else {
        const instructions = document.createElement('div');
        instructions.classList.add('instructions');
        instructions.innerHTML = child.innerHTML;
        block.appendChild(instructions);
      }
    }
  });

  if (hasFactories) {
    const noResults = document.createElement('div');
    noResults.classList.add('no-results');
    noResults.style.display = 'none';
    noResults.textContent = 'No factories match your search. Try different keywords.';
    factoriesContainer.appendChild(noResults);

    block.appendChild(factoriesContainer);

    // Setup search after full DOM insertion
    requestAnimationFrame(() => setupSearch(input, button, factoriesContainer));
  } else {
    // Fallback if no rows found: Log for debug
    console.warn('No factory rows found in factory-finder block – ensure Google Doc has a 2-column table with div rows.');
  }
}