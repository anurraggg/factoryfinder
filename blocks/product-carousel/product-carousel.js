// product-carousel.js
import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Initializes the product carousel block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  console.log('Starting product-carousel decorate'); // Debug log

  // Extract title and slides from block rows
  const rows = [...block.querySelectorAll(':scope > div')];
  console.log(`Found ${rows.length} rows`); // Debug

  if (rows.length < 2) {
    console.log('Too few rows, skipping'); // Debug
    return;
  }

  const titleRow = rows[0];
  const titleCell = titleRow.querySelector('div');
  const title = titleCell ? titleCell.innerHTML.trim() : 'Discover Our Products';
  titleCell.innerHTML = `<h2 class="product-carousel__title">${title}</h2>`;

  // Build slides array
  const slides = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const cells = [...row.querySelectorAll('div')];
    console.log(`Row ${i}: ${cells.length} cells`); // Debug
    if (cells.length >= 2) { // Relaxed: >=2 (title + desc; image optional)
      const imgCell = cells[0];
      const titleCellSlide = cells[1];
      const descCell = cells[2] || { innerHTML: '' }; // Fallback empty desc

      // Optimize image if present
      let imageHTML = '';
      const img = imgCell.querySelector('img');
      if (img) {
        const alt = img.alt || 'Product Image';
        const src = img.src;
        imgCell.innerHTML = '';
        const picture = createOptimizedPicture(src, alt, false, [
          { media: '(min-width: 900px)', width: '400' },
          { width: '300' },
        ]);
        imageHTML = picture.outerHTML;
      } else {
        imageHTML = imgCell.innerHTML; // Fallback to raw if no <img>
      }

      slides.push({
        image: imageHTML,
        title: titleCellSlide.innerHTML,
        description: descCell.innerHTML,
      });
      console.log(`Added slide ${slides.length}: ${titleCellSlide.innerHTML.substring(0, 20)}...`); // Debug
    } else {
      console.log(`Skipping row ${i}: too few cells`); // Debug
    }
  }

  console.log(`Built ${slides.length} slides`); // Debug
  if (slides.length < 1) {
    console.log('No slides, keeping original content'); // Debug
    return;
  }

  const totalSlides = slides.length;

  // Build extended slides for infinite: [last, ...slides, first]
  const extendedSlides = [slides[totalSlides - 1], ...slides, slides[0]];

  // Build DOM structure
  const slidesContainer = document.createElement('div');
  slidesContainer.className = 'product-carousel__slides';
  slidesContainer.setAttribute('role', 'list');
  slidesContainer.setAttribute('aria-label', 'Product carousel');

  extendedSlides.forEach((slide) => {
    const slideEl = document.createElement('div');
    slideEl.className = 'product-carousel__slide';
    slideEl.setAttribute('role', 'listitem');
    slideEl.innerHTML = `
      <div class="product-carousel__slide-image">${slide.image}</div>
      <div class="product-carousel__slide-content">
        <h3 class="product-carousel__slide-title">${slide.title}</h3>
        <p class="product-carousel__slide-description">${slide.description}</p>
      </div>
    `;
    slidesContainer.appendChild(slideEl);
  });

  // Navigation arrows
  const nav = document.createElement('nav');
  nav.className = 'product-carousel__nav';
  nav.innerHTML = `
    <button class="product-carousel__arrow product-carousel__arrow--left" aria-label="Previous slide">◀</button>
    <button class="product-carousel__arrow" aria-label="Next slide">▶</button>
  `;

  // Dots indicators
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'product-carousel__dots';
  dotsContainer.setAttribute('role', 'tablist');
  for (let i = 0; i < totalSlides; i += 1) {
    const dot = document.createElement('button');
    dot.className = 'product-carousel__dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0);
    dotsContainer.appendChild(dot);
  }
  const dots = [...dotsContainer.querySelectorAll('.product-carousel__dot')];

  // Assemble block
  block.className = 'product-carousel'; // Override to ensure class
  block.innerHTML = '';
  block.append(titleRow); // Append whole title row for structure
  block.appendChild(slidesContainer);
  block.appendChild(nav);
  block.appendChild(dotsContainer);

  console.log('Block assembled, initializing interactions'); // Debug

  // State
  let currentExtendedIndex = 1; // Start at first real slide (index 1 in extended)
  let isTransitioning = false;
  let autoplayInterval;
  let realCurrentIndex = 0; // For dots: 0 to total-1

  // Update dots
  function updateDots(realIndex) {
    dots.forEach((dot, i) => {
      const active = i === realIndex;
      dot.setAttribute('aria-selected', active);
      dot.classList.toggle('product-carousel__dot--active', active);
    });
  }

  // Direct set to real slide index (for dots/keyboard)
  function setToRealIndex(targetReal) {
    if (isTransitioning || targetReal === realCurrentIndex) return;
    isTransitioning = true;

    const targetExtended = targetReal + 1;
    const translateX = -targetExtended * 100;
    slidesContainer.style.transform = `translateX(${translateX}%)`;

    currentExtendedIndex = targetExtended;
    realCurrentIndex = targetReal;
    updateDots(realCurrentIndex);

    isTransitioning = false;
  }

  // Slide by direction (+1 next, -1 prev)
  async function slideByDirection(direction) {
    if (isTransitioning) return;
    isTransitioning = true;

    let newExtendedIndex = currentExtendedIndex + direction;
    const translateX = -newExtendedIndex * 100;
    slidesContainer.style.transform = `translateX(${translateX}%)`;
    currentExtendedIndex = newExtendedIndex;

    const extendedLength = totalSlides + 2;

    let needsReset = false;
    let resetTo = 0;

    if (newExtendedIndex === extendedLength - 1) { // Hit appended first (after last)
      needsReset = true;
      resetTo = 1; // Back to first real
      realCurrentIndex = 0;
    } else if (newExtendedIndex === 0) { // Hit prepended last (before first)
      needsReset = true;
      resetTo = totalSlides; // To last real
      realCurrentIndex = totalSlides - 1;
    } else {
      realCurrentIndex = (newExtendedIndex - 1 + totalSlides) % totalSlides; // Modulo for safety
    }

    updateDots(realCurrentIndex);

    if (needsReset) {
      // Wait for transition
      await new Promise((resolve) => setTimeout(resolve, 300));
      slidesContainer.style.transition = 'none';
      slidesContainer.style.transform = `translateX(${-resetTo * 100}%)`;
      currentExtendedIndex = resetTo;
      await new Promise((resolve) => setTimeout(resolve, 50));
      slidesContainer.style.transition = '';
    }

    isTransitioning = false;
    console.log(`Slid ${direction > 0 ? 'next' : 'prev'} to real ${realCurrentIndex}`); // Debug
  }

  // Arrow event listeners
  const nextBtn = block.querySelector('.product-carousel__arrow:not(.--left)');
  const prevBtn = block.querySelector('.product-carousel__arrow.--left);
  nextBtn.addEventListener('click', () => slideByDirection(1));
  prevBtn.addEventListener('click', () => slideByDirection(-1));

  // Dots: direct set
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => setToRealIndex(i));
  });

  // Keyboard
  block.setAttribute('tabindex', '0'); // Focusable
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') slideByDirection(1);
    if (e.key === 'ArrowLeft') slideByDirection(-1);
  });

  // Touch/swipe
  let startX = 0;
  let endX = 0;
  slidesContainer.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
  slidesContainer.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      slideByDirection(diff > 0 ? 1 : -1);
    }
  });

  // Autoplay
  function startAutoplay() {
    autoplayInterval = setInterval(() => slideByDirection(1), 3000);
  }
  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }
  startAutoplay();

  // Pause on hover/interaction
  block.addEventListener('mouseenter', stopAutoplay);
  block.addEventListener('mouseleave', startAutoplay);
  [nextBtn, prevBtn, ...dots].forEach(el => el.addEventListener('click', stopAutoplay)); // Pause on manual

  // Initial setup
  slidesContainer.style.transform = `translateX(${-currentExtendedIndex * 100}%)`;
  updateDots(realCurrentIndex);

  console.log('Product carousel initialized!'); // Debug
}