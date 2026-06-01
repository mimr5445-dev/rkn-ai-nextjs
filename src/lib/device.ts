import type { DeviceMetrics } from '@/types';

export function readDeviceMetrics(): DeviceMetrics {
  if (typeof window === 'undefined') {
    return {
      innerWidth: 390,
      innerHeight: 844,
      screenWidth: 390,
      screenHeight: 844,
      devicePixelRatio: 1,
      isMobile: true
    };
  }

  const metrics = {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    isMobile: window.innerWidth < 768
  };

  document.documentElement.style.setProperty('--app-width', `${metrics.innerWidth}px`);
  document.documentElement.style.setProperty('--app-height', `${metrics.innerHeight}px`);
  document.documentElement.style.setProperty('--screen-width', `${metrics.screenWidth}px`);
  document.documentElement.style.setProperty('--screen-height', `${metrics.screenHeight}px`);
  document.documentElement.style.setProperty('--device-pixel-ratio', `${metrics.devicePixelRatio}`);

  return metrics;
}

export function lockViewport() {
  if (typeof window === 'undefined') return;
  const apply = () => readDeviceMetrics();
  apply();
  window.addEventListener('resize', apply, { passive: true });
  window.addEventListener('orientationchange', apply, { passive: true });

  const preventGesture = (event: Event) => event.preventDefault();
  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend', preventGesture, { passive: false });

  let lastTouchEnd = 0;
  const preventDoubleTapZoom = (event: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
  };
  document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

  return () => {
    window.removeEventListener('resize', apply);
    window.removeEventListener('orientationchange', apply);
    document.removeEventListener('gesturestart', preventGesture);
    document.removeEventListener('gesturechange', preventGesture);
    document.removeEventListener('gestureend', preventGesture);
    document.removeEventListener('touchend', preventDoubleTapZoom);
  };
}
