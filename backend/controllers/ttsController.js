const rivaService = require('../services/rivaService');
const cacheService = require('../services/cacheService');

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

function getVoices(req, res, next) {
  try {
    res.json({
      model: 'nvidia/magpie-tts-multilingual',
      naming_convention: 'Magpie-Multilingual.{LOCALE}.{Speaker}[.{Emotion}]',
      expressions: ['Angry', 'Calm', 'Disgust', 'Disgusted', 'Fearful', 'Happy', 'Neutral', 'PleasantSurprised', 'Sad'],
      locales: rivaService.MAGPIE_TTS_VOICES,
    });
  } catch (err) {
    next(err);
  }
}

function getCacheStats(req, res, next) {
  try {
    res.json(cacheService.getStats());
  } catch (err) {
    next(err);
  }
}

async function synthesize(req, res, next) {
  const startTime = Date.now();
  try {
    const { text, voice, language_code } = req.body;
    if (!NVIDIA_API_KEY) return res.status(500).json({ message: 'NVIDIA_API_KEY not configured' });
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const cleanedText = rivaService.cleanMarkdown(text.substring(0, 10000)) || text.substring(0, 500).trim();

    const locale = language_code || 'en-US';
    const key = cacheService.generateCacheKey(cleanedText, voice, locale);
    const cachedAudio = cacheService.get(key);
    
    if (cachedAudio) {
      console.log(`[TTS] cache hit (${Date.now() - startTime}ms)`);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-Cache', 'HIT');
      return res.send(rivaService.createWavFile(cachedAudio, rivaService.SAMPLE_RATE));
    }

    console.log(`[TTS] ${cleanedText.length} chars, voice=${voice}, lang=${locale}`);
    
    const audioBuffer = await rivaService.synthesizeText(cleanedText, voice, locale);
    
    cacheService.set(key, audioBuffer);

    const wavBuffer = rivaService.createWavFile(audioBuffer, rivaService.SAMPLE_RATE);
    console.log(`[TTS] done in ${Date.now() - startTime}ms, ${wavBuffer.length} bytes`);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Generation-Time-Ms', String(Date.now() - startTime));
    res.send(wavBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getVoices,
  getCacheStats,
  synthesize
};
