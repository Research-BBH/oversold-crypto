import { useState, useEffect, useRef } from 'react';

export function ScrollableRow({ children, darkMode, className = '' }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function checkScroll() {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowLeft(scrollLeft > 10);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
    }

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    const timeout = setTimeout(checkScroll, 100);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timeout);
    };
  }, []);

  const isHiddenSm = className.includes('hidden') && className.includes('sm:flex');
  const wrapperClass = isHiddenSm ? 'relative flex-1 min-w-0 hidden sm:block' : 'relative flex-1 min-w-0';
  const innerClass = className.replace('hidden', '').replace('sm:flex', '').trim();

  const leftGradient = darkMode
    ? 'linear-gradient(to right, rgb(10, 10, 15) 0%, transparent 100%)'
    : 'linear-gradient(to right, rgb(243, 244, 246) 0%, transparent 100%)';

  const rightGradient = darkMode
    ? 'linear-gradient(to left, rgb(10, 10, 15) 0%, transparent 100%)'
    : 'linear-gradient(to left, rgb(243, 244, 246) 0%, transparent 100%)';

  return (
    <div className={wrapperClass}>
      <div
        className={`absolute left-0 top-0 bottom-1 w-8 pointer-events-none z-10 transition-opacity duration-200 ${showLeft ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: leftGradient }}
      />
      <div
        ref={scrollRef}
        className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${innerClass}`}
      >
        {children}
      </div>
      <div
        className={`absolute right-0 top-0 bottom-1 w-8 pointer-events-none z-10 transition-opacity duration-200 ${showRight ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: rightGradient }}
      />
    </div>
  );
}
