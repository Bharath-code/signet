'use client';
import { useEffect, useRef } from 'react';

type Opts = {
  play: boolean;
  loops?: number;       // stop after N iterations of `anim`; omit = loop while playing
  anim?: string;        // keyframe name whose iterations are counted
  startOnView?: boolean; // wait until the stage is first visible
  threshold?: number;
  onDone?: () => void;  // fires when the loop cap is reached
};

// Drives the CSS-only stages in motion.css. `.run` turns the keyframes on and
// `.paused` freezes them off-screen. The CSS default of every stage is its final
// frame, so removing `.run` (loop cap, reduced motion, play=false) lands there.
export function useStage<T extends Element>({ play, loops, anim, startOnView, threshold = 0.1, onDone }: Opts) {
  const ref = useRef<T>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const el = ref.current;
    if (!el || !play || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let n = 0;
    let started = false;
    const start = () => {
      started = true;
      el.classList.remove('run');
      void el.getBoundingClientRect();
      el.classList.add('run');
    };
    const onIter = (e: Event) => {
      if (loops && (e as AnimationEvent).animationName === anim && ++n >= loops) {
        el.classList.remove('run');
        done.current?.();
      }
    };
    // A batch can hold several entries after a fast scroll; the last is current.
    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      if (startOnView && !started && e.intersectionRatio >= threshold) start();
      el.classList.toggle('paused', !e.isIntersecting);
    }, { threshold: [0, threshold] }); // 0 catches the true enter/leave edge

    if (!startOnView) start();
    el.addEventListener('animationiteration', onIter);
    io.observe(el);
    return () => {
      el.removeEventListener('animationiteration', onIter);
      io.disconnect();
      el.classList.remove('run', 'paused');
    };
  }, [play, loops, anim, startOnView, threshold]);

  return ref;
}
