const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const GRPC_SERVER = 'grpc.nvcf.nvidia.com:443';
const FUNCTION_ID = '877104f7-e885-42b9-8de8-f6e4c6303969';
const SAMPLE_RATE = 22050;

const CHUNK_SIZE = 200;
const CHUNK_CONCURRENCY = 2;
const CHUNK_TIMEOUT_MS = 15000;
const CHUNK_RETRIES = 2;

const MAGPIE_TTS_VOICES = {
  "EN-US": { label: "English (US)", speakers: {
    Aria: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "Sad"],
    Diego: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "PleasantSurprised"],
    Isabela: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "PleasantSurprised", "Sad"],
    Jason: ["Angry", "Calm", "Happy", "Neutral"],
    Leo: ["Angry", "Calm", "Fearful", "Neutral", "Sad"],
    Louise: [], Mia: ["Angry", "Calm", "Happy", "Neutral", "Sad"],
    Pascal: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "Sad"],
    Ray: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
    Sofia: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
  }},
  "ES-US": { label: "Spanish (US)", speakers: {
    Aria: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "Sad"],
    Diego: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "PleasantSurprised"],
    Isabela: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "PleasantSurprised", "Sad"],
    Jason: ["Angry", "Calm", "Happy", "Neutral"],
    Leo: ["Angry", "Calm", "Fearful", "Neutral", "Sad"],
    Louise: [], Mia: ["Angry", "Calm", "Happy", "Neutral", "Sad"],
    Pascal: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "Sad"],
    Ray: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
    Sofia: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
  }},
  "FR-FR": { label: "French (France)", speakers: {
    Aria: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "Sad"],
    Diego: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "PleasantSurprised"],
    Isabela: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "PleasantSurprised", "Sad"],
    Jason: ["Angry", "Calm", "Happy", "Neutral"],
    Leo: ["Angry", "Calm", "Fearful", "Neutral", "Sad"],
    Louise: [], Mia: ["Angry", "Calm", "Happy", "Neutral", "Sad"],
    Pascal: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "Sad"],
    Ray: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
    Sofia: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
  }},
  "DE-DE": { label: "German (Germany)", speakers: {
    Diego: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "PleasantSurprised"],
    Mia: ["Angry", "Calm", "Happy", "Neutral", "Sad"],
    Pascal: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "Sad"],
    Sofia: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
  }},
  "ZH-CN": { label: "Mandarin (China)", speakers: {
    Aria: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "Sad"],
    Diego: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "PleasantSurprised"],
    HouZhen: [],
    Isabela: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "PleasantSurprised", "Sad"],
    Long: ["Angry", "Calm", "Disgusted", "Fearful", "Happy", "Neutral", "Sad"],
    Louise: [], Mia: ["Angry", "Calm", "Happy", "Neutral", "Sad"],
    Pascal: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "Sad"],
    Ray: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
    Siwei: [],
  }},
  "IT-IT": { label: "Italian (Italy)", speakers: {
    Isabela: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "PleasantSurprised", "Sad"],
    Pascal: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "Sad"],
  }},
  "VI-VN": { label: "Vietnamese (Vietnam)", speakers: {
    Aria: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "Sad"],
    Jason: ["Angry", "Calm", "Happy", "Neutral"],
    Leo: ["Angry", "Calm", "Fearful", "Neutral", "Sad"],
    Long: ["Angry", "Calm", "Disgusted", "Fearful", "Happy", "Neutral", "Sad"],
    Mia: ["Angry", "Calm", "Happy", "Neutral", "Sad"],
    Phung: ["Angry", "Disgusted", "Fearful", "Happy", "Neutral", "Sad"],
    Ray: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
    Sofia: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
  }},
  "HI-IN": { label: "Hindi (India)", speakers: {
    Aria: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "Sad"],
    Diego: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "PleasantSurprised"],
    HouZhen: [],
    Isabela: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "PleasantSurprised", "Sad"],
    Jason: ["Angry", "Calm", "Happy", "Neutral"],
    Leo: ["Angry", "Calm", "Fearful", "Neutral", "Sad"],
    Long: ["Angry", "Calm", "Disgusted", "Fearful", "Happy", "Neutral", "Sad"],
    Mia: ["Angry", "Calm", "Happy", "Neutral", "Sad"],
    Pascal: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "Sad"],
    Phung: ["Angry", "Disgusted", "Fearful", "Happy", "Neutral", "Sad"],
    Ray: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
    Siwei: [], Sofia: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
  }},
  "JA-JP": { label: "Japanese (Japan)", speakers: {
    Aria: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "Sad"],
    Diego: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "PleasantSurprised"],
    HouZhen: [],
    Isabela: ["Angry", "Calm", "Fearful", "Happy", "Neutral", "PleasantSurprised", "Sad"],
    Jason: ["Angry", "Calm", "Happy", "Neutral"],
    Long: ["Angry", "Calm", "Disgusted", "Fearful", "Happy", "Neutral", "Sad"],
    Louise: [], Mia: ["Angry", "Calm", "Happy", "Neutral", "Sad"],
    Pascal: ["Angry", "Calm", "Disgust", "Happy", "Neutral", "Sad"],
    Ray: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
    Siwei: [], Sofia: ["Angry", "Calm", "Fearful", "Happy", "Neutral"],
  }},
};

