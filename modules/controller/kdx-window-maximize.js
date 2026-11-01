// Corrects the flow-caption-bar maximize/restore toggle for the frameless KDX
// controller window.
//
// flow-caption-bar tracks the maximized state in a single window._maximize flag
// driven by three nw.Window events: maximize -> true, restore -> false, and
// resize -> false. Calling win.maximize() fires a maximize event (sets the flag
// true) immediately followed by a maximize-induced resize event (clears it back
// to false), so the flag reads false right after every maximize and the
// caption's toggleMaximize() always re-takes the maximize() branch -- the
// button only ever maximizes, never restores. The nw.Window maximized-state
// getters are unreliable on this NWJS/Chromium stack (the same reason
// kdx-window-resizer.js tracks geometry itself), so this overlay derives the
// state from live geometry and keeps window._maximize accurate, leaving the
// caption bar's own toggle/icon logic to read a correct flag.

// A maximized frameless window fills the screen work-area; allow a few pixels of
// slack for window-manager insets. A restored window is smaller than the work
// area, so "fills or exceeds the work-area" cleanly separates the two states.
const MAXIMIZE_GEOMETRY_SLACK_PX = 4;

// Maximized iff the window outer size covers the screen work-area.
function isWindowMaximized(win) {
	return win.width >= window.screen.availWidth - MAXIMIZE_GEOMETRY_SLACK_PX
		&& win.height >= window.screen.availHeight - MAXIMIZE_GEOMETRY_SLACK_PX;
}

// Keep window._maximize derived from live geometry so the caption bar's
// toggleMaximize()/updateMaxIcon() (which read the flag) reflect the real state.
// The handlers are registered after the caption bar's own, so the geometry value
// wins over the maximize-induced resize that would otherwise clear the flag.
function installMaximizeFix(caption) {
	// NWJS only; a plain browser context has no nw.Window to maximize.
	// caption.window is the nw.Window the caption bar already tracks.
	if (typeof nw === 'undefined' || !nw.Window || !caption || !caption.window
		|| typeof caption.window.on !== 'function') {
		return;
	}
	const win = caption.window;

	const syncMaximizeState = () => {
		win._maximize = isWindowMaximized(win);
		if (typeof caption.updateMaxIcon === 'function') {
			caption.updateMaxIcon();
		}
	};

	win.on('maximize', syncMaximizeState);
	win.on('restore', syncMaximizeState);
	win.on('resize', syncMaximizeState);

	syncMaximizeState();
}

module.exports = { installMaximizeFix };
