export const POST_PROCESS_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_crt_curvature;
uniform float u_scanlines;
uniform float u_scanline_count;
uniform float u_vignette;
uniform float u_chromatic_aberration;
uniform float u_film_grain;
uniform float u_bloom;
varying vec2 v_uv;

// Screen curvature distortion (CRT barrel)
vec2 curveUV(vec2 uv, float curve) {
  if (curve <= 0.001) return uv;
  vec2 st = uv * 2.0 - 1.0;
  vec2 offset = st.yx / vec2(6.0, 4.0);
  st = st + st * offset * offset * curve;
  return st * 0.5 + 0.5;
}

// Pseudo-random noise for film grain
float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = curveUV(v_uv, u_crt_curvature);
  
  // Cut off outside CRT screen
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.01, 0.01, 0.02, 1.0);
    return;
  }
  
  // Chromatic aberration (RGB split)
  vec3 col;
  if (u_chromatic_aberration > 0.001) {
    vec2 dir = (uv - 0.5);
    float dist = length(dir);
    vec2 offset = dir * u_chromatic_aberration * dist;
    
    col.r = texture2D(u_texture, uv + offset).r;
    col.g = texture2D(u_texture, uv).g;
    col.b = texture2D(u_texture, uv - offset).b;
  } else {
    col = texture2D(u_texture, uv).rgb;
  }
  
  // Optional bloom / glow approximation
  if (u_bloom > 0.01) {
    vec3 glow = vec3(0.0);
    float spread = 0.003 * u_bloom;
    glow += texture2D(u_texture, uv + vec2(spread, 0.0)).rgb;
    glow += texture2D(u_texture, uv - vec2(spread, 0.0)).rgb;
    glow += texture2D(u_texture, uv + vec2(0.0, spread)).rgb;
    glow += texture2D(u_texture, uv - vec2(0.0, spread)).rgb;
    col += (glow * 0.25) * u_bloom * 0.6;
  }
  
  // Scanlines
  if (u_scanlines > 0.01) {
    float count = u_scanline_count > 10.0 ? u_scanline_count : 300.0;
    float scanline = sin(uv.y * count * 3.14159) * 0.5 + 0.5;
    col *= 1.0 - (scanline * u_scanlines * 0.4);
  }
  
  // Vignette
  if (u_vignette > 0.01) {
    float vig = uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y);
    vig = clamp(pow(16.0 * vig, 0.25 * u_vignette), 0.0, 1.0);
    col *= vig;
  }
  
  // Film grain
  if (u_film_grain > 0.01) {
    float grain = (random(uv + vec2(u_time * 1.5, u_time * 0.8)) - 0.5) * u_film_grain * 0.25;
    col += grain;
  }
  
  gl_FragColor = vec4(col, 1.0);
}
`;

export const POST_PROCESS_FRAGMENT_SHADER_V2 = `
precision mediump float;

varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime;
uniform float uCurvature;
uniform float uRgbSplit;
uniform float uScanline;
uniform float uWobble;
uniform float uNoise;
uniform float uVignette;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 curve(vec2 uv) {
  vec2 p = uv * 2.0 - 1.0;
  float r2 = dot(p, p);
  p *= 1.0 + r2 * uCurvature;
  return p * 0.5 + 0.5;
}

void main() {
  vec2 uv = vUv;
  vec2 cuv = curve(uv);

  if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float y = cuv.y * uRes.y;
  float wobble = sin(y * 0.07 + uTime * 6.0) * uWobble;
  wobble += (hash(vec2(floor(y), uTime)) - 0.5) * uWobble * 1.33;
  cuv.x += wobble;

  vec2 off = vec2(uRgbSplit, 0.0);

  float r = texture2D(uTex, cuv + off).r;
  float g = texture2D(uTex, cuv).g;
  float b = texture2D(uTex, cuv - off).b;
  vec3 col = vec3(r, g, b);

  float scan = sin(cuv.y * uRes.y * 3.14159);
  col *= (1.0 - uScanline) + uScanline * scan;

  float px = cuv.x * uRes.x;
  float triad = mod(floor(px), 3.0);
  vec3 mask = vec3(0.92);
  if (triad < 1.0) mask = vec3(1.10, 0.88, 0.88);
  else if (triad < 2.0) mask = vec3(0.88, 1.10, 0.88);
  else mask = vec3(0.88, 0.88, 1.10);
  col *= mask;

  float n = hash(cuv * uRes + uTime);
  col += (n - 0.5) * uNoise;

  vec2 p = uv - 0.5;
  float vig = smoothstep(uVignette, 0.20, dot(p, p));
  col *= vig;

  col = pow(col, vec3(0.95));

  gl_FragColor = vec4(col, 1.0);
}
`;
