/**
 * Web Audio API synthesizer for Streets of Scrum-style sound effects.
 */

import storeValue from "../utils/storeValue";

const volumeStore = storeValue("sound_volume", String, Number);

class SoundSystem {
  private ctx: AudioContext | null = null;

  private masterGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  public enabled = true;

  private _masterVolume: number = volumeStore() ?? volumeStore(0.4);

  public get masterVolume(): number {
    return this._masterVolume;
  }

  public set masterVolume(v: number) {
    this._masterVolume = Math.max(0, Math.min(v, 1));
    volumeStore(this._masterVolume);

    this.enabled = this._masterVolume > 0;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this._masterVolume,
        this.ctx.currentTime,
        0.015,
      );
    }
  }

  constructor() {
    this.enabled = this._masterVolume > 0;
  }

  // ---------------------------------------------------------------------------
  // Audio graph
  // ---------------------------------------------------------------------------

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioCtx) return null;

      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.effectsGain = this.ctx.createGain();
      this.compressor = this.ctx.createDynamicsCompressor();

      /*
       * Effects
       *   ↓
       * effectsGain
       *   ↓
       * compressor
       *   ↓
       * masterGain
       *   ↓
       * destination
       */

      this.effectsGain.gain.value = 1;

      // Acts mostly as a safety limiter.
      this.compressor.threshold.value = -10;
      this.compressor.knee.value = 8;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.12;

      this.masterGain.gain.value = this._masterVolume;

      this.effectsGain.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx?.state === "suspended") {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  private getAudio(): {
    ctx: AudioContext;
    output: GainNode;
  } | null {
    if (!this.enabled) return null;

    const ctx = this.initCtx();

    if (!ctx || !this.effectsGain) {
      return null;
    }

    return {
      ctx,
      output: this.effectsGain,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private createGain(
    ctx: AudioContext,
    output: AudioNode,
    volume: number,
    duration: number,
  ): GainNode {
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    /*
     * Never start at literally 0 and immediately jump to the target.
     * A tiny ramp prevents clicks.
     */
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(volume, 0.0001),
      now + 0.005,
    );

    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    gain.connect(output);

    return gain;
  }

  private createNoiseBuffer(
    ctx: AudioContext,
    duration: number,
    decay: number,
  ): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);

    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / ctx.sampleRate;

      data[i] = (Math.random() * 2 - 1) * Math.exp(-t / decay);
    }

    return buffer;
  }

  // ---------------------------------------------------------------------------
  // Punch
  // ---------------------------------------------------------------------------

  playPunch() {
    const audio = this.getAudio();
    if (!audio) return;

    const { ctx, output } = audio;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = this.createGain(ctx, output, 0.35, 0.12);

    osc.type = "triangle";

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.11);

    osc.connect(gain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // ---------------------------------------------------------------------------
  // Gunshot
  // ---------------------------------------------------------------------------

  playGunshot() {
    const audio = this.getAudio();
    if (!audio) return;

    const { ctx, output } = audio;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();

    noise.buffer = this.createNoiseBuffer(ctx, 0.12, 0.018);

    const filter = ctx.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.value = 0.8;

    const gain = this.createGain(ctx, output, 0.38, 0.12);

    noise.connect(filter);
    filter.connect(gain);

    noise.start(now);
    noise.stop(now + 0.13);

    // Small low-frequency impact.
    const thump = ctx.createOscillator();
    const thumpGain = this.createGain(ctx, output, 0.22, 0.08);

    thump.type = "sine";
    thump.frequency.setValueAtTime(100, now);
    thump.frequency.exponentialRampToValueAtTime(45, now + 0.07);

    thump.connect(thumpGain);

    thump.start(now);
    thump.stop(now + 0.08);
  }

  // ---------------------------------------------------------------------------
  // Shotgun
  // ---------------------------------------------------------------------------

  playShotgun() {
    const audio = this.getAudio();
    if (!audio) return;

    const { ctx, output } = audio;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();

    noise.buffer = this.createNoiseBuffer(ctx, 0.18, 0.035);

    const filter = ctx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(5000, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.18);

    const gain = this.createGain(ctx, output, 0.45, 0.18);

    noise.connect(filter);
    filter.connect(gain);

    noise.start(now);
    noise.stop(now + 0.2);

    // Heavy low-frequency blast.
    const thump = ctx.createOscillator();
    const thumpGain = this.createGain(ctx, output, 0.3, 0.16);

    thump.type = "sine";

    thump.frequency.setValueAtTime(90, now);
    thump.frequency.exponentialRampToValueAtTime(35, now + 0.14);

    thump.connect(thumpGain);

    thump.start(now);
    thump.stop(now + 0.17);
  }

  // ---------------------------------------------------------------------------
  // Explosion
  // ---------------------------------------------------------------------------

  playExplosion() {
    const audio = this.getAudio();
    if (!audio) return;

    const { ctx, output } = audio;
    const now = ctx.currentTime;

    /*
     * Explosion consists of three layers:
     *
     * 1. Sub / low-frequency impact
     * 2. Mid-frequency noisy body
     * 3. Very short high-frequency crack
     */

    // -------------------------------------------------------------------------
    // 1. LOW IMPACT
    // -------------------------------------------------------------------------

    const sub = ctx.createOscillator();
    const subGain = this.createGain(ctx, output, 0.5, 0.42);

    sub.type = "sine";

    sub.frequency.setValueAtTime(95, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.38);

    sub.connect(subGain);

    sub.start(now);
    sub.stop(now + 0.43);

    // -------------------------------------------------------------------------
    // 2. NOISY BODY
    // -------------------------------------------------------------------------

    const noise = ctx.createBufferSource();

    noise.buffer = this.createNoiseBuffer(ctx, 0.42, 0.075);

    const lowpass = ctx.createBiquadFilter();

    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(1800, now);

    lowpass.frequency.exponentialRampToValueAtTime(120, now + 0.42);

    const noiseGain = this.createGain(ctx, output, 0.42, 0.42);

    noise.connect(lowpass);
    lowpass.connect(noiseGain);

    noise.start(now);
    noise.stop(now + 0.44);

    // -------------------------------------------------------------------------
    // 3. INITIAL CRACK
    // -------------------------------------------------------------------------

    const crack = ctx.createBufferSource();

    crack.buffer = this.createNoiseBuffer(ctx, 0.055, 0.008);

    const crackFilter = ctx.createBiquadFilter();

    crackFilter.type = "highpass";
    crackFilter.frequency.value = 1800;

    const crackGain = this.createGain(ctx, output, 0.25, 0.055);

    crack.connect(crackFilter);
    crackFilter.connect(crackGain);

    crack.start(now);
    crack.stop(now + 0.06);
  }

  // ---------------------------------------------------------------------------
  // Alert
  // ---------------------------------------------------------------------------

  playAlert() {
    const audio = this.getAudio();
    if (!audio) return;

    const { ctx, output } = audio;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = this.createGain(ctx, output, 0.22, 0.22);

    osc.type = "sawtooth";

    osc.frequency.setValueAtTime(580, now);
    osc.frequency.setValueAtTime(880, now + 0.08);

    osc.connect(gain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // ---------------------------------------------------------------------------
  // Possess
  // ---------------------------------------------------------------------------

  playPossess() {
    const audio = this.getAudio();
    if (!audio) return;

    const { ctx, output } = audio;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = this.createGain(ctx, output, 0.28, 0.35);

    osc.type = "sine";

    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

    osc.connect(gain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  // ---------------------------------------------------------------------------
  // Unpossess
  // ---------------------------------------------------------------------------

  playUnpossess() {
    const audio = this.getAudio();
    if (!audio) return;

    const { ctx, output } = audio;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = this.createGain(ctx, output, 0.24, 0.25);

    osc.type = "sine";

    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

    osc.connect(gain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  // ---------------------------------------------------------------------------
  // Alarm
  // ---------------------------------------------------------------------------

  playAlarm() {
    const audio = this.getAudio();
    if (!audio) return;

    const { ctx, output } = audio;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = this.createGain(ctx, output, 0.18, 0.3);

    osc.type = "square";

    osc.frequency.setValueAtTime(900, now);
    osc.frequency.setValueAtTime(600, now + 0.15);

    osc.connect(gain);

    osc.start(now);
    osc.stop(now + 0.31);
  }

  // ---------------------------------------------------------------------------
  // Heal
  // ---------------------------------------------------------------------------

  playHeal() {
    const audio = this.getAudio();
    if (!audio) return;

    const { ctx, output } = audio;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = this.createGain(ctx, output, 0.22, 0.3);

    osc.type = "triangle";

    osc.frequency.setValueAtTime(330, now);
    osc.frequency.setValueAtTime(440, now + 0.08);
    osc.frequency.setValueAtTime(660, now + 0.16);

    osc.connect(gain);

    osc.start(now);
    osc.stop(now + 0.31);
  }

  // ---------------------------------------------------------------------------
  // Door
  // ---------------------------------------------------------------------------

  playDoor() {
    const audio = this.getAudio();
    if (!audio) return;

    const { ctx, output } = audio;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = this.createGain(ctx, output, 0.2, 0.1);

    osc.type = "sine";

    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);

    osc.connect(gain);

    osc.start(now);
    osc.stop(now + 0.11);
  }
}

export const sounds = new SoundSystem();