function cleanMarkdown(text) {
  if (!text) return '';
  text = text.replace(/^(\s*Audio Message|\[Audio Message:.*?\])\s*/gi, '');
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  text = text.replace(/#+\s+/g, '');
  text = text.replace(/\*\*|__|\*|_/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  text = text.replace(/^\s*>\s+/gm, '');
  text = text.replace(/\[.*?\]/g, '');
  text = text.replace(/\(.*?\)/g, '');
  text = text.replace(/[{}]/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

function chunkText(text, maxLen = CHUNK_SIZE) {
  if (!text) return [];
  text = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxLen;
    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }
    let splitIdx = text.lastIndexOf(' ', end);
    if (splitIdx <= start) splitIdx = end;
    chunks.push(text.slice(start, splitIdx).trim());
    start = splitIdx;
  }
  return chunks.filter(c => c);
}

function getClientAndMetadata() {
  const PROTO_PATH = path.join(__dirname, '..', 'protos', 'riva_tts.proto');
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
  });
  const rivaProto = grpc.loadPackageDefinition(packageDefinition).nvidia.riva.tts;
  
  const m = new grpc.Metadata();
  m.add('function-id', FUNCTION_ID);
  m.add('authorization', `Bearer ${NVIDIA_API_KEY}`);
  
  const c = new rivaProto.RivaSpeechSynthesis(
    GRPC_SERVER,
    grpc.credentials.createSsl(),
    { 'grpc.ssl_target_name_override': 'grpc.nvcf.nvidia.com' }
  );
  return { client: c, metadata: m };
}

function synthesizeChunk(text, voice, languageCode) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('timeout'));
    }, CHUNK_TIMEOUT_MS);

    let client, metadata;
    try {
      ({ client, metadata } = getClientAndMetadata());
    } catch (e) {
      clearTimeout(timer);
      return reject(e);
    }

    try {
      client.Synthesize({
        text,
        language_code: languageCode || 'en-US',
        voice_name: voice || 'Magpie-Multilingual.EN-US.Aria',
        sample_rate_hz: SAMPLE_RATE,
        encoding: 1,
      }, metadata, (error, response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(response.audio);
      });
    } catch (e) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(e);
      }
    }
  });
}

async function synthesizeWithRetry(text, voice, languageCode) {
  let lastErr;
  for (let attempt = 1; attempt <= CHUNK_RETRIES; attempt++) {
    try {
      return await synthesizeChunk(text, voice, languageCode);
    } catch (err) {
      lastErr = err;
      const msg = err.message || '';
      const transient = err.code === 4 || err.code === 14 || err.code === 1 || err.code === 8 || msg.includes('timeout');
      if (!transient) throw err;
      if (attempt < CHUNK_RETRIES) {
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }
  }
  throw lastErr;
}

async function synthesizeChunkSafe(text, voice, languageCode) {
  try {
    return { ok: true, audio: await synthesizeWithRetry(text, voice, languageCode) };
  } catch (err) {
    console.error(`[TTS] chunk fail: code=${err.code} msg="${(err.message || '').slice(0, 200)}"`);
    return { ok: false, error: err.message || 'synthesis failed' };
  }
}

function createWavFile(pcmData, sampleRate = SAMPLE_RATE) {
  const numChannels = 1, bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;
  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;
  pcmData.copy(buffer, offset);
  return buffer;
}

async function runPool(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function w() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CHUNK_CONCURRENCY, items.length) }, w));
  return results;
}

async function synthesizeText(cleanedText, voice, locale) {
  const chunks = chunkText(cleanedText, CHUNK_SIZE);
  console.log(`[TTS] ${chunks.length} chunks @ ${CHUNK_CONCURRENCY} concurrency`);

  const results = await runPool(chunks, (chunk) => synthesizeChunkSafe(chunk, voice, locale));
  
  const successful = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  if (failed.length > 0) {
    console.warn(`[TTS] ${failed.length}/${chunks.length} chunks failed`);
  }

  if (successful.length === 0) {
    throw new Error('The voice model could not process this text. Try a different voice, shorter text, or remove special characters/numbers.');
  }

  const combinedAudio = Buffer.concat(successful.map(r => Buffer.from(r.audio)));
  return combinedAudio;
}

module.exports = {
  MAGPIE_TTS_VOICES,
  SAMPLE_RATE,
  cleanMarkdown,
  synthesizeText,
  createWavFile
};
