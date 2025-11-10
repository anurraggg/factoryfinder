export default function decorate(block) {
  console.log('✅ Product Carousel JS loaded!');

  block.classList.add('product-carousel');

  // Detect table OR fallback to plain content
  let rows = [];
  const table = block.querySelector('table, div > table');

  if (table) {
    console.log('📋 Found table inside block');
    rows = table.querySelectorAll('tr');
  } else {
    console.log('🧩 No table found — falling back to plain HTML parsing');

    // Fallback parser: assume images + titles + descriptions in sequence
    const images = [...block.querySelectorAll('img')];
    const paragraphs = [...block.querySelectorAll('p')].map(p => p.innerText.trim()).filter(Boolean);

    // Group by image + next two text nodes (title + desc)
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const title = paragraphs[i * 2] || '';
      const desc = paragraphs[i * 2 + 1] || '';
      rows.push({ img, title, desc });
    }
  }

  const slides = [];

  // If rows came from table
  if (table) {
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const firstCell = cells[0].innerText.trim().toLowerCase();
        if (firstCell === 'product carousel' || index === 0) return;

        let imgSrc = '';
        const imgEl = cells[0].querySelector('img');
        if (imgEl) imgSrc = imgEl.src;
        else if (cells[0].innerText.match(/^https?:\/\//)) imgSrc = cells[0].innerText.trim();

        slides.push({
          image: imgSrc,
          title: cells[1].innerText.trim(),
          description: cells[2].innerText.trim(),
        });
      }
    });
  } else {
    // If rows came from fallback
    rows.forEach((r) => {
      slides.push({
        image: r.img.src,
        title: r.title,
        description: r.desc,
      });
    });
  }

  console.log('Slides found:', slides);
  if (slides.length === 0) {
    console.warn('⚠️ Still no slides found!');
    return;
  }

  // build wrapper (same as before)
  const wrapper = document.createElement('div');
  wrapper.className = 'product-carousel__wrapper';
  slides.forEach((slide, i) => {
    const slideEl = document.createElement('div');
    slideEl.className = 'product-carousel__slide';
    if (i === 0) slideEl.classList.add('active');

    const left = document.createElement('div');
    left.className = 'product-carousel__left';
    const img = document.createElement('img');
    img.src = slide.image;
    img.alt = slide.title || 'Product image';
    left.appendChild(img);

    const right = document.createElement('div');
    right.className = 'product-carousel__right';
    right.innerHTML = `<h3>${slide.title}</h3><p>${slide.description}</p>`;

    slideEl.append(left, right);
    wrapper.append(slideEl);
  });

  block.innerHTML = '';
  block.append(wrapper);

  // Add buttons + dots (same as before)
  const prevBtn = document.createElement('button');
  prevBtn.className = 'product-carousel__nav product-carousel__prev';
  prevBtn.innerHTML = '←';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'product-carousel__nav product-carousel__next';
  nextBtn.innerHTML = '→';

  const dots = document.createElement('div');
  dots.className = 'product-carousel__dots';
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'product-carousel__dot';
    if (i === 0) dot.classList.add('active');
    dots.append(dot);
  });

  block.append(prevBtn, nextBtn, dots);

  // Carousel logic
  let current = 0;
  const allSlides = block.querySelectorAll('.product-carousel__slide');
  const allDots = block.querySelectorAll('.product-carousel__dot');

  function showSlide(index) {
    allSlides.forEach(s => s.classList.remove('active'));
    allDots.forEach(d => d.classList.remove('active'));
    allSlides[index].classList.add('active');
    allDots[index].classList.add('active');
  }

  prevBtn.addEventListener('click', () => {
    current = (current - 1 + slides.length) % slides.length;
    showSlide(current);
  });

  nextBtn.addEventListener('click', () => {
    current = (current + 1) % slides.length;
    showSlide(current);
  });

  allDots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      current = i;
      showSlide(i);
    });
  });
}
