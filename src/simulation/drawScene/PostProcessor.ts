import { COMMON_VERTEX_SHADER } from "../shaders/commonVertex";
import { POST_PROCESS_FRAGMENT_SHADER } from "../shaders/postprocess";

export interface PostProcessConfig {
  enabled: boolean;
  crtCurvature: number; // 0 to 1
  scanlines: number; // 0 to 1
  scanlineCount: number; // 100 to 800
  vignette: number; // 0 to 1
  chromaticAberration: number; // 0 to 0.05
  filmGrain: number; // 0 to 1
  bloom: number; // 0 to 1
  time: number;
}

export class PostProcessor {
  private glCanvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private quadBuffer: WebGLBuffer;
  private texture: WebGLTexture;
  private locations: Record<string, WebGLUniformLocation | null> = {};

  constructor() {
    this.glCanvas = document.createElement("canvas");
    const gl = this.glCanvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL not available for PostProcessor");
    this.gl = gl;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, COMMON_VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, POST_PROCESS_FRAGMENT_SHADER);
    gl.compileShader(fs);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // Quad geometry
    this.quadBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    // Texture for Canvas 2D scene input
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Cache uniforms
    const uniforms = [
      "u_texture",
      "u_resolution",
      "u_time",
      "u_crt_curvature",
      "u_scanlines",
      "u_scanline_count",
      "u_vignette",
      "u_chromatic_aberration",
      "u_film_grain",
      "u_bloom",
    ];
    for (const name of uniforms) {
      this.locations[name] = gl.getUniformLocation(this.program, name);
    }
  }

  public getCanvas(): HTMLCanvasElement {
    return this.glCanvas;
  }

  /**
   * Process a 2D canvas frame through the post-processing shader.
   * Renders the processed result into the PostProcessor's internal canvas.
   */
  public render(
    sourceCanvas: HTMLCanvasElement,
    config: PostProcessConfig,
  ): HTMLCanvasElement {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    if (this.glCanvas.width !== width || this.glCanvas.height !== height) {
      this.glCanvas.width = width;
      this.glCanvas.height = height;
    }

    const gl = this.gl;
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);

    // Upload source canvas to texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip Y to match standard OpenGL coordinates
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      sourceCanvas,
    );

    // Bind quad buffer
    const posLoc = gl.getAttribLocation(this.program, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    if (this.locations.u_texture) gl.uniform1i(this.locations.u_texture, 0);
    if (this.locations.u_resolution)
      gl.uniform2f(this.locations.u_resolution, width, height);
    if (this.locations.u_time) gl.uniform1f(this.locations.u_time, config.time);

    if (this.locations.u_crt_curvature)
      gl.uniform1f(this.locations.u_crt_curvature, config.crtCurvature);
    if (this.locations.u_scanlines)
      gl.uniform1f(this.locations.u_scanlines, config.scanlines);
    if (this.locations.u_scanline_count)
      gl.uniform1f(this.locations.u_scanline_count, config.scanlineCount);
    if (this.locations.u_vignette)
      gl.uniform1f(this.locations.u_vignette, config.vignette);
    if (this.locations.u_chromatic_aberration)
      gl.uniform1f(
        this.locations.u_chromatic_aberration,
        config.chromaticAberration,
      );
    if (this.locations.u_film_grain)
      gl.uniform1f(this.locations.u_film_grain, config.filmGrain);
    if (this.locations.u_bloom)
      gl.uniform1f(this.locations.u_bloom, config.bloom);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return this.glCanvas;
  }

  public dispose(): void {
    const gl = this.gl;
    gl.deleteTexture(this.texture);
    gl.deleteBuffer(this.quadBuffer);
    gl.deleteProgram(this.program);
  }
}
