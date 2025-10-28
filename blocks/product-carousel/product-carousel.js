// product-carousel.js
// eslint-disable-next-line import/no-cycle
import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Initializes the product carousel block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Extract title and slides from block rows
  const rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length < 2) return; // Need title + at least 1 slide

  const titleRow = rows[0];
  const titleCell = titleRow.querySelector('div');
  const title = titleCell ? titleCell.innerHTML.trim() : 'Discover Our Products';
  titleCell.innerHTML = `<h2 class="product-carousel__title">${title}</h2>`;

  // Build slides array
  const slides = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const cells = [...row.querySelectorAll('div')];
    if (cells.length >= 3) {
      const imgCell = cells[0];
      const titleCellSlide = cells[1];
      const descCell = cells[2];

      // Optimize image
      const img = imgCell.querySelector('img');
      if (img) {
        const alt = img.alt || 'Product Image';
        const src = img.src;
        imgCell.innerHTML = '';
        imgCell.appendChild(createOptimizedPicture(src, alt, false, [
          { media: '(min-width: 900px)', width: '400' },
          { width: '300' },
        ]));
      }

      slides.push({
        image: imgCell.innerHTML,
        title: titleCellSlide.innerHTML,
        description: descCell.innerHTML,
      });
    }
  }

  if (slides.length < 1) return;

  // Build DOM structure
  const slidesContainer = document.createElement('div');
  slidesContainer.className = 'product-carousel__slides';
  slidesContainer.setAttribute('role', 'list');
  slidesContainer.setAttribute('aria-label', 'Product carousel');

  // Clone slides for infinite loop (first at end, last at start)
  const totalSlides = slides.length;
  const extendedSlides = [...slides, slides[0]]; // Append first for loop
  extendedSlides.forEach((slide, index) => {
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
  block.className = 'product-carousel';
  block.innerHTML = '';
  block.appendChild(titleCell);
  block.appendChild(slidesContainer);
  block.appendChild(nav);
  block.appendChild(dotsContainer);

  // State
  let currentIndex = 0;
  let isTransitioning = false;
  let autoplayInterval;

  // Update dots
  function updateDots() {
    dots.forEach((dot, i) => {
      dot.setAttribute('aria-selected', i === currentIndex);
      dot.classList.toggle('product-carousel__dot--active', i === currentIndex);
    });
  }

  // Slide to index
  async function slideTo(index) {
    if (isTransitioning || index === currentIndex) return;
    isTransitioning = true;

    const translateX = -index * 100;
    slidesContainer.style.transform = `translateX(${translateX}%)`;

    // Handle infinite loop: reset to 0 after last slide
    if (index === totalSlides) {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Wait for transition
      currentIndex = 0;
      slidesContainer.style.transition = 'none';
      slidesContainer.style.transform = `translateX(0%)`;
      await new Promise((resolve) => setTimeout(resolve, 50));
      slidesContainer.style.transition = '';
    } else {
      currentIndex = index;
    }

    updateDots();
    isTransitioning = false;
  }

  // Arrow event listeners
  const nextBtn = block.querySelector('.product-carousel__arrow:not(.--left)');
  const prevBtn = block.querySelector('.product-carousel__arrow.--left');

  nextBtn.addEventListener('click', () => slideTo(currentIndex + 1));
  prevBtn.addEventListener('click', () => slideTo(currentIndex - 1 || totalSlides));

  // Dots event listeners
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => slideTo(i));
  });

  // Keyboard navigation
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') slideTo(currentIndex + 1);
    if (e.key === 'ArrowLeft') slideTo(currentIndex - 1 || totalSlides);
  });

  // Touch/swipe support
  let startX = 0;
  let endX = 0;
  slidesContainer.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  });
  slidesContainer.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) { // Threshold for swipe
      if (diff > 0) slideTo(currentIndex + 1);
      else slideTo(currentIndex - 1 || totalSlides);
    }
  });

  // Autoplay (default 3s)
  function startAutoplay() {
    autoplayInterval = setInterval(() => slideTo(currentIndex + 1), 3000);
  }
  startAutoplay();

  // Pause on hover
  block.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
  block.addEventListener('mouseleave', startAutoplay);

  // Initial setup
  updateDots();
}