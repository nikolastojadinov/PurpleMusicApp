import React, { useState, useRef, useLayoutEffect } from 'react';

/**
 * PlaylistTitle component
 * - Truncates to 60 chars + ellipsis
 * - Multi-word wraps into max 3 lines (word boundaries)
 * - Single long word shrinks font size to fit width
 * - Responsive base font size
 */
export default function PlaylistTitle({ title, maxChars = 60, className = '' }) {
  const containerRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [fontSize, setFontSize] = useState(null);

  let safe = (title || '').trim();
  if (safe.length > maxChars) safe = safe.slice(0, maxChars - 3) + '...';
  const words = safe.split(/\s+/).filter(Boolean);
  const isSingleWord = words.length <= 1;

  useLayoutEffect(() => {
    function compute() {
      const el = containerRef.current;
      if (!el) return;
      const width = el.clientWidth || 0;
      if (!width) return;

      let baseFont = width < 340 ? 28 : width < 480 ? 34 : 40;
      baseFont = Math.min(baseFont, 44);

      if (isSingleWord) {
        const word = words[0] || '';
        let testFont = baseFont;
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx) return;
        while (testFont > 14) {
          ctx.font = `700 ${testFont}px system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,sans-serif`;
          if (ctx.measureText(word).width <= width * 0.98) break;
          testFont -= 1;
        }
        setFontSize(testFont);
        setLines([word]);
        return;
      }

      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return;
      ctx.font = `700 ${baseFont}px system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,sans-serif`;

      const newLines = [];
      let current = [];
      const measure = arr => ctx.measureText(arr.join(' ')).width;

      for (let i = 0; i < words.length; i++) {
        current.push(words[i]);
        if (measure(current) > width * 0.98) {
          if (current.length === 1) {
            // treat as oversized single word
            let testFont = baseFont;
            while (testFont > 14) {
              ctx.font = `700 ${testFont}px system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,sans-serif`;
              if (ctx.measureText(current[0]).width <= width * 0.98) break;
              testFont -= 1;
            }
            setFontSize(testFont);
            setLines([current[0]]);
            return;
          }
          const last = current.pop();
          newLines.push(current.join(' '));
          current = [last];
          if (newLines.length === 2) {
            // Construct 3rd line with remaining words
            const remaining = [last, ...words.slice(i + 1)];
            let acc = [];
            for (const w of remaining) {
              acc.push(w);
              if (measure(acc) > width * 0.98) {
                acc.pop();
                let finalText = acc.join(' ');
                if (!finalText) finalText = w.slice(0, 6) + '…';
                else finalText += '…';
                newLines.push(finalText);
                setLines(newLines);
                setFontSize(baseFont);
                return;
              }
            }
            newLines.push(acc.join(' '));
            setLines(newLines);
            setFontSize(baseFont);
            return;
          }
        }
      }
      if (current.length) newLines.push(current.join(' '));
      setLines(newLines);
      setFontSize(baseFont);
    }

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [safe]);

  return (
    <div ref={containerRef} className={`playlist-title-wrapper ${className}`}>
      <div className="playlist-title" style={{ fontSize: fontSize ? fontSize + 'px' : undefined }}>
        {lines.map((l, i) => (
          <div key={i} className="playlist-title-line">{l}</div>
        ))}
      </div>
    </div>
  );
}
