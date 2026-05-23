// CodeBeat Audio — Web Audio API synthesized sounds + improved TTS

let audioCtx = null

// Pre-load speech synthesis voices
let cachedVoices = []
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices()
  if (cachedVoices.length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      cachedVoices = window.speechSynthesis.getVoices()
    })
  }
}

function getAudioContext() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// ── Utility: create a note with envelope ──
function playNote(ctx, freq, startTime, duration, type = 'sine', volume = 0.12) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02)
  gain.gain.linearRampToValueAtTime(volume * 0.7, startTime + 0.06)
  gain.gain.setValueAtTime(volume * 0.7, startTime + duration - 0.05)
  gain.gain.linearRampToValueAtTime(0, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
  return osc
}

// ── Sound Effects ──

export function playCorrect() {
  try {
    const ctx = getAudioContext()
    const t = ctx.currentTime
    playNote(ctx, 523, t, 0.12, 'sine', 0.10)
    playNote(ctx, 659, t + 0.06, 0.12, 'sine', 0.10)
    playNote(ctx, 784, t + 0.12, 0.18, 'sine', 0.12)
    playNote(ctx, 1568, t + 0.12, 0.15, 'sine', 0.03)
  } catch (e) {}
}

export function playWrong() {
  try {
    const ctx = getAudioContext()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(330, t)
    osc.frequency.linearRampToValueAtTime(220, t + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.10, t)
    gain.gain.linearRampToValueAtTime(0, t + 0.2)
    osc.start(t)
    osc.stop(t + 0.2)
    playNote(ctx, 110, t, 0.15, 'sine', 0.08)
  } catch (e) {}
}

export function playStreak() {
  try {
    const ctx = getAudioContext()
    const t = ctx.currentTime
    playNote(ctx, 880, t, 0.08, 'sine', 0.06)
    playNote(ctx, 1109, t + 0.04, 0.08, 'sine', 0.06)
    playNote(ctx, 1319, t + 0.08, 0.12, 'sine', 0.08)
    playNote(ctx, 1760, t + 0.12, 0.2, 'sine', 0.05)
  } catch (e) {}
}

export function playKeyClick() {
  try {
    const ctx = getAudioContext()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 800
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.03, t)
    gain.gain.linearRampToValueAtTime(0, t + 0.03)
    osc.start(t)
    osc.stop(t + 0.03)
  } catch (e) {}
}

export function playComplete(accuracy) {
  try {
    const ctx = getAudioContext()
    const t = ctx.currentTime
    if (accuracy >= 80) {
      playNote(ctx, 523, t, 0.15, 'sine', 0.10)
      playNote(ctx, 659, t + 0.1, 0.15, 'sine', 0.10)
      playNote(ctx, 784, t + 0.2, 0.15, 'sine', 0.10)
      playNote(ctx, 1047, t + 0.3, 0.3, 'sine', 0.12)
    } else if (accuracy >= 50) {
      playNote(ctx, 440, t, 0.15, 'sine', 0.08)
      playNote(ctx, 554, t + 0.1, 0.15, 'sine', 0.08)
      playNote(ctx, 659, t + 0.2, 0.25, 'sine', 0.10)
    } else {
      playNote(ctx, 330, t, 0.2, 'sine', 0.08)
      playNote(ctx, 392, t + 0.15, 0.25, 'sine', 0.08)
    }
  } catch (e) {}
}

export function playSound(type) {
  if (type === 'correct') playCorrect()
  else playWrong()
}

