import { useEffect, useState, useRef } from 'react';

export const useRfidReader = (onRead: (rfid: string) => void) => {
  const [buffer, setBuffer] = useState('');
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is manually typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      const currentTime = Date.now();
      
      // If time between keystrokes is too long (> 100ms), it's probably scattered typing
      // Reset buffer to prevent accumulating random keystrokes
      if (currentTime - lastKeyTime.current > 100) {
        setBuffer('');
      }
      
      lastKeyTime.current = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length > 3) {
          // Fire event
          onRead(buffer);
          setBuffer('');
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        setBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buffer, onRead]);

  return null;
};
