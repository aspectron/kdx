// Custom edge/corner resize grips for the frameless KDX controller window.
//
// The controller window is frameless (nw-app.js frame:false) to preserve the
// flow-caption-bar custom chrome. The runtime keeps only a thin native resize
// border on a frameless window, and that border works only through a window
// manager. This overlay adds eight transparent grip regions (4 edges + 4
// corners) that drive nw.Window resizeTo/moveTo directly, so resizing works
// with or without a window manager. The caption bar keeps owning window move
// (-webkit-app-region: drag) and the min/maximize/close buttons; the grips are
// marked no-drag, so the two gestures never conflict. The controls that sit
// against the window edges are laid out clear of the grips, so a grip never
// covers a control.

// The runtime claims the outermost pixels of a resizable frameless window as
// that native border: a press there is handed to the window manager as a
// move-resize request and never reaches the page. The grips start just inside
// it, so every grip pixel receives pointer input.
const NATIVE_RESIZE_BORDER_PX = 5;

// Grip geometry (px): thin edge strips and slightly larger corner squares.
const EDGE_THICKNESS_PX = 6;
const CORNER_SIZE_PX = 14;

// Depth of the resize band along each side (native border plus edge strip), and
// how far a corner grip reaches from the window edge along each side.
const RESIZE_BAND_PX = NATIVE_RESIZE_BORDER_PX + EDGE_THICKNESS_PX;
const CORNER_EXTENT_PX = NATIVE_RESIZE_BORDER_PX + CORNER_SIZE_PX;

// The wallet sizes its right column from the viewport height less a fixed
// allowance for the window chrome above and below it: the default of
// --kaspa-wallet-right-area-height in kaspa-wallet-desktop (@kaspa/ux).
const WALLET_CHROME_ALLOWANCE_PX = 122;

// Stacking order for the grips: just below the max int32 so they sit above all
// app content while leaving the very top slot free for any true-topmost overlay.
const GRIP_Z_INDEX = 2147483646;

// Minimum window size so a grip can never collapse the window.
const MIN_WIDTH_PX = 640;
const MIN_HEIGHT_PX = 480;

// Eight grip regions. Each names the edges it drags and its resize cursor; the
// CSS positions come from the same edge flags so the table stays single-source.
const REGIONS = [
	{ id: 'n', cursor: 'n-resize', top: true },
	{ id: 's', cursor: 's-resize', bottom: true },
	{ id: 'w', cursor: 'w-resize', left: true },
	{ id: 'e', cursor: 'e-resize', right: true },
	{ id: 'nw', cursor: 'nw-resize', top: true, left: true },
	{ id: 'ne', cursor: 'ne-resize', top: true, right: true },
	{ id: 'sw', cursor: 'sw-resize', bottom: true, left: true },
	{ id: 'se', cursor: 'se-resize', bottom: true, right: true }
];

// Position a grip element from its edge flags, inside the native resize border:
// corners are squares pinned to two sides; edges are strips inset by a corner on
// each end so they do not overlap the corner grips.
function applyGripGeometry(el, region) {
	const isCorner = (region.top || region.bottom) && (region.left || region.right);
	const border = `${NATIVE_RESIZE_BORDER_PX}px`;
	const pastCorner = `${CORNER_EXTENT_PX}px`;
	el.style.position = 'fixed';
	el.style.zIndex = String(GRIP_Z_INDEX);
	el.style.background = 'transparent';
	el.style.cursor = region.cursor;
	// NWJS: keep grips out of the caption's move-drag region.
	el.style['-webkit-app-region'] = 'no-drag';

	if (isCorner) {
		el.style.width = `${CORNER_SIZE_PX}px`;
		el.style.height = `${CORNER_SIZE_PX}px`;
		el.style.top = region.top ? border : '';
		el.style.bottom = region.bottom ? border : '';
		el.style.left = region.left ? border : '';
		el.style.right = region.right ? border : '';
		return;
	}

	if (region.top || region.bottom) {
		// Horizontal edge strip across the top/bottom, inset by the corners.
		el.style.height = `${EDGE_THICKNESS_PX}px`;
		el.style.left = pastCorner;
		el.style.right = pastCorner;
		el.style.top = region.top ? border : '';
		el.style.bottom = region.bottom ? border : '';
	} else {
		// Vertical edge strip down the left/right, inset by the corners.
		el.style.width = `${EDGE_THICKNESS_PX}px`;
		el.style.top = pastCorner;
		el.style.bottom = pastCorner;
		el.style.left = region.left ? border : '';
		el.style.right = region.right ? border : '';
	}
}

