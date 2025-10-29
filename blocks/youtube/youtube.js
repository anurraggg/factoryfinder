/**
 * Extracts YouTube video ID from a URL.
 * Supports: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
 * @param {string} url - The YouTube URL
 * @returns {string|null} Video ID or null if invalid
 */
 function getYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
  
  export default async function decorate(block) {
    // Find the first child div (table cell content)
    const cell = block.querySelector(':scope > div > div');
    if (!cell) return;
  
    // Extract URL from link or text
    let url = '';
    const link = cell.querySelector('a');
    if (link) {
      url = link.href;
    } else {
      url = cell.textContent.trim();
    }
  
    // Clean URL (strip extra params)
    url = url.split('?')[0].split('#')[0];
  
    // Get video ID
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
      // Fallback UI for invalid URL
      block.innerHTML = '<div class="youtube-fallback">Invalid YouTube URL. Please check the link.</div>';
      return;
    }
  
    // Clear block content
    block.innerHTML = '';
  
    // Create container
    const container = document.createElement('div');
    container.className = 'youtube-container';
  
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`; // rel=0 hides related videos
    iframe.title = 'YouTube video player';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.loading = 'lazy'; // Performance: defer offscreen loads
    iframe.setAttribute('aria-label', 'Embedded YouTube video');
  
    // Append iframe to container, container to block
    container.appendChild(iframe);
    block.appendChild(container);
  
    // Optional: Load eagerly if above-fold (integrate with Helix LCP if needed)
    if (block.getBoundingClientRect().top < window.innerHeight) {
      iframe.loading = 'eager';
    }
  }