// ── Programming keyword pronunciation map ──
// Maps code keywords to natural English pronunciation
const PRONUNCIATION_MAP = {
  // Python
  'def': 'define',
  'elif': 'else if',
  'None': 'none',
  'True': 'true',
  'False': 'false',
  'self': 'self',
  'lambda': 'lambda',
  'yield': 'yield',
  'async': 'async',
  'await': 'await',
  
  // JavaScript / general
  'const': 'const',
  'let': 'let',
  'var': 'var',
  'function': 'function',
  'return': 'return',
  'typeof': 'type of',
  'instanceof': 'instance of',
  'undefined': 'undefined',
  'null': 'null',
  'true': 'true',
  'false': 'false',
  'new': 'new',
  'this': 'this',
  'class': 'class',
  'extends': 'extends',
  'super': 'super',
  'import': 'import',
  'export': 'export',
  'default': 'default',
  'from': 'from',
  'switch': 'switch',
  'case': 'case',
  'break': 'break',
  'continue': 'continue',
  'throw': 'throw',
  'try': 'try',
  'catch': 'catch',
  'finally': 'finally',
  'delete': 'delete',
  'void': 'void',
  'in': 'in',
  'of': 'of',
  
  // Symbols
  '===': 'strict equals',
  '??': 'nullish coalescing',
  '??=': 'nullish assign',
  '?.': 'optional chaining',
  ':=': 'walrus operator',
  
  // React
  'useState': 'use state',
  'useEffect': 'use effect',
  'useContext': 'use context',
  'useMemo': 'use memo',
  'useCallback': 'use callback',
  'useRef': 'use ref',
  'useReducer': 'use reducer',
  'React.Fragment': 'react fragment',
  
  // Vue
  'v-for': 'vee for',
  'v-if': 'vee if',
  'v-show': 'vee show',
  'v-model': 'vee model',
  'v-bind': 'vee bind',
  'v-on': 'vee on',
  'v-slot': 'vee slot',
  'v-pre': 'vee pre',
  'v-cloak': 'vee cloak',
  'v-once': 'vee once',
  
  // NestJS decorators
  '@Controller': 'at controller',
  '@Injectable': 'at injectable',
  '@Module': 'at module',
  '@Get': 'at get',
  '@Post': 'at post',
  '@Put': 'at put',
  '@Delete': 'at delete',
  '@Patch': 'at patch',
  '@Body': 'at body',
  '@Query': 'at query',
  '@Param': 'at param',
  '@Headers': 'at headers',
  '@Session': 'at session',
  '@Inject': 'at inject',
  '@UseGuards': 'at use guards',
  '@UsePipes': 'at use pipes',
  '@UseFilters': 'at use filters',
  '@UseInterceptors': 'at use interceptors',
  '@Column': 'at column',
  '@Entity': 'at entity',
  '@decorator': 'at decorator',
  '@property': 'at property',
  '@Global': 'at global',
  '@EventPattern': 'at event pattern',
  '@MessagePattern': 'at message pattern',
  '@WebSocketGateway': 'at web socket gateway',
  
  // General programming
  'arrow': 'arrow function',
  'callback': 'callback',
  'promise': 'promise',
  'Promise': 'promise',
  'Promise.all': 'promise all',
  'async iterator': 'async iterator',
  'generator': 'generator',
  'function*': 'generator function',
  'list comprehension': 'list comprehension',
  'tuple unpacking': 'tuple unpacking',
  'decorator': 'decorator',
  'context manager': 'context manager',
  'context manager decorator': 'context manager decorator',
  'type hinting': 'type hinting',
  'abstract base class': 'abstract base class',
  'metaclass': 'metaclass',
  'descriptor': 'descriptor',
  'property decorator': 'property decorator',
  'static method': 'static method',
  'class method': 'class method',
  'global interpreter lock': 'global interpreter lock',
  'eAFP': 'E A F P',
  'LBYL': 'L B Y L',
  'map': 'map',
  'Map': 'map',
  'Set': 'set',
  'WeakMap': 'weak map',
  'WeakSet': 'weak set',
  'Symbol': 'symbol',
  'Proxy': 'proxy',
  'JSON': 'J S O N',
  'NaN': 'N a N',
  'Infinity': 'infinity',
  'Math': 'math',
  'Date': 'date',
  'RegExp': 'regexp',
  'Array': 'array',
  'Object': 'object',
  'String': 'string',
  'Number': 'number',
  'Boolean': 'boolean',
  'Error': 'error',
  'TypeError': 'type error',
  'RangeError': 'range error',
  'SyntaxError': 'syntax error',
  'Promise': 'promise',
  'Response': 'response',
  'Request': 'request',
  'Headers': 'headers',
  'AbortController': 'abort controller',
  'AbortSignal': 'abort signal',
}

// ── TTS with better voice selection ──
function findBestVoice(voices) {
  if (!voices || voices.length === 0) return null
  
  // Priority: high-quality English voices
  const priorities = [
    // Google voices (usually best quality)
    v => v.lang === 'en-US' && v.name.includes('Google') && v.name.includes('Natural'),
    v => v.lang === 'en-US' && v.name.includes('Google'),
    // Microsoft voices
    v => v.lang === 'en-US' && v.name.includes('Microsoft') && v.name.includes('Natural'),
    // Apple voices
    v => v.lang === 'en-US' && v.name.includes('Samantha'),
    v => v.lang === 'en-US' && v.name.includes('Alex'),
    // Any Natural voice
    v => v.lang === 'en-US' && v.name.includes('Natural'),
    // Any US English
    v => v.lang === 'en-US',
    // Any English
    v => v.lang.startsWith('en'),
  ]
  
  for (const predicate of priorities) {
    const found = voices.find(predicate)
    if (found) return found
  }
  return voices[0]
}


