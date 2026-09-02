export default class Keyboard {
  private constructor() {}

  private static keysDown: Record<string, boolean> = {};
  private static keysDownPrev: Record<string, boolean> = {};

  static handleKeyDown = (e: KeyboardEvent) => {
    this.keysDown[e.key.toLowerCase()] = true;
    this.keysDown[e.code.toLowerCase()] = true;
  };

  static handleKeyUp = (e: KeyboardEvent) => {
    this.keysDown[e.key.toLowerCase()] = false;
    this.keysDown[e.code.toLowerCase()] = false;
  };

  static update() {
    this.keysDownPrev = { ...this.keysDown };
  }

  static isDown(...keyOrCode: string[]): boolean {
    return keyOrCode.some((k) => this.keysDown[k]);
  }

  static wasPressed(...keyOrCode: string[]) {
    return keyOrCode.some((k) => {
      const key = k.toLowerCase();
      return this.keysDown[key] && !this.keysDownPrev[key];
    });
  }

  static wasReleased(...keyOrCode: string[]): boolean {
    return keyOrCode.some((k) => {
      const key = k.toLowerCase();
      return !this.keysDown[key] && this.keysDownPrev[key];
    });
  }
}
