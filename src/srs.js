export function sm2(card, quality) {
  let { easeFactor = 2.5, interval = 0, repetitions = 0 } = card
  if (quality >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions++
  } else {
    repetitions = 0
    interval = 1
  }
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + interval)
  let status = card.status || 'new'
  if (repetitions >= 5 && interval >= 21) status = 'mastered'
  else status = 'review'
  return { easeFactor, interval, repetitions, dueDate: dueDate.toISOString(), lastReview: new Date().toISOString(), status }
}

export function isDue(card) {
  if (!card.dueDate) return true
  const due = new Date(card.dueDate)
  due.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return due <= now
}

export function getDaysUntil(card) {
  if (!card.dueDate) return 0
  return Math.ceil((new Date(card.dueDate) - new Date()) / 86400000)
}
