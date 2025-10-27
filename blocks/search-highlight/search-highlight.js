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
        fragments.forEach((fragment) => {
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
  
  /**
   * Converts paragraphs or line breaks in addresses for consistent rendering.
   * @param {Element} elem - The element to process.
   * @returns {void}
   */
  function normalizeBreaks(elem) {
    // Convert <p> to <br>
    const paragraphs = elem.querySelectorAll('p');
    paragraphs.forEach((p) => {
      const br = document.createElement('br');
      p.parentNode.insertBefore(br, p);
      while (p.firstChild) {
        p.parentNode.insertBefore(p.firstChild, p);
      }
      p.parentNode.removeChild(p);
    });
  
    // If text nodes have multiple lines (rare, but for safety), split on \n
    const textNodes = elem.querySelectorAll('*').forEach((child) => {
      if (child.childNodes.length === 1 && child.firstChild.nodeType === Node.TEXT_NODE) {
        const text = child.firstChild.textContent;
        if (text.includes('\n')) {
          const lines = text.split('\n').filter(line => line.trim());
          child.innerHTML = lines.join('<br>');
        }
      }
    });
  }
  
  // eslint-disable-next-line import/prefer-default-export
  export default async function decorate(block) {
    console.log('Decorating search-highlight block'); // Debug log
  
    // Ensure block has class and status
    block.classList.add('block');
    block.dataset.blockStatus = 'initialized';
  
    // Find or create the search input in the first row/second column
    const rows = block.querySelectorAll(':scope > div');
    if (rows.length === 0) {
      console.warn('No rows found in search-highlight block');
      return;
    }
  
    const firstRow = rows[0];
    const cols = firstRow.querySelectorAll(':scope > div');
    let searchInput;
  
    if (cols.length >= 2) {
      const secondCol = cols[1];
      const colText = secondCol.textContent.trim();
      const existingInput = secondCol.querySelector('input[type="search"]');
      if (existingInput) {
        searchInput = existingInput;
      } else if (colText) {
        // Use col text as placeholder
        secondCol.innerHTML = `<input type="search" placeholder="${colText}" />`;
        searchInput = secondCol.querySelector('input[type="search"]');
      } else {
        // Fallback: Default input
        secondCol.innerHTML = '<input type="search" placeholder="Search addresses..." />';
        searchInput = secondCol.querySelector('input[type="search"]');
      }
    } else {
      // No second col? Inject default input at top
      const defaultInput = document.createElement('input');
      defaultInput.type = 'search';
      defaultInput.placeholder = 'Search addresses...';
      firstRow.prepend(defaultInput);
      searchInput = defaultInput;
    }
  
    console.log('Search input created:', searchInput); // Debug log
  
    // Remove first row (search row) from block
    firstRow.remove();
  
    // Re-query rows now that search row is removed
    const contentRows = block.querySelectorAll(':scope > div');
    console.log('Content rows after remove:', contentRows.length); // Debug
  
    // Define content area: process all remaining rows, grouping under headings
    const content = document.createElement('div');
    content.className = 'content';
    let currentEntry = null;
    let currentAddresses = null;
  
    for (let i = 0; i < contentRows.length; i += 1) {
      const row = contentRows[i];
      const rowCols = row.querySelectorAll(':scope > div');
      const leftColText = rowCols.length > 0 ? rowCols[0].textContent.trim() : '';
  
      if (leftColText) {
        // New heading row: Create new entry (close previous if exists)
        if (currentEntry) {
          content.appendChild(currentEntry);
        }
        currentEntry = document.createElement('div');
        currentEntry.className = 'entry';
  
        const heading = document.createElement('div');
        heading.className = 'heading';
        if (rowCols.length > 0) {
          heading.appendChild(rowCols[0].cloneNode(true));
        }
        currentEntry.appendChild(heading);
  
        currentAddresses = document.createElement('div');
        currentAddresses.className = 'addresses';
        if (rowCols.length > 1) {
          currentAddresses.appendChild(rowCols[1].cloneNode(true));
          normalizeBreaks(currentAddresses);
        }
        currentEntry.appendChild(currentAddresses);
      } else if (currentAddresses && rowCols.length > 0) {
        // Continuation row: Append to current addresses (left empty, right has content)
        if (rowCols.length > 0) {
          const continuationContent = rowCols[0].cloneNode(true); // Assume single col continuation
          if (rowCols.length > 1) {
            continuationContent.appendChild(rowCols[1].cloneNode(true));
          }
          currentAddresses.appendChild(continuationContent);
          normalizeBreaks(currentAddresses);
        }
      } else {
        // Fallback: append whole row
        content.appendChild(row.cloneNode(true));
      }
    }
  
    // Append the last entry if exists
    if (currentEntry) {
      content.appendChild(currentEntry);
    }
  
    // Insert search input at the very top of the block, then content
    block.insertBefore(searchInput, block.firstChild);
    block.appendChild(content);
  
    // Add event listener if input exists
    if (searchInput) {
      searchInput.addEventListener('input', (event) => handleSearch(event, content));
      clearHighlights(content); // Initial clear
    } else {
      console.error('No search input created!');
    }
  
    // Load CSS for the block
    const { codeBasePath } = window.hlx || {};
    if (codeBasePath) {
      try {
        await import(`${codeBasePath}/blocks/search-highlight/search-highlight.css`);
        console.log('CSS loaded for search-highlight');
      } catch (error) {
        console.error('Failed to load CSS:', error);
      }
    }
  }