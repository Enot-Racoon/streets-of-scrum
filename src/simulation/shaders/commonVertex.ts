export const COMMON_VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  // Map [-1, 1] clip space to [0, 1] texture coordinates
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const COMMON_VERTEX_SHADER_V2 = `
attribute vec2 aPos;
attribute vec2 aUv;
varying vec2 vUv;

void main() {
  vUv = aUv;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
