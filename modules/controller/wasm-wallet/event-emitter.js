// Minimal event emitter providing the legacy `EventTargetImpl` / `EventEmitter`
// surface the wallet wrapper (main thread) and worker core rely on:
// on/off/once/emit plus the DOM-style addEventListener alias the UI uses.

export class EventEmitter {
  constructor() {
    this._listeners = new Map();
  }

  init() {
    // Hook retained for subclasses that initialize on construction.
  }

  on(type, callback) {
    let handlers = this._listeners.get(type);
    if (!handlers) {
      handlers = new Set();
      this._listeners.set(type, handlers);
    }
    handlers.add(callback);
    return this;
  }

  addEventListener(type, callback) {
    return this.on(type, callback);
  }

  once(type, callback) {
    const wrapped = (data) => {
      this.off(type, wrapped);
      callback(data);
    };
    return this.on(type, wrapped);
  }

  off(type, callback) {
    const handlers = this._listeners.get(type);
    if (handlers) {
      handlers.delete(callback);
    }
    return this;
  }

  removeEventListener(type, callback) {
    return this.off(type, callback);
  }

  emit(type, data = {}) {
    const handlers = this._listeners.get(type);
    if (!handlers) {
      return;
    }
    for (const handler of [...handlers]) {
      handler(data);
    }
  }
}

// The legacy code referenced this base by a distinct name; keep the alias so
// the wrapper reads the same as the surface it replaces.
export const EventTargetImpl = EventEmitter;
