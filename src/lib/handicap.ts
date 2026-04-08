import type { Round } from '../types/database'

/**
 * Calculate rolling handicap from last N rounds.
 * Simple formula: average of (score - course par) for best rounds in window.
 * Uses the "best of" approach similar to USGA differential method.
 */
export function calculateHandicap(
  rounds: Round[],
  coursePars: Map<string, number>,
  windowSize = 5
): number | null {
  if (rounds.length === 0) return null

  // Get the most recent `windowSize` rounds
  const recent = rounds
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, windowSize)

  if (recent.length < 3) return null // Need at least 3 rounds

  const differentials = recent
    .map((r) => {
      const par = coursePars.get(r.course_id) || 72
      return r.total_score - par
    })
    .sort((a, b) => a - b)

  // Use best rounds based on count
  const countToUse = Math.max(1, Math.floor(differentials.length * 0.6))
  const bestDiffs = differentials.slice(0, countToUse)

  const avg = bestDiffs.reduce((sum, d) => sum + d, 0) / bestDiffs.length
  // Multiply by 0.96 (similar to USGA bonus for excellence)
  const handicap = Math.round(avg * 0.96 * 10) / 10

  return Math.max(0, handicap)
}

export function getHandicapDisplay(handicap: number | null): string {
  if (handicap === null) return 'N/A'
  return handicap.toFixed(1)
}

export function adjustedScore(grossScore: number, handicap: number): number {
  return Math.round(grossScore - handicap)
}
