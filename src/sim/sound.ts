/**
 * Web Audio API synthesizer for Streets of Scrum-style sound effects.
 */

import storeValue from "../utils/storeValue";

const volumeStore = storeValue("sound_volume", String, Number);

class SoundSystem {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private _masterVolume: number = volumeStore() ?? volumeStore(0.4);

  // Общая шина: все звуки идут сюда, а не напрямую в destination.
  // Компрессор работает как лимитер — не даёт сумме звуков "взрываться" по громкости.
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

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
        0.01
      );
    }
  }

  constructor() {
    this.enabled = this._masterVolume > 0;
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Лимитер на выходе: сжимает пики, когда звуки накладываются друг на друга.
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

        // Мастер-громкость применяется один раз здесь, а не в каждом отдельном звуке.
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(
          this._masterVolume,
          this.ctx.currentTime
        );

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Все "выходы" звуков теперь подключаются сюда вместо ctx.destination напрямую.
  private get output(): AudioNode {
    return this.masterGain as AudioNode;
  }

  // Небольшой хелпер, чтобы создавать шумовой буфер без копипасты.
  private createNoiseBuffer(duration: number, decay: number): AudioBuffer {
    const ctx = this.ctx as AudioContext;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * decay));
    }
    return buffer;
  }

  // Мягкий дисторшн, чтобы взрыв звучал "мясистее", а не просто как шум.
  private createDistortion(amount: number): WaveShaperNode {
    const ctx = this.ctx as AudioContext;
    const shaper = ctx.createWaveShaper();
    const samples = 44100;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    shaper.curve = curve;
    shaper.oversample = "4x";
    return shaper;
  }

  playPunch() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playGunshot() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.15, 0.03);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.output);

    noise.start(now);
  }

  playShotgun() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.25, 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(gain);
    gain.connect(this.output);

    noise.start(now);
  }

  /**
   * Взрыв теперь состоит из трёх слоёв:
   * 1. Суб-бас (осциллятор с падающей частотой) — даёт "вес" удару.
   * 2. Основной шумовой корпус, пропущенный через lowpass + лёгкий дисторшн — "мясо" взрыва.
   * 3. Короткий высокочастотный "треск" в самом начале — имитирует резкий щелчок/осколки.
   */
  playExplosion() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Суб-бас "удар"
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.35);
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    subOsc.connect(subGain);
    subGain.connect(this.output);
    subOsc.start(now);
    subOsc.stop(now + 0.41);

    // 2. Основной корпус шума с дисторшном
    const bodyDuration = 0.6;
    const body = this.ctx.createBufferSource();
    body.buffer = this.createNoiseBuffer(bodyDuration, 0.16);

    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = "lowpass";
    bodyFilter.frequency.setValueAtTime(1200, now);
    bodyFilter.frequency.exponentialRampToValueAtTime(60, now + bodyDuration);

    const distortion = this.createDistortion(30);

    const bodyGain = this.ctx.createGain();
    bodyGain.gain.setValueAtTime(1.3, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.01, now + bodyDuration);

    body.connect(bodyFilter);
    bodyFilter.connect(distortion);
    distortion.connect(bodyGain);
    bodyGain.connect(this.output);
    body.start(now);

    // 3. Короткий "треск" в начале (осколки/удар)
    const crackDuration = 0.08;
    const crack = this.ctx.createBufferSource();
    crack.buffer = this.createNoiseBuffer(crackDuration, 0.015);

    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = "highpass";
    crackFilter.frequency.setValueAtTime(2500, now);

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.6, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + crackDuration);

    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.output);
    crack.start(now);
  }

  playAlert() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.setValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  playPossess() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  playUnpossess() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playAlarm() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.setValueAtTime(600, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(now);
    osc.stop(now + 0.31);
  }

  playHeal() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.setValueAtTime(440, now + 0.08);
    osc.frequency.setValueAtTime(660, now + 0.16);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(now);
    osc.stop(now + 0.31);
  }

  playDoor() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(now);
    osc.stop(now + 0.11);
  }
}

export const sounds = new SoundSystem();