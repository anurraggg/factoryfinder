// recipe-detail.js
// eslint-disable-next-line no-unused-vars
export default async function decorate(block) {
    const rows = [...block.querySelectorAll(':scope > div')];
    if (rows.length < 3) return; // Ensure structure
  
    // Left column: Title, subtitle, desc, metadata
    const leftCol = rows[0].querySelector('div:first-child');
    const rightCol = rows[0].querySelector('div:last-child');
  
    // Enhance left: Add metadata icons if not present
    const metaRow = rows[1].querySelector('div:first-child');
    if (metaRow) {
      metaRow.classList.add('metadata');
      // Assume text like "⏰ 60 Mins | 🔥 High | 👥 For 4 People"; split and wrap in divs
      const metaParts = metaRow.textContent.split('|').map(part => part.trim());
      metaRow.innerHTML = metaParts.map(part => `<div>${part}</div>`).join('');
    }
  
    // Right: Ingredients
    const ingredients = rightCol.querySelector('ul') || rightCol.querySelectorAll('p').length > 0 ? rightCol : null;
    if (ingredients) {
      rightCol.classList.add('ingredients');
      let ul = rightCol.querySelector('ul');
      if (!ul) {
        ul = document.createElement('ul');
        [...rightCol.querySelectorAll('p')].forEach(p => {
          const li = document.createElement('li');
          const text = p.textContent.trim();
          const match = text.match(/^(.*)\s*\(([^)]+)\)$/);
          if (match) {
            li.innerHTML = `<span>${match[1]}</span><span class="quantity">${match[2]}</span>`;
          } else {
            li.textContent = text;
          }
          ul.appendChild(li);
          p.remove();
        });
        const h2 = rightCol.querySelector('h2') || document.createElement('h2');
        if (!rightCol.querySelector('h2')) {
          h2.textContent = 'Ingredients';
          rightCol.prepend(h2);
        }
        rightCol.appendChild(ul);
      }
    }
  
    // Bottom row: Buttons
    const buttonRow = rows[2].querySelector('div:first-child');
    if (buttonRow) {
      buttonRow.classList.add('buttons');
      [...buttonRow.querySelectorAll('a')].forEach(a => a.classList.add('button'));
    }
  
    // Add scroll if needed (check after render)
    const ingUl = block.querySelector('.ingredients ul');
    if (ingUl && ingUl.scrollHeight > ingUl.parentElement.clientHeight) {
      ingUl.style.overflowY = 'auto';
    }
  }