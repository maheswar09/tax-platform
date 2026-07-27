import { useEffect } from 'react';

// Every modal in the app should close on Escape, not just via its own
// buttons — this is the one thing every modal needs and easy to forget.
export function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
}
