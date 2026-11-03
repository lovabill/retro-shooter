export class SoundFX {
  private static instance: SoundFX;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicIntervalId: number | null = null;
  private currentBassStep: number = 0;

  private constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public static getInstance(): SoundFX {
    if (!SoundFX.instance) {
      SoundFX.instance = new SoundFX();
    }
    return SoundFX.instance;
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch {
      // Audio not supported or blocked
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public playLaser(): void {
    try {
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      this.resume();

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.linearRampToValueAtTime(1400, t + 0.12);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.14);
    } catch {
      // Audio fallback
    }
  }

  public playSideShot(): void {
    try {
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      this.resume();

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Audio fallback
    }
  }

  public playMissileLaunch(): void {
    try {
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      this.resume();

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.linearRampToValueAtTime(580, t + 0.12);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.14);
    } catch {
      // Audio fallback
    }
  }
  public playShoot(type: string = 'pulse'): void {
    try {
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      this.resume();

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.sfxGain);

      if (type === 'heavy') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.start(t);
        osc.stop(t + 0.18);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(740, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.1);
        gain.gain.setValueAtTime(0.24, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
      }
    } catch {
      // Audio fallback
    }
  }

  public playEnemyShoot(): void {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.09);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playShieldDeflect(): void {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playHit(): void {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playExplosion(large: boolean = false): void {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const duration = large ? 0.6 : 0.28;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // White noise with exponential decay
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-4 * (i / bufferSize));
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(large ? 450 : 800, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(large ? 0.45 : 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);

    // Bass sub-thump for punch
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(large ? 120 : 160, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + duration);
    subGain.gain.setValueAtTime(large ? 0.4 : 0.25, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);

    sub.start(t);
    sub.stop(t + duration);
  }

  public playPickupCredit(): void {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(987, t); // B5
    osc1.frequency.setValueAtTime(1318, t + 0.05); // E6

    osc2.frequency.setValueAtTime(1318, t);
    osc2.frequency.setValueAtTime(1975, t + 0.05); // B6

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.15);
    osc2.stop(t + 0.15);
  }

  public playShopBuy(): void {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const freqs = [523, 659, 783, 1046]; // C-E-G-C
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + idx * 0.04;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.12);
    });
  }

  public playWarningAlarm(): void {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.setValueAtTime(500, t + 0.07);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playBossAlarm(): void {
    try {
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      this.resume();

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.35);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.4);
    } catch {
      // Audio safety fallback
    }
  }

  public playStageClear(): void {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const notes = [440, 554, 659, 880, 1108]; // A major arpeggio
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + i * 0.09;

      osc.type = 'square';
      osc.frequency.setValueAtTime(f, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    });
  }

  public playGameOver(): void {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const notes = [330, 311, 293, 277]; // Descending chromatic stabs
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + i * 0.18;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });
  }

  /**
   * Enhanced Procedural Retro Synth Music Engine!
   * Multi-track synthesizer authentically capturing the driving funk-techno
   * of Xenon 2 (Megablast by Bomb the Bass) and the melodic FM synth of Tyrian.
   */
  public startMusic(theme: 'battle' | 'shop' | 'boss' = 'battle'): void {
    this.init();
    if (!this.ctx || !this.musicGain || this.isMusicPlaying) return;
    this.resume();
    this.isMusicPlaying = true;

    // Authentic Xenon 2 "Megablast" 16-step bassline riff in D minor:
    // D2 -> D3 (octave jump) -> F2 -> G2 -> G#2 (blues tritone) -> G2 -> F2 -> C3
    const xenon2MegablastBass = [
      73.4,  146.8, 73.4,  146.8, // D2, D3, D2, D3
      87.3,  87.3,  174.6, 87.3,  // F2, F2, F3, F2
      98.0,  103.8, 98.0,  87.3,  // G2, G#2, G2, F2
      73.4,  146.8, 130.8, 146.8  // D2, D3, C3, D3
    ];

    // Melodic Arpeggio hooks (Megablast / Tyrian lead counterpoint)
    const xenon2Arp = [
      293.7, 0,     349.2, 440.0, // D4, -, F4, A4
      523.3, 587.3, 523.3, 440.0, // C5, D5, C5, A4
      392.0, 415.3, 392.0, 349.2, // G4, G#4, G4, F4
      293.7, 440.0, 523.3, 587.3  // D4, A4, C5, D5
    ];

    // Tyrian Hangar Lounge Funk Bass (C - Am - F - G)
    const tyrianShopBass = [
      130.8, 130.8, 196.0, 130.8,
      110.0, 110.0, 164.8, 110.0,
      87.3,  87.3,  130.8, 87.3,
      98.0,  123.5, 146.8, 98.0
    ];

    // Tyrian Shop warm Rhodes-style arpeggios
    const tyrianShopArp = [
      261.6, 329.6, 392.0, 493.9,
      220.0, 261.6, 329.6, 440.0,
      174.6, 220.0, 261.6, 349.2,
      196.0, 246.9, 293.7, 392.0
    ];

    // Intense Boss Chromatic War Riff
    const bossBass = [
      55.0,  110.0, 55.0,  110.0,
      58.3,  116.5, 58.3,  116.5,
      61.7,  123.5, 61.7,  123.5,
      65.4,  58.3,  55.0,  51.9
    ];

    const bossArp = [
      440.0, 466.2, 440.0, 349.2,
      466.2, 493.9, 466.2, 370.0,
      493.9, 523.3, 493.9, 392.0,
      523.3, 466.2, 440.0, 415.3
    ];

    const bassSeq = theme === 'boss' ? bossBass : (theme === 'shop' ? tyrianShopBass : xenon2MegablastBass);
    const leadSeq = theme === 'boss' ? bossArp : (theme === 'shop' ? tyrianShopArp : xenon2Arp);
    const tempoMs = theme === 'boss' ? 115 : (theme === 'shop' ? 150 : 125);

    this.currentBassStep = 0;
    this.musicIntervalId = window.setInterval(() => {
      try {
        if (!this.ctx || !this.musicGain || this.isMuted) return;

        const step = this.currentBassStep % bassSeq.length;
        const bassFreq = bassSeq[step];
        const leadFreq = leadSeq[step];
        this.currentBassStep++;

        const t = this.ctx.currentTime;

        // 1. TRACK 1: PUNCHY 16-BIT BASS SYNTH
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        const bassFilter = this.ctx.createBiquadFilter();

        bassOsc.type = theme === 'shop' ? 'triangle' : 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(theme === 'shop' ? 550 : 1200, t);
        bassFilter.frequency.exponentialRampToValueAtTime(140, t + 0.11);

        bassGain.gain.setValueAtTime(theme === 'shop' ? 0.22 : 0.26, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.12);

        // 2. TRACK 2: CHIPTUNE LEAD SYNTH / ARPEGGIO
        if (leadFreq > 0 && Math.random() < 0.85) {
          const leadOsc = this.ctx.createOscillator();
          const leadGain = this.ctx.createGain();

          leadOsc.type = theme === 'shop' ? 'sine' : 'square';
          leadOsc.frequency.setValueAtTime(leadFreq, t);

          leadGain.gain.setValueAtTime(theme === 'shop' ? 0.08 : 0.09, t);
          leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

          leadOsc.connect(leadGain);
          leadGain.connect(this.musicGain);

          leadOsc.start(t);
          leadOsc.stop(t + 0.1);
        }

        // 3. TRACK 3: RETRO DRUMS (Kick, Snare & Hi-Hat)
        // A) Kick Drum on Beats 1, 5, 9, 13 (every 4th step)
        if (step % 4 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();

          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(150, t);
          kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

          kickGain.gain.setValueAtTime(0.32, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

          kickOsc.connect(kickGain);
          kickGain.connect(this.musicGain);

          kickOsc.start(t);
          kickOsc.stop(t + 0.09);
        }

        // B) Snare on Beats 5 and 13 (beats 2 and 4 of 4/4 bar)
        if (step % 8 === 4) {
          const snareOsc = this.ctx.createOscillator();
          const snareGain = this.ctx.createGain();

          snareOsc.type = 'triangle';
          snareOsc.frequency.setValueAtTime(220, t);
          snareOsc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

          snareGain.gain.setValueAtTime(0.18, t);
          snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

          snareOsc.connect(snareGain);
          snareGain.connect(this.musicGain);

          snareOsc.start(t);
          snareOsc.stop(t + 0.09);
        }

        // C) Closed / Accent Hi-Hat on 16th notes
        if (theme !== 'shop' || step % 2 === 0) {
          const hatOsc = this.ctx.createOscillator();
          const hatGain = this.ctx.createGain();

          hatOsc.type = 'square';
          hatOsc.frequency.setValueAtTime(1800, t);
          hatOsc.frequency.exponentialRampToValueAtTime(900, t + 0.035);

          hatGain.gain.setValueAtTime(step % 4 === 2 ? 0.06 : 0.035, t);
          hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

          hatOsc.connect(hatGain);
          hatGain.connect(this.musicGain);

          hatOsc.start(t);
          hatOsc.stop(t + 0.04);
        }
      } catch {
        // Safe audio loop
      }
    }, tempoMs);
  }

  public stopMusic(): void {
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    this.isMusicPlaying = false;
  }
}
