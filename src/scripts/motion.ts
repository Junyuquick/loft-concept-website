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
  });
}

document.addEventListener('astro:page-load', () => {
  initReveal();
  initVideos();
});
