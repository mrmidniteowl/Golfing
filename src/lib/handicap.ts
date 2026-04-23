import type { Round, Course } from '../types/database'

/**
 * Returns the par baseline for a single round, taking into account hole_count
 * and nine_side. For 18-hole rounds this is the course total par. For 9-hole
 * rounds it's the sum of the played nine's hole pars (fallback: 36 for an
 * unknown course).
 */
export function getRoundPar(round: Round, course: Course | undefined): number {
  const defaultNinePar = 36
  const defaultFullPar = 72

  if (round.hole_count === 18) {
    if (course?.hole_pars && course.hole_pars.length >= 18) {
      return course.hole_pars.slice(0, 18).reduce((a, b) => a + b, 0)
    }
    return course?.par ?? defaultFullPar
  }

  // 9-hole round
  if (course?.hole_pars && course.hole_pars.length >= 18) {
    const side = round.nine_side === 'back'
      ? course.hole_pars.slice(9, 18)
      : course.hole_pars.slice(0, 9)
    return side.reduce((a, b) => a + b, 0)
  }
  return defaultNinePar
}

/**
 * Calculate rolling handicap from last N rounds.
 * Uses per-round par (via getRoundPar) so 9-hole and 18-hole rounds produce
 * differentials on a comparable scale.
 */
export function calculateHandicap(
  rounds: Round[],
  courses: Map<string, Course>,
  windowSize = 5
): number | null {
  if (rounds.length === 0) return null

  const recent = rounds
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, windowSize)

  if (recent.length < 3) return null

  const differentials = recent
    .map((r) => r.total_score - getRoundPar(r, courses.get(r.course_id)))
    .sort((a, b) => a - b)

  const countToUse = Math.max(1, Math.floor(differentials.length * 0.6))
  const bestDiffs = differentials.slice(0, countToUse)

  const avg = bestDiffs.reduce((sum, d) => sum + d, 0) / bestDiffs.length
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
