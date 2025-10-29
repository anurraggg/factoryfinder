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
  
  export default function decorate(block) {
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
  
    // Get video ID
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
      console.warn('Invalid YouTube URL in block:', url);
      return;
    }
  
    // Clear block content
    block.innerHTML = '';
  
    // Create container
    const container = document.createElement('div');
    container.className = 'youtube-container';
  
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.title = 'YouTube video player';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  
    // Append iframe to container, container to block
    container.appendChild(iframe);
    block.appendChild(container);
  }