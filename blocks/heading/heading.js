/**
 * Heading block decorator.
 * @param {Element} block The heading block element.
 */
 export default function decorate(block) {
    const classes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    classes.forEach((cls) => block.classList.remove(cls));
    const h = document.createElement('h1');
    h.textContent = block.textContent.trim();
    h.classList.add('heading');
    block.innerHTML = '';
    block.append(h);
  }