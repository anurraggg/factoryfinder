// recipe-detail.js
import { decorateIcons } from '../../scripts/aem.js'; // Ensure import from aem.js (updated from lib-franklin.js)

// eslint-disable-next-line no-unused-vars
export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length < 3) return; // Ensure structure

  block.classList.add('recipe-detail');

  // Row 1: Content row
  const contentRow = rows[0];
  const leftCol = contentRow.querySelector('div:first-child');
  const rightCol = contentRow.querySelector('div:last-child');

  // Left: Title, subtitle, image, desc
  const h1 = leftCol.querySelector('h1');
  if (h1) h1.parentElement.classList.add('title-section'); // For styling if needed

  const img = leftCol.querySelector('img');
  if (img) img.parentElement.classList.add('hero-image');

  const subtitleP = leftCol.querySelector('p[style*="bold"]') || leftCol.querySelector('strong');
  if (subtitleP) subtitleP.classList.add('subtitle');

  // Right: Ingredients
  const ingredients = rightCol;
  ingredients.classList.add('ingredients');
  let ul = rightCol.querySelector('ul');
  if (!ul) {
    ul = document.createElement('ul');
    const ps = [...rightCol.querySelectorAll('p:not(:first-child)')]; // Assume first is h2
    ps.forEach(p => {
      const li = document.createElement('li');
      const text = p.textContent.trim();
      const match = text.match(/^(.*)\s*\(([^\)]+)\)$/);
      if (match) {
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('ingredient-name');
        nameSpan.textContent = match[1].trim();
        const qtySpan = document.createElement('span');
        qtySpan.classList.add('quantity');
        qtySpan.textContent = match[2].trim();
        li.appendChild(nameSpan);
        li.appendChild(qtySpan);
      } else {
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('ingredient-name');
        nameSpan.textContent = text;
        li.appendChild(nameSpan);
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
  } else {
    // If ul exists, enhance existing lis
    [...ul.querySelectorAll('li')].forEach(li => {
      if (!li.querySelector('.ingredient-name')) {
        let nameText = '';
        let qtyText = '';
        const children = [...li.childNodes];
        let fullText = children.map(node => node.textContent || node.innerText || '').join('').trim();
        const match = fullText.match(/^(.*)\s*\(([^\)]+)\)$/);
        if (match) {
          nameText = match[1].trim();
          qtyText = match[2].trim();
        } else {
          nameText = fullText;
        }
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('ingredient-name');
        nameSpan.textContent = nameText;
        const qtySpan = document.createElement('span');
        qtySpan.classList.add('quantity');
        qtySpan.textContent = qtyText;
        li.innerHTML = '';
        li.appendChild(nameSpan);
        if (qtyText) li.appendChild(qtySpan);
      }
    });
  }

  // Add scroll hint button
  const scrollHint = document.createElement('button');
  scrollHint.classList.add('scroll-hint');
  scrollHint.innerHTML = '↑';
  scrollHint.title = 'Scroll for more';
  scrollHint.addEventListener('click', () => ul.scrollTop = 0);
  ingredients.appendChild(scrollHint);

  // Row 2: Metadata
  const metaRow = rows[1].querySelector('div:first-child');
  if (metaRow) {
    metaRow.classList.add('metadata');
    const metaText = metaRow.textContent.trim();
    const metaParts = metaText.split('|').map(part => part.trim());
    metaRow.innerHTML = '';
    metaParts.forEach(part => {
      const div = document.createElement('div');
      let emoji = '';
      if (part.includes('Mins') || part.includes('Min')) emoji = '⏰';
      else if (part.includes('High') || part.includes('Low') || part.includes('Medium')) emoji = '🔥';
      else if (part.includes('People')) emoji = '👥';
      div.innerHTML = `${emoji} ${part}`;
      metaRow.appendChild(div);
    });
  }

  // Row 3: Buttons
  const buttonRow = rows[2];
  buttonRow.classList.add('buttons');
  const links = [...buttonRow.querySelectorAll('a')];
  if (links.length >= 2) {
    links[0].textContent = 'Download';
    links[1].textContent = 'Share';
  } else {
    // Fallback: Create buttons if not present
    const downloadBtn = document.createElement('a');
    downloadBtn.href = '#'; // Or dynamic
    downloadBtn.textContent = 'Download';
    downloadBtn.classList.add('button');
    const shareBtn = downloadBtn.cloneNode();
    shareBtn.textContent = 'Share';
    shareBtn.href = '#';
    buttonRow.querySelector('div:first-child').append(downloadBtn, shareBtn);
  }
  links.forEach(link => link.classList.add('button'));

  // Post-render: Check for scroll and show hint if needed
  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for layout
  const ingUl = block.querySelector('.ingredients ul');
  if (ingUl && ingUl.scrollHeight > 400) {
    scrollHint.style.display = 'flex';
  }

  decorateIcons(block); // Decorate any icons if present
}