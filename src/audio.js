let audioCtx = null

// Pre-load speech synthesis voices to avoid first-call delay
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

export function playKeyword(keyword) {
  if (!keyword || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()

    let spokenText = keyword
    if (keyword === 'elif') spokenText = 'else if'
    if (keyword === 'def') spokenText = 'define'

    const utterance = new SpeechSynthesisUtterance(spokenText)
    utterance.lang = 'en-US'
    utterance.rate = 0.85

    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))) ||
                           voices.find(v => v.lang.startsWith('en'))
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    window.speechSynthesis.speak(utterance)
  } catch (e) {
    // speech synthesis unavailable
  }
}

export function playSound(type) {
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    if (type === 'correct') {
      gain.gain.value = 0.08
      osc.frequency.value = 523
      osc.start()
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08)
      osc.stop(ctx.currentTime + 0.18)
    } else {
      // Wrong/Incorrect sound: triangle wave frequency sweep for excellent laptop speaker audibility
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.25)
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    }
  } catch (e) {}
}