// Resize (and, for top/left edges, move) the window from a pointer delta,
// anchored on the geometry snapshot taken at pointerdown. The opposite edge is
// held fixed (newOrigin = startOrigin + (startSize - newSize)) so clamping at
// the minimum size never makes the window jump.
function resizeFromDelta(win, region, anchor, dx, dy) {
	let width = anchor.width;
	let height = anchor.height;
	let x = anchor.x;
	let y = anchor.y;

	if (region.right) {
		width = Math.max(MIN_WIDTH_PX, anchor.width + dx);
	}
	if (region.left) {
		width = Math.max(MIN_WIDTH_PX, anchor.width - dx);
		x = anchor.x + (anchor.width - width);
	}
	if (region.bottom) {
		height = Math.max(MIN_HEIGHT_PX, anchor.height + dy);
	}
	if (region.top) {
		height = Math.max(MIN_HEIGHT_PX, anchor.height - dy);
		y = anchor.y + (anchor.height - height);
	}

	win.resizeTo(width, height);
	if (region.left || region.top) {
		win.moveTo(x, y);
	}
}

function attachGrip(win, el, region) {
	let anchor = null;

	el.addEventListener('pointerdown', (event) => {
		if (event.button !== 0) {
			return;
		}
		// Snapshot the pointer (screen coords survive the window moving) and the
		// window geometry; capture so moves outside the grip still arrive.
		anchor = {
			startX: event.screenX,
			startY: event.screenY,
			width: win.width,
			height: win.height,
			x: win.x,
			y: win.y
		};
		el.setPointerCapture(event.pointerId);
		event.preventDefault();
	});

	el.addEventListener('pointermove', (event) => {
		if (!anchor) {
			return;
		}
		resizeFromDelta(win, region, anchor, event.screenX - anchor.startX, event.screenY - anchor.startY);
	});

	const end = (event) => {
		if (!anchor) {
			return;
		}
		anchor = null;
		try {
			el.releasePointerCapture(event.pointerId);
		} catch (e) {
			// Capture may already be released if the pointer left the surface.
		}
	};
	el.addEventListener('pointerup', end);
	el.addEventListener('pointercancel', end);
}

// Lay the edge-adjacent controls out clear of the grips. The caption bar starts
// below the top resize band and ends before the top-right corner grip, so its
// tabs and window buttons stay whole; its own width variables follow the padding
// so it still spans the window. The tab pages keep a transparent border on the
// left, right and bottom, so their content and scroll bars sit inboard of the
// edge grips; the bottom border reaches past the bottom corner grips, where
// the scroll bars end. The wallet's right column gives up the height that
// the caption padding and the bottom border add, so the wallet page still
// fits the window.
function installControlClearance() {
	const addedChromePx = RESIZE_BAND_PX + CORNER_EXTENT_PX;
	const style = document.createElement('style');
	style.id = 'kdx-window-resizer-clearance';
	style.textContent = `
flow-caption-bar {
	padding-top: ${RESIZE_BAND_PX}px;
	padding-right: ${CORNER_EXTENT_PX}px;
	--flow-caption-bar-width: auto;
	--flow-caption-bar-host-width: auto;
}
tab-content {
	border: 0 solid transparent;
	border-width: 0 ${RESIZE_BAND_PX}px ${CORNER_EXTENT_PX}px;
	--kaspa-wallet-right-area-height: calc(100vh - ${WALLET_CHROME_ALLOWANCE_PX + addedChromePx}px);
}`;
	document.head.appendChild(style);
}

function installResizeGrips() {
	// NWJS only; a plain browser context has no nw.Window to resize.
	if (typeof nw === 'undefined' || !nw.Window || !nw.Window.get()) {
		return;
	}
	if (document.getElementById('kdx-window-resizer')) {
		return;
	}
	const win = nw.Window.get();
	const container = document.createElement('div');
	container.id = 'kdx-window-resizer';

	REGIONS.forEach((region) => {
		const grip = document.createElement('div');
		grip.className = `kdx-resize-grip kdx-resize-grip-${region.id}`;
		applyGripGeometry(grip, region);
		attachGrip(win, grip, region);
		container.appendChild(grip);
	});

	document.body.appendChild(container);
	installControlClearance();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', installResizeGrips, { once: true });
} else {
	installResizeGrips();
}
