require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dheerajprajapati0009:dheerajprajapati0009@cluster0.7m5841w.mongodb.net/voiceai_db?retryWrites=true&w=majority&appName=Cluster0';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const GRPC_SERVER = 'grpc.nvcf.nvidia.com:443';
const FUNCTION_ID = '877104f7-e885-42b9-8de8-f6e4c6303969';
const SAMPLE_RATE = 22050;

const CHUNK_SIZE = 200;
const CHUNK_CONCURRENCY = 2;
const CHUNK_TIMEOUT_MS = 15000;
const CHUNK_RETRIES = 2;
const CACHE_MAX = 100;
const CACHE_TTL_MS = 1000 * 60 * 60;

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
    if (end >= text.length) { chunks.push(text.slice(start).trim()); break; }
    let splitIdx = text.lastIndexOf(' ', end);
    if (splitIdx <= start) splitIdx = end;
    chunks.push(text.slice(start, splitIdx).trim());
    start = splitIdx;
  }
  return chunks.filter(c => c);
}

function createRivaClient() {
  const PROTO_PATH = path.join(__dirname, 'protos', 'riva_tts.proto');
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
  });
  const rivaProto = grpc.loadPackageDefinition(packageDefinition).nvidia.riva.tts;
  const metadata = new grpc.Metadata();
  metadata.add('function-id', FUNCTION_ID);
  metadata.add('authorization', `Bearer ${NVIDIA_API_KEY}`);
  return new rivaProto.RivaSpeechSynthesis(
    GRPC_SERVER,
    grpc.credentials.createSsl(),
    { 'grpc.ssl_target_name_override': 'grpc.nvcf.nvidia.com' }
  );
}

function getClientAndMetadata() {
  const PROTO_PATH = path.join(__dirname, 'protos', 'riva_tts.proto');
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

function createWavFile(pcmData, sampleRate) {
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

const cache = new Map();

function cacheKey(text, voice, locale) {
  return crypto.createHash('sha1').update(`${locale}|${voice}|${text}`).digest('hex');
}

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
  cache.delete(key);
  cache.set(key, entry);
  return entry.audio;
}

function cacheSet(key, audio) {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { ts: Date.now(), audio });
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

app.get('/api/tts/voices', (req, res) => {
  res.json({
    model: 'nvidia/magpie-tts-multilingual',
    naming_convention: 'Magpie-Multilingual.{LOCALE}.{Speaker}[.{Emotion}]',
    expressions: ['Angry', 'Calm', 'Disgust', 'Disgusted', 'Fearful', 'Happy', 'Neutral', 'PleasantSurprised', 'Sad'],
    locales: MAGPIE_TTS_VOICES,
  });
});

app.get('/api/tts/cache-stats', (req, res) => {
  res.json({ size: cache.size, max: CACHE_MAX });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));

app.post('/api/tts', async (req, res) => {
  const startTime = Date.now();
  try {
    const { text, voice, language_code } = req.body;
    if (!NVIDIA_API_KEY) return res.status(500).json({ message: 'NVIDIA_API_KEY not configured' });
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const cleanedText = cleanMarkdown(text.substring(0, 10000)) || text.substring(0, 500).trim();

    const locale = language_code || 'en-US';
    const key = cacheKey(cleanedText, voice, locale);
    const cached = cacheGet(key);
    if (cached) {
      console.log(`[TTS] cache hit (${Date.now() - startTime}ms)`);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-Cache', 'HIT');
      return res.send(createWavFile(cached, SAMPLE_RATE));
    }

    console.log(`[TTS] ${cleanedText.length} chars, voice=${voice}, lang=${locale}`);
    const chunks = chunkText(cleanedText, CHUNK_SIZE);
    console.log(`[TTS] ${chunks.length} chunks @ ${CHUNK_CONCURRENCY} concurrency`);

    const results = await runPool(chunks, (chunk) => synthesizeChunkSafe(chunk, voice, locale));

    const successful = results.filter(r => r.ok);
    const failed = results.filter(r => !r.ok);

    if (failed.length > 0) {
      console.warn(`[TTS] ${failed.length}/${chunks.length} chunks failed`);
    }

    if (successful.length === 0) {
      return res.status(502).json({
        message: 'The voice model could not process this text. Try a different voice, shorter text, or remove special characters/numbers.',
      });
    }

    const combinedAudio = Buffer.concat(successful.map(r => Buffer.from(r.audio)));
    cacheSet(key, combinedAudio);

    const wavBuffer = createWavFile(combinedAudio, SAMPLE_RATE);
    console.log(`[TTS] done in ${Date.now() - startTime}ms, ${wavBuffer.length} bytes`);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Generation-Time-Ms', String(Date.now() - startTime));
    res.send(wavBuffer);
  } catch (error) {
    console.error('[TTS] Error:', error);
    res.status(500).json({ message: error.message });
  }
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`[db] Connected to MongoDB: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    console.error('[db] Server will start but DB features will be unavailable.');
  }

  app.listen(PORT, () => {
    console.log(`Voice AI API running on http://localhost:${PORT}`);
    if (!NVIDIA_API_KEY) console.warn('WARNING: NVIDIA_API_KEY not set.');
  });
}

start();
