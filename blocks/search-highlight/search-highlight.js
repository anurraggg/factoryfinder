/**
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env browser */
import { toClassName } from '../scripts/aem.js';

/**
 * Clears all existing highlight spans in the content area.
 * @param {Element} content - The content element to clear highlights from.
 * @returns {void}
 */
function clearHighlights(content) {
  const highlights = content.querySelectorAll('.highlight');
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
  });
}

/**
 * Highlights all matches of the search term in the content.
 * Wraps matches in <span class="highlight">.
 * @param {Element} content - The content element to search in.
 * @param {string} term - The search term (lowercased).
 * @returns {void}
 */
function highlightMatches(content, term) {
  if (!term) {
    return;
  }

  const walker = document.createTreeWalker(
    content,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node);
  }

  nodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    const text = textNode.textContent;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const fragments = text.split(regex);

    if (fragments.length > 1) {
      const fragmentContainer = document.createDocumentFragment();
      fragments.forEach((fragment, index) => {
        if (fragment.toLowerCase() === term.toLowerCase()) {
          const span = document.createElement('span');
          span.className = 'highlight';
          span.textContent = fragment;
          fragmentContainer.appendChild(span);
        } else {
          fragmentContainer.appendChild(document.createTextNode(fragment));
        }
      });

      parent.replaceChild(fragmentContainer, textNode);
    }
  });
}

/**
 * Handles the search input event.
 * @param {Event} event - The input event.
 * @param {Element} content - The content element.
 * @returns {void}
 */
function handleSearch(event, content) {
  const term = event.target.value.trim().toLowerCase();
  clearHighlights(content);
  highlightMatches(content, term);
}

// eslint-disable-next-line import/prefer-default-export
export default async function decorate(block) {
  // Ensure block has class and status
  block.classList.add('block');
  block.dataset.blockStatus = 'initialized';

  // Find or create the search input in the first row/second column
  const rows = block.querySelectorAll(':scope > div');
  if (rows.length === 0) {
    return;
  }

  const firstRow = rows[0];
  const cols = firstRow.querySelectorAll(':scope > div');
  let searchInput;

  if (cols.length >= 2) {
    const secondCol = cols[1];
    const existingInput = secondCol.querySelector('input[type="search"]');
    if (existingInput) {
      searchInput = existingInput;
    } else {
      // Create search input if placeholder text exists
      const placeholderText = secondCol.textContent.trim();
      if (placeholderText) {
        secondCol.innerHTML = `<input type="search" placeholder="${placeholderText}" />`;
        searchInput = secondCol.querySelector('input[type="search"]');
      }
    }
  }

  // Define content area: everything after the first row
  const content = document.createElement('div');
  content.className = 'content';
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const rowCols = row.querySelectorAll(':scope > div');
    if (rowCols.length >= 2) {
      // Assume two-column: wrap as entry (heading left, addresses right)
      const entry = document.createElement('div');
      entry.className = 'entry';

      const heading = document.createElement('div');
      heading.className = 'heading';
      heading.appendChild(rowCols[0].cloneNode(true)); // Left col as heading
      entry.appendChild(heading);

      const addresses = document.createElement('div');
      addresses.className = 'addresses';
      addresses.appendChild(rowCols[1].cloneNode(true)); // Right col as addresses
      entry.appendChild(addresses);

      content.appendChild(entry);
    } else {
      // Fallback: append whole row if not two cols
      content.appendChild(row.cloneNode(true));
    }
  }
  block.appendChild(content);

  // Remove first row if no input was created
  if (!searchInput) {
    rows[0].remove();
  } else {
    // Add event listener to search input
    searchInput.addEventListener('input', (event) => handleSearch(event, content));
    // Initial clear
    clearHighlights(content);
  }

  // Load CSS for the block
  const { codeBasePath } = window.hlx || {};
  if (codeBasePath) {
    await import(`${codeBasePath}/blocks/search-highlight/search-highlight.css`);
  }
}