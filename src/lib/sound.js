let audioCtx = null

function getAudioCtx() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    audioCtx = new AudioContextClass()
  }
  return audioCtx
}

// iOS Safari only allows audio to start from a real user gesture. Call this
// once from a click/tap handler to "unlock" the context so later
// programmatic playDing() calls (triggered by realtime events, not taps)
// are allowed to make sound for the rest of the page session.
export function unlockAudio() {
  const ctx = getAudioCtx()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

// Loud and repeated on purpose — this needs to cut through a room full of
// party noise, not politely chime once. Triangle waves are brighter/more
// piercing than sine, and the whole two-note chime repeats 3 times.
export function playDing() {
  const ctx = getAudioCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  const now = ctx.currentTime
  const notes = [1046, 1568] // C6, G6
  const peakGain = 0.85
  const noteGap = 0.16
  const repeatGap = 0.55
  const repeats = 3

  for (let r = 0; r < repeats; r++) {
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const start = now + r * repeatGap + i * noteGap
      const end = start + 0.24
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, end)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(end + 0.02)
    })
  }
}

export function vibrate(pattern = [200, 100, 200, 100, 200]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

export function notifyNewOrder() {
  playDing()
  vibrate()
}
