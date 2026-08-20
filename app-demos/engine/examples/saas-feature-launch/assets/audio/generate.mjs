import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const sampleRate = 48_000;
const channels = 2;
const bytesPerSample = 2;
const outputDirectory = join(dirname(fileURLToPath(import.meta.url)), 'sfx');

function pcmWave(durationSeconds, sampleAt) {
  const frameCount = Math.round(durationSeconds * sampleRate);
  const dataSize = frameCount * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / sampleRate;
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, sampleAt(time, channel, frame)));
      buffer.writeInt16LE(Math.round(sample * 32767), 44 + (frame * channels + channel) * bytesPerSample);
    }
  }
  return buffer;
}

function clickWave() {
  const duration = 0.18;
  let noiseState = 0x4e535452;
  const noise = new Float64Array(Math.round(duration * sampleRate));
  for (let frame = 0; frame < noise.length; frame += 1) {
    noiseState = (Math.imul(noiseState, 1664525) + 1013904223) >>> 0;
    noise[frame] = (noiseState / 0xffffffff) * 2 - 1;
  }

  return pcmWave(duration, (time, channel, frame) => {
    const attack = Math.min(1, time / 0.0015);
    const envelope = attack * Math.exp(-34 * time);
    const chirpPhase = 2 * Math.PI * (2400 * time - 4861.111111 * time * time);
    const transient = Math.sin(chirpPhase) * 0.72 + Math.sin(2 * Math.PI * 3900 * time) * 0.16;
    const stereoOffset = channel === 0 ? 1 : 0.96;
    return envelope * stereoOffset * (transient * 0.42 + noise[frame] * 0.055);
  });
}

function chimeWave() {
  const duration = 2.5;
  return pcmWave(duration, (time, channel) => {
    const attack = Math.min(1, time / 0.008);
    const release = Math.exp(-1.78 * time);
    const stereoPhase = channel === 0 ? 0 : 0.035;
    const fundamental = Math.sin(2 * Math.PI * 659.255 * time + stereoPhase) * 0.58;
    const fifth = Math.sin(2 * Math.PI * 987.767 * time + stereoPhase * 1.4) * 0.28;
    const octave = Math.sin(2 * Math.PI * 1318.51 * time + stereoPhase * 1.8) * 0.14;
    return attack * release * (fundamental + fifth + octave) * 0.33;
  });
}

const outputs = [
  ['sfx_001.wav', clickWave()],
  ['sfx_002.wav', chimeWave()],
];

await mkdir(outputDirectory, {recursive: true});
if (process.argv.includes('--check')) {
  for (const [fileName, expected] of outputs) {
    const actual = await readFile(join(outputDirectory, fileName));
    assert.deepEqual(actual, expected, `${fileName} does not match the deterministic synthesis`);
  }
  console.log('Deterministic SaaS SFX verified.');
} else {
  await Promise.all(outputs.map(([fileName, buffer]) => writeFile(join(outputDirectory, fileName), buffer)));
  console.log('Generated deterministic SaaS SFX.');
}
