let audioContext: AudioContext | null = null;

function context(): AudioContext | null {
  const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  audioContext ||= new AudioCtor();
  return audioContext;
}

export type ToneKind = "hover" | "select" | "start";

export function playTone(kind: ToneKind) {
  const ctx = context();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = kind === "start" ? [110, 164.8, 220] : kind === "select" ? [146.8, 220] : [659.3];
  notes.forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === "hover" ? "sine" : "triangle";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now + index * 0.035);
    gain.gain.linearRampToValueAtTime(kind === "hover" ? 0.018 : 0.035, now + 0.02 + index * 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "start" ? 1.5 : 0.7));
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + index * 0.035);
    osc.stop(now + (kind === "start" ? 1.55 : 0.75));
  });
}

/** 塑身阶段的低频环境噪声，返回停止函数。 */
export function startAmbient(): () => void {
  const ctx = context();
  if (!ctx) return () => {};
  const duration = 2;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) channel[i] = (Math.random() * 2 - 1) * 0.13;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.loop = true;
  filter.type = "lowpass";
  filter.frequency.value = 620;
  gain.gain.value = 0.012;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
  return () => {
    try {
      source.stop();
    } catch {}
  };
}
