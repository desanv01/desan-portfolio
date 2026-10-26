'use client';
import { useEffect, useRef } from 'react';
import { dimension } from '@/design/runtime-serialize';
import { usePublicDesignRuntime } from './design-context';

/** Browser-only motion is scoped to validated design values; content stays visible without JS. */
export function DesignEffects() {
  const marker = useRef<HTMLSpanElement>(null);
  const runtime = usePublicDesignRuntime();
  useEffect(() => {
    const root = marker.current?.closest('.public-surface');
    if (!root) return;
    const cleanups: (() => void)[] = [];
    for (const element of root.querySelectorAll<HTMLElement>(
      '[data-design-node]',
    )) {
      const binding = runtime.binding(element.dataset.designNode || '');
      if (!binding) continue;
      const values = binding.behavior;
      const kind = values['motion.kind'];
      if (!kind || kind === 'none' || runtime.reducedMotion) continue;
      const intensity = values['motion.intensity'];
      const amount =
        intensity && typeof intensity === 'object' && !Array.isArray(intensity)
          ? intensity
          : {};
      const start: Keyframe =
        kind === 'fade'
          ? {
              opacity:
                typeof amount.opacity === 'number' ? amount.opacity : 0.5,
            }
          : kind === 'translate'
            ? {
                transform: `translateY(${amount.distance ? dimension(amount.distance) : '12px'})`,
              }
            : kind === 'scale'
              ? {
                  transform: `scale(${typeof amount.scale === 'number' ? amount.scale : 0.97})`,
                }
              : kind === 'rotate'
                ? {
                    transform: `rotate(${typeof amount.rotate === 'number' ? amount.rotate : 2}deg)`,
                  }
                : { clipPath: 'inset(0 0 12% 0)' };
      const final: Keyframe = {
        opacity: 1,
        transform: 'none',
        clipPath: 'inset(0)',
      };
      const millis = (value: unknown, fallback: number) => {
        if (!value || typeof value !== 'object') return fallback;
        const time = value as { value?: number; unit?: string };
        return typeof time.value === 'number'
          ? time.value * (time.unit === 's' ? 1000 : 1)
          : fallback;
      };
      const repeat = values['motion.repeat'];
      const ease = values['motion.easing'];
      const curve =
        ease && typeof ease === 'object' && !Array.isArray(ease)
          ? ease
          : undefined;
      const easing =
        typeof ease === 'string'
          ? ease
          : curve
            ? `cubic-bezier(${curve.x1}, ${curve.y1}, ${curve.x2}, ${curve.y2})`
            : 'ease';
      let animation: Animation | undefined;
      const play = () => {
        animation?.cancel();
        animation = element.animate([start, final], {
          duration: millis(values['motion.duration'], 150),
          delay: millis(values['motion.delay'], 0),
          easing,
          iterations:
            repeat === 'loop'
              ? Infinity
              : typeof repeat === 'number'
                ? repeat
                : 1,
        });
      };
      const reverse = () => {
        if (animation && animation.playState !== 'finished')
          animation.reverse();
        else animation?.cancel();
      };
      const trigger = values['motion.trigger'] || 'enter';
      if (trigger === 'hover' || trigger === 'focus') {
        const begin = trigger === 'hover' ? 'pointerenter' : 'focusin';
        const end = trigger === 'hover' ? 'pointerleave' : 'focusout';
        element.addEventListener(begin, play);
        element.addEventListener(end, reverse);
        cleanups.push(() => {
          element.removeEventListener(begin, play);
          element.removeEventListener(end, reverse);
        });
      } else if (trigger === 'toggle') {
        element.addEventListener('toggle', play, true);
        cleanups.push(() => element.removeEventListener('toggle', play, true));
      } else {
        let seen = false;
        const observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting && (!seen || trigger === 'scroll')) {
                play();
                seen = true;
              } else if (!entry.isIntersecting) animation?.cancel();
            }
          },
          { threshold: 0.1 },
        );
        observer.observe(element);
        cleanups.push(() => observer.disconnect());
      }
      cleanups.push(() => animation?.cancel());
    }
    (root as HTMLElement).dataset.designReady = 'true';
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      delete (root as HTMLElement).dataset.designReady;
    };
  }, [runtime]);
  return <span ref={marker} hidden />;
}
