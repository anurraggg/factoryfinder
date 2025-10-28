// batch-search.js
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
 * Filters items based on search query and applies highlighting.
 * @param {Element} container The container of items.
 * @param {string} query The search term.
 */
function filterItems(container, query) {
  const items = container.querySelectorAll('.result-item');
  let matchCount = 0;
  const lowerQuery = query.toLowerCase().trim();

  // Clear all previous highlights
  items.forEach((item) => clearHighlights(item));

  if (lowerQuery === '') {
    // Show all if empty (no highlights)
    items.forEach((item) => {
      item.classList.remove('hidden');
      matchCount++;
    });
  } else {
    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      const matches = text.includes(lowerQuery);
      if (matches) {
        item.classList.remove('hidden');
        matchCount++;
        // Apply highlighting to visible item
        highlightText(item, query);
      } else {
        item.classList.add('hidden');
      }
    });
  }

  // Show/hide no-results
  const noResults = container.querySelector('.no-results');
  if (noResults) {
    noResults.style.display = matchCount === 0 ? 'block' : 'none';
  }
}

/**
 * Handles search input and button click.
 * @param {Element} input The search input.
 * @param {Element} button The search button.
 * @param {Element} container The items container.
 */
function setupSearch(input, button, container) {
  const performSearch = () => {
    const query = input.value || ''; // Ensure string
    filterItems(container, query);
  };

  // Real-time on typing
  input.addEventListener('input', performSearch);
  input.addEventListener('keyup', performSearch);

  // Manual trigger on button click
  button.addEventListener('click', (e) => {
    e.preventDefault();
    performSearch();
    input.focus();
  });

  // Initial: show all, no highlights
  performSearch();
}

/**
 * Builds a result item from row data.
 * @param {string} text The item text HTML.
 * @returns {Element} The result item element.
 */
function buildResultItem(text) {
  const item = document.createElement('div');
  item.classList.add('result-item');

  const content = document.createElement('div');
  content.innerHTML = text;

  item.appendChild(content);

  return item;
}

/**
 * Decorates the block: Parses pre-table text and table rows into UI (fixed for EDS table rendering).
 * @param {Element} block The block element.
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  // Clear block
  block.innerHTML = '';

  // Title (hardcoded; adjust if dynamic)
  const titleEl = document.createElement('h2');
  titleEl.classList.add('title');
  titleEl.textContent = 'Batch Search';
  block.appendChild(titleEl);

  // Search bar
  const searchContainer = document.createElement('div');
  searchContainer.classList.add('search-container');

  const input = document.createElement('input');
  input.type = 'text';
  input.classList.add('search-input');
  input.placeholder = 'Type to search batches...';
  input.setAttribute('aria-label', 'Search batches by code or keyword');

  const button = document.createElement('button');
  button.classList.add('search-button');
  button.setAttribute('aria-label', 'Search');
  button.innerHTML = 'Q';

  searchContainer.appendChild(input);
  searchContainer.appendChild(button);
  block.appendChild(searchContainer);

  // Parse for static content and items (assumes EDS renders table rows as divs with 1 child or table)
  let hasItems = false;
  const itemsContainer = document.createElement('div');
  itemsContainer.classList.add('items-container');

  block.querySelectorAll(':scope > *').forEach((child) => {
    if (child.tagName === 'TABLE') {
      // Parse table
      const rows = child.querySelectorAll('tr');
      rows.forEach((row) => {
        const cols = [...row.children];
        if (cols.length >= 1) {
          const text = cols[0].innerHTML.trim() || cols[0].textContent.trim();
          if (text) {
            const item = buildResultItem(text);
            itemsContainer.appendChild(item);
            hasItems = true;
          }
        }
      });
    } else if (child.children && child.children.length === 1) {
      // Single-column div row
      const text = child.children[0].innerHTML.trim() || child.children[0].textContent.trim();
      if (text) {
        const item = buildResultItem(text);
        itemsContainer.appendChild(item);
        hasItems = true;
      }
    } else if (child.tagName === 'P' || child.tagName === 'DIV') {
      // Static instructions
      const instructions = document.createElement('div');
      instructions.classList.add('instructions');
      instructions.innerHTML = child.innerHTML;
      block.appendChild(instructions);
    }
  });

  if (hasItems) {
    const noResults = document.createElement('div');
    noResults.classList.add('no-results');
    noResults.style.display = 'none';
    noResults.textContent = 'No batches match your search. Try different keywords.';
    itemsContainer.appendChild(noResults);

    block.appendChild(itemsContainer);

    // Setup search after DOM insertion
    requestAnimationFrame(() => setupSearch(input, button, itemsContainer));
  } else {
    // Fallback message
    const fallback = document.createElement('div');
    fallback.textContent = 'No items found – add a table with batch details in Google Docs.';
    fallback.style.textAlign = 'center';
    fallback.style.color = '#666';
    block.appendChild(fallback);
    console.warn('No items found in batch-search block – add a 1-column table in Google Docs.');
  }
}