function initCurtain(gsap: any) {
  gsap.set('#page-curtain-container', { backgroundColor: 'transparent' });

  gsap.to('.curtain-stripe', {
    x: (index: number) => (index % 2 === 0 ? '100%' : '-100%'),
    duration: 1.2,
    stagger: 0.15,
    ease: 'power4.inOut',
    delay: 0.3,
  });

  gsap.fromTo(
    '.gsap-slide',
    { y: 100, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power4.out',
      delay: 0.8,
      clearProps: 'transform',
    },
  );
}

function initPageTransitions(gsap: any) {
  document.querySelectorAll('a.page-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetUrl = (link as HTMLAnchorElement).getAttribute('href');

      gsap.fromTo(
        '.curtain-stripe',
        { x: (index: number) => (index % 2 === 0 ? '100%' : '-100%') },
        {
          x: '0%',
          duration: 0.6,
          stagger: 0.1,
          ease: 'power4.inOut',
          onComplete: () => {
            window.location.href = targetUrl!;
          },
        },
      );
    });
  });
}

export { initCurtain, initPageTransitions };
