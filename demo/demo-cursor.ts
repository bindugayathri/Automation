/**
 * Draws a visible mouse pointer and a click ripple inside the page, so viewers (and the
 * recorded video) can see where the automation moves and clicks. Playwright sends real
 * mouse events but has no visible cursor, so this listens to those events and draws one.
 *
 * Passed to page.addInitScript(), so it runs in the browser on every page load.
 */
export function installDemoCursor() {
  if (window !== window.top) return;

  const GLIDE_MS = 250;
  const STORAGE_KEY = '__demoCursorPosition';

  const install = () => {
    const style = document.createElement('style');
    style.textContent = `
      #__demo-cursor {
        position: fixed; top: 0; left: 0; z-index: 2147483647; pointer-events: none;
        width: 32px; height: 32px; margin: -3px 0 0 -4px;
        transition: transform ${GLIDE_MS}ms ease-in-out;
        filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4));
      }
      #__demo-cursor.pressed svg { transform: scale(0.85); }
      #__demo-cursor svg { transition: transform 120ms ease; transform-origin: 4px 3px; }
      .__demo-ripple {
        position: fixed; z-index: 2147483646; pointer-events: none;
        width: 16px; height: 16px; margin: -8px 0 0 -8px; border-radius: 50%;
        border: 4px solid rgba(229, 57, 53, 0.95); background: rgba(229, 57, 53, 0.25);
        animation: __demo-ripple 900ms ease-out forwards;
      }
      @keyframes __demo-ripple {
        from { transform: scale(1); opacity: 1; }
        to { transform: scale(5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    const cursor = document.createElement('div');
    cursor.id = '__demo-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 32 32">
        <path d="M4 3 L4 25 L10 19.5 L14 28.5 L18 26.8 L14 18 L22 18 Z"
              fill="#111" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
      </svg>`;
    document.body.appendChild(cursor);

    const moveTo = (x: number, y: number) => {
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
    };

    // Start where the last page left off (no glide), or in the middle of the screen.
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    cursor.style.transition = 'none';
    moveTo(saved?.x ?? window.innerWidth / 2, saved?.y ?? window.innerHeight / 2);
    requestAnimationFrame(() => (cursor.style.transition = ''));

    document.addEventListener('mousemove', (e) => moveTo(e.clientX, e.clientY), true);

    document.addEventListener(
      'mousedown',
      (e) => {
        cursor.classList.add('pressed');
        const ripple = document.createElement('div');
        ripple.className = '__demo-ripple';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      },
      true,
    );
    document.addEventListener('mouseup', () => cursor.classList.remove('pressed'), true);
  };

  if (document.body) install();
  else document.addEventListener('DOMContentLoaded', install);
}
