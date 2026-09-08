declare const window: Window & { debug: any };
window.debug ??= {};

export default window.debug;
