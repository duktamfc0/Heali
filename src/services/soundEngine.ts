/**
 * Procedural Web Audio Ambient Soundscape Generator for Heali
 * 100% royalty-free, client-side synthesized, zero latency, works offline in PWA
 */

class HealiSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;

  // Track gains
  private rainGain: GainNode | null = null;
  private wavesGain: GainNode | null = null;
  private fireGain: GainNode | null = null;
  private chimesGain: GainNode | null = null;
  private bowlGain: GainNode | null = null;
  private cricketsGain: GainNode | null = null;
  private pianoGain: GainNode | null = null;

  // Active nodes / intervals
  private intervals: number[] = [];
  private noiseNodes: AudioNode[] = [];

  // Volumes state (0 to 1)
  private volumes = {
    rain: 0.45,
    piano: 0.4,
    waves: 0.35,
    fire: 0.2,
    chimes: 0.35,
    bowl: 0.3,
    crickets: 0.25,
    master: 0.7,
  };

  private timerId: number | null = null;
  private remainingTimerSeconds = 0;
  private onTimerTick?: (remaining: number) => void;
  private onStateChange?: (playing: boolean) => void;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate pink/brown noise buffer
  private createNoiseBuffer(type: 'pink' | 'brown' | 'white'): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white') {
        output[i] = white * 0.2;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07;
        b6 = white * 0.115926;
      } else {
        // Brown noise
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 1.8;
      }
    }
    return buffer;
  }

  // Synthesize soft piano/rhodes note
  private playPianoNote(freq: number, velocity = 0.5) {
    if (!this.ctx || !this.pianoGain || this.volumes.piano <= 0.05) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 3.5;

      // Fundamental and gentle harmonic
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 0.8, now + duration);

      const amp = velocity * this.volumes.piano * 0.3;
      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(amp, now + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.pianoGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.1);
      osc2.stop(now + duration + 0.1);
    } catch {
      // ignore
    }
  }

  // Setup synthesized tracks
  private setupTracks() {
    if (!this.ctx || !this.masterGain) return;

    // 1. Rain
    const rainNoise = this.ctx.createBufferSource();
    rainNoise.buffer = this.createNoiseBuffer('pink');
    rainNoise.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(this.volumes.rain, this.ctx.currentTime);

    rainNoise.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    rainNoise.start(0);
    this.noiseNodes.push(rainNoise);

    // 2. Soft Piano ambient melody
    this.pianoGain = this.ctx.createGain();
    this.pianoGain.gain.setValueAtTime(this.volumes.piano, this.ctx.currentTime);
    this.pianoGain.connect(this.masterGain);

    // Pentatonic ambient chord progression: C, D, E, G, A (220Hz - 660Hz)
    const chordNotes = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 261.63, 329.63, 440.00], // Fmaj7
      [196.00, 246.94, 293.66, 392.00], // G6
    ];
    let chordIdx = 0;

    const pianoInterval = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || this.volumes.piano <= 0.05) return;
      const notes = chordNotes[chordIdx % chordNotes.length];
      chordIdx++;

      // Arpeggiate chord notes with gentle delay
      notes.forEach((freq, noteIdx) => {
        setTimeout(() => {
          if (this.isPlaying) {
            this.playPianoNote(freq, 0.45 + Math.random() * 0.15);
          }
        }, noteIdx * 450 + Math.random() * 80);
      });
    }, 4500);
    this.intervals.push(pianoInterval);

    // 3. Ocean Waves (LFO swell)
    const waveNoise = this.ctx.createBufferSource();
    waveNoise.buffer = this.createNoiseBuffer('brown');
    waveNoise.loop = true;

    const waveFilter = this.ctx.createBiquadFilter();
    waveFilter.type = 'bandpass';
    waveFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    waveFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const waveLfo = this.ctx.createOscillator();
    waveLfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);
    waveLfo.connect(lfoGain);
    lfoGain.connect(waveFilter.frequency);
    waveLfo.start(0);
    this.noiseNodes.push(waveLfo);

    this.wavesGain = this.ctx.createGain();
    this.wavesGain.gain.setValueAtTime(this.volumes.waves, this.ctx.currentTime);

    waveNoise.connect(waveFilter);
    waveFilter.connect(this.wavesGain);
    this.wavesGain.connect(this.masterGain);
    waveNoise.start(0);
    this.noiseNodes.push(waveNoise);

    // 4. Fireplace crackle
    const fireNoise = this.ctx.createBufferSource();
    fireNoise.buffer = this.createNoiseBuffer('brown');
    fireNoise.loop = true;

    const fireLow = this.ctx.createBiquadFilter();
    fireLow.type = 'lowpass';
    fireLow.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.fireGain = this.ctx.createGain();
    this.fireGain.gain.setValueAtTime(this.volumes.fire, this.ctx.currentTime);

    fireNoise.connect(fireLow);
    fireLow.connect(this.fireGain);
    this.fireGain.connect(this.masterGain);
    fireNoise.start(0);
    this.noiseNodes.push(fireNoise);

    const crackleInterval = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || this.volumes.fire <= 0.05) return;
      if (Math.random() > 0.45) return;
      try {
        const osc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + Math.random() * 800, this.ctx.currentTime);
        popGain.gain.setValueAtTime(this.volumes.fire * 0.18, this.ctx.currentTime);
        popGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        osc.connect(popGain);
        popGain.connect(this.masterGain!);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch {
        // ignore
      }
    }, 280);
    this.intervals.push(crackleInterval);

    // 5. Wind Chimes
    this.chimesGain = this.ctx.createGain();
    this.chimesGain.gain.setValueAtTime(this.volumes.chimes, this.ctx.currentTime);
    this.chimesGain.connect(this.masterGain);

    const chimeFrequencies = [528, 660, 792, 1056, 1320, 1584];
    const chimeInterval = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || this.volumes.chimes <= 0.05) return;
      if (Math.random() > 0.4) return;
      try {
        const freq = chimeFrequencies[Math.floor(Math.random() * chimeFrequencies.length)];
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const duration = 2.5 + Math.random() * 1.5;
        noteGain.gain.setValueAtTime(this.volumes.chimes * 0.25, this.ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(noteGain);
        noteGain.connect(this.chimesGain!);
        osc.start();
        osc.stop(this.ctx.currentTime + duration + 0.1);
      } catch {
        // ignore
      }
    }, 2400);
    this.intervals.push(chimeInterval);

    // 6. Singing Bowl
    this.bowlGain = this.ctx.createGain();
    this.bowlGain.gain.setValueAtTime(this.volumes.bowl, this.ctx.currentTime);
    this.bowlGain.connect(this.masterGain);

    const bowlInterval = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || this.volumes.bowl <= 0.05) return;
      if (Math.random() > 0.35) return;
      this.strikeSingingBowl(216);
    }, 14000);
    this.intervals.push(bowlInterval);

    // 7. Night Crickets
    this.cricketsGain = this.ctx.createGain();
    this.cricketsGain.gain.setValueAtTime(this.volumes.crickets, this.ctx.currentTime);
    this.cricketsGain.connect(this.masterGain);

    const cricketInterval = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || this.volumes.crickets <= 0.05) return;
      if (Math.random() > 0.45) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4500, this.ctx.currentTime);

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.volumes.crickets * 0.08, now + 0.04);
        gain.gain.linearRampToValueAtTime(0, now + 0.09);
        gain.gain.linearRampToValueAtTime(this.volumes.crickets * 0.08, now + 0.14);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);

        osc.connect(gain);
        gain.connect(this.cricketsGain!);
        osc.start();
        osc.stop(now + 0.22);
      } catch {
        // ignore
      }
    }, 1600);
    this.intervals.push(cricketInterval);
  }

  public strikeSingingBowl(baseFreq = 216) {
    if (!this.ctx || !this.bowlGain) return;
    try {
      const harmonics = [1, 2.76, 5.4];
      const now = this.ctx.currentTime;
      harmonics.forEach((h, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * h, now);

        const duration = 6.0 / (idx + 1);
        const amp = (0.28 / (idx + 1)) * this.volumes.bowl;
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.bowlGain!);
        osc.start();
        osc.stop(now + duration + 0.1);
      });
    } catch {
      // ignore
    }
  }

  public start() {
    this.initContext();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.setupTracks();
    this.onStateChange?.(true);
  }

  public stop() {
    this.isPlaying = false;
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];
    this.noiseNodes.forEach(node => {
      try {
        (node as any).stop?.();
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.noiseNodes = [];
    this.onStateChange?.(false);
  }

  public toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  public subscribe(cb: (playing: boolean) => void) {
    this.onStateChange = cb;
    return () => {
      this.onStateChange = undefined;
    };
  }

  public setVolume(channel: keyof typeof this.volumes, value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    this.volumes[channel] = clamped;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (channel === 'master' && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(clamped, now, 0.05);
    } else if (channel === 'rain' && this.rainGain) {
      this.rainGain.gain.setTargetAtTime(clamped, now, 0.05);
    } else if (channel === 'piano' && this.pianoGain) {
      this.pianoGain.gain.setTargetAtTime(clamped, now, 0.05);
    } else if (channel === 'waves' && this.wavesGain) {
      this.wavesGain.gain.setTargetAtTime(clamped, now, 0.05);
    } else if (channel === 'fire' && this.fireGain) {
      this.fireGain.gain.setTargetAtTime(clamped, now, 0.05);
    } else if (channel === 'chimes' && this.chimesGain) {
      this.chimesGain.gain.setTargetAtTime(clamped, now, 0.05);
    } else if (channel === 'bowl' && this.bowlGain) {
      this.bowlGain.gain.setTargetAtTime(clamped, now, 0.05);
    } else if (channel === 'crickets' && this.cricketsGain) {
      this.cricketsGain.gain.setTargetAtTime(clamped, now, 0.05);
    }
  }

  public getVolumes() {
    return { ...this.volumes };
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  // Presets
  public applyPreset(name: 'rain_lake' | 'night_garden' | 'warm_hearth' | 'deep_zen' | 'piano_lullaby') {
    switch (name) {
      case 'rain_lake':
        this.setVolume('rain', 0.65);
        this.setVolume('piano', 0.35);
        this.setVolume('waves', 0.3);
        this.setVolume('chimes', 0.2);
        this.setVolume('fire', 0.0);
        this.setVolume('bowl', 0.2);
        this.setVolume('crickets', 0.1);
        break;
      case 'piano_lullaby':
        this.setVolume('rain', 0.3);
        this.setVolume('piano', 0.7);
        this.setVolume('waves', 0.2);
        this.setVolume('chimes', 0.35);
        this.setVolume('fire', 0.0);
        this.setVolume('bowl', 0.25);
        this.setVolume('crickets', 0.2);
        break;
      case 'night_garden':
        this.setVolume('rain', 0.1);
        this.setVolume('piano', 0.4);
        this.setVolume('waves', 0.2);
        this.setVolume('chimes', 0.55);
        this.setVolume('fire', 0.0);
        this.setVolume('bowl', 0.3);
        this.setVolume('crickets', 0.45);
        break;
      case 'warm_hearth':
        this.setVolume('rain', 0.25);
        this.setVolume('piano', 0.35);
        this.setVolume('waves', 0.0);
        this.setVolume('chimes', 0.15);
        this.setVolume('fire', 0.65);
        this.setVolume('bowl', 0.15);
        this.setVolume('crickets', 0.1);
        break;
      case 'deep_zen':
        this.setVolume('rain', 0.15);
        this.setVolume('piano', 0.25);
        this.setVolume('waves', 0.25);
        this.setVolume('chimes', 0.35);
        this.setVolume('fire', 0.0);
        this.setVolume('bowl', 0.65);
        this.setVolume('crickets', 0.1);
        break;
    }
  }

  // Sleep timer
  public setSleepTimer(minutes: number, onTick?: (remainingSeconds: number) => void) {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    if (minutes <= 0) {
      this.remainingTimerSeconds = 0;
      onTick?.(0);
      return;
    }

    this.remainingTimerSeconds = minutes * 60;
    this.onTimerTick = onTick;
    this.onTimerTick?.(this.remainingTimerSeconds);

    this.timerId = window.setInterval(() => {
      this.remainingTimerSeconds -= 1;
      this.onTimerTick?.(this.remainingTimerSeconds);

      if (this.remainingTimerSeconds <= 0) {
        if (this.timerId) window.clearInterval(this.timerId);
        this.timerId = null;
        this.stop();
      }
    }, 1000);
  }

  public getRemainingTimerSeconds() {
    return this.remainingTimerSeconds;
  }
}

export const soundEngine = new HealiSoundEngine();
