interface CameraState {
  x: number;
  y: number;
  zoom: number;

  targetX: number;
  targetY: number;
  targetZoom: number;

  moveTime: number;
  zoomTime: number;
}

interface CameraBounds {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  minZoom?: number;
  maxZoom?: number;
}

interface CameraOptions {
  x?: number;
  y?: number;
  zoom?: number;
  bounds?: CameraBounds;
}

const clamp = (value: number, min?: number, max?: number) => {
  if (min !== undefined && value < min) {
    return min;
  }

  if (max !== undefined && value > max) {
    return max;
  }

  return value;
};

export default class Camera {
  private state: CameraState;

  private bounds?: CameraBounds;

  constructor(options: CameraOptions = {}) {
    const x = options.x ?? 0;
    const y = options.y ?? 0;
    const zoom = options.zoom ?? 1;

    this.state = {
      x,
      y,
      zoom,

      targetX: x,
      targetY: y,
      targetZoom: zoom,

      moveTime: 0,
      zoomTime: 0,
    };

    this.bounds = {
      maxZoom: 128,
      minZoom: 16,
      ...options.bounds,
    };
  }

  get x() {
    return this.state.x;
  }

  get y() {
    return this.state.y;
  }

  get zoom() {
    return this.state.zoom;
  }

  get position() {
    return {
      x: this.state.x,
      y: this.state.y,
    };
  }

  get targetPosition() {
    return {
      x: this.state.targetX,
      y: this.state.targetY,
    };
  }

  get targetZoom() {
    return this.state.targetZoom;
  }

  moveBy(x: number, y: number, duration = 0) {
    this.moveTo(this.state.x + x, this.state.y + y, duration);
  }

  moveTo(x: number, y: number, duration = 0) {
    x = clamp(x, this.bounds?.minX, this.bounds?.maxX);
    y = clamp(y, this.bounds?.minY, this.bounds?.maxY);

    this.state.targetX = x;
    this.state.targetY = y;
    this.state.moveTime = duration;

    if (duration <= 0) {
      this.state.x = x;
      this.state.y = y;
      this.state.moveTime = 0;
    }
  }

  zoomBy(value: number, duration = 0) {
    this.zoomTo(this.state.zoom + value, duration);
  }

  zoomTo(value: number, duration = 0) {
    value = clamp(value, this.bounds?.minZoom, this.bounds?.maxZoom);

    this.state.targetZoom = value;
    this.state.zoomTime = duration;

    if (duration <= 0) {
      this.state.zoom = value;
      this.state.zoomTime = 0;
    }
  }

  stopMovement() {
    this.state.targetX = this.state.x;
    this.state.targetY = this.state.y;
    this.state.moveTime = 0;
  }

  stopZoom() {
    this.state.targetZoom = this.state.zoom;
    this.state.zoomTime = 0;
  }

  stop() {
    this.stopMovement();
    this.stopZoom();
  }

  setBounds(bounds?: CameraBounds) {
    this.bounds = bounds;

    this.state.targetX = clamp(this.state.targetX, bounds?.minX, bounds?.maxX);

    this.state.targetY = clamp(this.state.targetY, bounds?.minY, bounds?.maxY);

    this.state.targetZoom = clamp(
      this.state.targetZoom,
      bounds?.minZoom,
      bounds?.maxZoom,
    );

    this.state.x = clamp(this.state.x, bounds?.minX, bounds?.maxX);

    this.state.y = clamp(this.state.y, bounds?.minY, bounds?.maxY);

    this.state.zoom = clamp(this.state.zoom, bounds?.minZoom, bounds?.maxZoom);
  }

  clearBounds() {
    this.bounds = undefined;
  }

  update(dt: number) {
    if (this.state.moveTime > 0) {
      const step = Math.min(dt, this.state.moveTime);
      const factor = step / this.state.moveTime;

      this.state.x += (this.state.targetX - this.state.x) * factor;
      this.state.y += (this.state.targetY - this.state.y) * factor;
      this.state.moveTime -= step;

      if (this.state.moveTime <= 0) {
        this.state.x = this.state.targetX;
        this.state.y = this.state.targetY;
        this.state.moveTime = 0;
      }
    }

    if (this.state.zoomTime > 0) {
      const step = Math.min(dt, this.state.zoomTime);
      const factor = step / this.state.zoomTime;

      this.state.zoom += (this.state.targetZoom - this.state.zoom) * factor;
      this.state.zoomTime -= step;

      if (this.state.zoomTime <= 0) {
        this.state.zoom = this.state.targetZoom;
        this.state.zoomTime = 0;
      }
    }
  }

  getState(): Readonly<CameraState> {
    return this.state;
  }
}
