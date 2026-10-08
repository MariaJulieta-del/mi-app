/** Tres pitidos cortos (fin del descanso). Si el navegador no deja reproducir sonido, no pasa nada. */
let ctx: AudioContext | null = null

export function pitido() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = ctx ?? new AC()
    const ahora = ctx.currentTime
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const vol = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = i === 2 ? 1320 : 880
      vol.gain.setValueAtTime(0.0001, ahora + i * 0.22)
      vol.gain.exponentialRampToValueAtTime(0.35, ahora + i * 0.22 + 0.02)
      vol.gain.exponentialRampToValueAtTime(0.0001, ahora + i * 0.22 + 0.16)
      osc.connect(vol).connect(ctx.destination)
      osc.start(ahora + i * 0.22)
      osc.stop(ahora + i * 0.22 + 0.18)
    }
  } catch { /* sin audio */ }
}

/** Hay que "despertar" el audio con un toque del usuario (requisito de los navegadores en el celular) */
export function prepararAudio() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = ctx ?? new AC()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  } catch { /* sin audio */ }
}
