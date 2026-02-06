/**
 * Force strict zoom levels on Desktop/Tablet
 * Prevents:
 * 1. Ctrl + Scroll
 * 2. Ctrl + Key (+, -, 0)
 * 3. Pinch-zoom on touch screens (via event prevention)
 */

(function () {
    // 1. Prevent Keyboard Zoom (Ctrl + '+', '-', '0')
    document.addEventListener("keydown", function (e) {
        if (e.ctrlKey && (
            e.key === "+" ||
            e.key === "-" ||
            e.key === "=" ||
            e.key === "0" ||
            e.keyCode === 187 || // +
            e.keyCode === 189 || // -
            e.keyCode === 107 || // Numpad +
            e.keyCode === 109 || // Numpad -
            e.keyCode === 96     // Numpad 0
        )) {
            e.preventDefault();
        }
    }, { passive: false });

    // 2. Prevent Mouse Wheel Zoom (Ctrl + Wheel)
    document.addEventListener("wheel", function (e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // 3. Prevent Touch Pinch Zoom
    // Mobile zooming is now ALLOWED per user request.
    // The previous touch/gesture prevention code has been removed.

    // 4. Force Visual Reset on Window Resize (Optional/Aggressive)
    /* 
       Some browsers retain zoom level on reload. 
       We can't programmatically reset browser zoom for security reasons.
       However, we can warn or try to adjust CSS zoom (discouraged).
       For now, we stick to preventing the Action of zooming.
    */

})();
