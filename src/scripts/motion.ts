const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveal() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)');
  if (reduced() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
  );
  targets.forEach((el) => observer.observe(el));
}

function initVideos() {
  if (!reduced()) return;
  document.querySelectorAll<HTMLVideoElement>('video[data-ambient]').forEach((video) => {
    video.pause();
    video.removeAttribute('autoplay');
    // A hero that tells a story should rest on its last frame, not its first.
    if (video.hasAttribute('data-end-still')) {
      const seekToEnd = () => { video.currentTime = video.duration; };
      if (video.readyState >= 1) seekToEnd();
      else video.addEventListener('loadedmetadata', seekToEnd, { once: true });
    }
  });
}

// The router restores your scroll position with a plain scrollTo(), which html's
// scroll-behavior: smooth turns into a visible scroll from the top. Jump instead.
document.addEventListener('astro:before-swap', (event) => {
  event.newDocument.documentElement.style.scrollBehavior = 'auto';
});

document.addEventListener('astro:page-load', () => {
  document.documentElement.style.removeProperty('scroll-behavior');
  initReveal();
  initVideos();
});
