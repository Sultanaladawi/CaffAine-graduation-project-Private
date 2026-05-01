import { useEffect, useRef, useState } from 'react';

export function useReveal(delay = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const timer = setTimeout(() => {
          setVisible(true);
        }, delay);

        obs.unobserve(el);

        return () => clearTimeout(timer);
      }
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    obs.observe(el);

    return () => obs.disconnect();
  }, [delay]);

  return [ref, visible];
}