// ── Phonetic hint (returns IPA-like hint for display) ──
const PHONETIC_MAP = {
  'async': '/ˈeɪsɪŋk/',
  'await': '/əˈweɪt/',
  'function': '/ˈfʌŋkʃən/',
  'return': '/rɪˈtɜːrn/',
  'const': '/kɒnst/',
  'let': '/let/',
  'var': '/vɑːr/',
  'class': '/klæs/',
  'import': '/ˈɪmpɔːrt/',
  'export': '/ˈekspɔːrt/',
  'default': '/dɪˈfɔːlt/',
  'typeof': '/taɪp ʌv/',
  'instanceof': '/ˈɪnstəns ʌv/',
  'undefined': '/ˌʌndɪˈfaɪnd/',
  'null': '/nʌl/',
  'true': '/truː/',
  'false': '/fɔːls/',
  'new': '/nuː/',
  'this': '/ðɪs/',
  'extends': '/ɪkˈstendz/',
  'super': '/ˈsuːpər/',
  'switch': '/swɪtʃ/',
  'case': '/keɪs/',
  'break': '/breɪk/',
  'continue': '/kənˈtɪnjuː/',
  'throw': '/θroʊ/',
  'try': '/traɪ/',
  'catch': '/kætʃ/',
  'finally': '/ˈfaɪnəli/',
  'delete': '/dɪˈliːt/',
  'void': '/vɔɪd/',
  'yield': '/jiːld/',
  'lambda': '/ˈlæmdə/',
  'self': '/self/',
  'decorator': '/ˈdekəreɪtər/',
  'generator': '/ˈdʒɛnəreɪtər/',
  'callback': '/ˈkɔːlbæk/',
  'promise': '/ˈprɒmɪs/',
  'response': '/rɪˈspɒns/',
  'request': '/rɪˈkwɛst/',
  'headers': '/ˈhɛdərz/',
  'map': '/mæp/',
  'set': '/sɛt/',
  'weak': '/wiːk/',
  'symbol': '/ˈsɪmbəl/',
  'proxy': '/ˈprɒksi/',
  'array': '/əˈreɪ/',
  'object': '/ˈɒbdʒɛkt/',
  'string': '/strɪŋ/',
  'number': '/ˈnʌmbər/',
  'boolean': '/ˈbuːliən/',
  'error': '/ˈɛrər/',
  'date': '/deɪt/',
  'regexp': '/ˈrɛɡɛksp/',
  'math': '/mæθ/',
  'json': '/dʒeɪsɒn/',
  'nan': '/næn/',
  'infinity': '/ɪnˈfɪnɪti/',
  'arrow': '/ˈæroʊ/',
  'filter': '/ˈfɪltər/',
  'reduce': '/rɪˈdjuːs/',
  'forEach': '/fɔːr iːtʃ/',
  'push': '/pʊʃ/',
  'pop': '/pɒp/',
  'splice': '/slaɪs/',
  'slice': '/slaɪs/',
  'concat': '/kənˈkæt/',
  'reverse': '/rɪˈvɜːrs/',
  'includes': '/ɪnˈkluːdz/',
  'find': '/faɪnd/',
  'findIndex': '/faɪnd ˈɪndɛks/',
  'some': '/sʌm/',
  'every': '/ˈɛvri/',
  'keys': '/kiːz/',
  'values': '/ˈvæljuːz/',
  'entries': '/ˈɛntriz/',
  'from': '/frɒm/',
  'of': '/ʌv/',
  'in': '/ɪn/',
  'with': '/wɪð/',
  'as': '/æz/',
}

export function getPhonetic(keyword) {
  return PHONETIC_MAP[keyword] || ''
}

export function playKeyword(keyword) {
  if (!keyword || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()

    // Use pronunciation map, fall back to keyword itself
    const spokenText = PRONUNCIATION_MAP[keyword] || keyword

    const utterance = new SpeechSynthesisUtterance(spokenText)
    utterance.lang = 'en-US'
    utterance.rate = 0.78    // slightly slower for clarity
    utterance.pitch = 1.0    // natural pitch
    utterance.volume = 1.0   // full volume

    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices()
    const bestVoice = findBestVoice(voices)
    if (bestVoice) utterance.voice = bestVoice

    window.speechSynthesis.speak(utterance)
  } catch (e) {}
}
