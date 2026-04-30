import type { Round, Course, Profile } from '../types/database'
import { PATRIOT_GOLF_CLUB } from './patriot-course'

const DEMO_COURSE: Course = {
  id: 'demo-course-1',
  name: PATRIOT_GOLF_CLUB.name,
  city: PATRIOT_GOLF_CLUB.city,
  state: PATRIOT_GOLF_CLUB.state,
  par: PATRIOT_GOLF_CLUB.par,
  hole_pars: PATRIOT_GOLF_CLUB.hole_pars,
  lat: 44.7833,
  lng: -88.0667,
  created_at: new Date().toISOString(),
}

function demoRound(daysAgo: number, score: number, putts: number, fw: number, gir: number): Round {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return {
    id: `demo-round-${daysAgo}`,
    user_id: 'demo-user',
    course_id: 'demo-course-1',
    date: date.toISOString().split('T')[0],
    total_score: score,
    total_putts: putts,
    fairways_hit: fw,
    greens_in_regulation: gir,
    total_penalties: 0,
    notes: null,
    is_locked: false,
    play_mode: 'non_league',
    league_id_night: null,
    team_name: null,
    nine_side: null,
    hole_count: 18,
    created_at: date.toISOString(),
    course: DEMO_COURSE,
  }
}

export const DEMO_ROUNDS: Round[] = [
  demoRound(2, 85, 32, 8, 7),
  demoRound(9, 88, 34, 7, 5),
  demoRound(16, 82, 30, 9, 8),
  demoRound(23, 90, 36, 6, 4),
  demoRound(30, 87, 33, 7, 6),
  demoRound(37, 84, 31, 8, 7),
  demoRound(44, 91, 35, 5, 4),
  demoRound(51, 86, 32, 8, 6),
]

export const DEMO_COURSES: Course[] = [DEMO_COURSE]

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-user',
    email: 'demo@golftracker.app',
    full_name: 'Demo Player',
    avatar_url: null,
    role: 'commissioner',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-2',
    email: 'joe@example.com',
    full_name: 'Joe Smith',
    avatar_url: null,
    role: 'player',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-3',
    email: 'mike@example.com',
    full_name: 'Mike Johnson',
    avatar_url: null,
    role: 'player',
    created_at: new Date().toISOString(),
  },
]

// Other players' demo rounds for leaderboard
export const ALL_DEMO_ROUNDS: Round[] = [
  ...DEMO_ROUNDS,
  { ...demoRound(2, 79, 29, 10, 10), id: 'demo-r-joe-1', user_id: 'demo-user-2', profile: DEMO_PROFILES[1] },
  { ...demoRound(9, 82, 31, 9, 8), id: 'demo-r-joe-2', user_id: 'demo-user-2', profile: DEMO_PROFILES[1] },
  { ...demoRound(16, 81, 30, 9, 9), id: 'demo-r-joe-3', user_id: 'demo-user-2', profile: DEMO_PROFILES[1] },
  { ...demoRound(23, 84, 32, 8, 7), id: 'demo-r-joe-4', user_id: 'demo-user-2', profile: DEMO_PROFILES[1] },
  { ...demoRound(30, 80, 29, 10, 9), id: 'demo-r-joe-5', user_id: 'demo-user-2', profile: DEMO_PROFILES[1] },
  { ...demoRound(2, 92, 36, 6, 4), id: 'demo-r-mike-1', user_id: 'demo-user-3', profile: DEMO_PROFILES[2] },
  { ...demoRound(9, 95, 38, 5, 3), id: 'demo-r-mike-2', user_id: 'demo-user-3', profile: DEMO_PROFILES[2] },
  { ...demoRound(16, 89, 34, 7, 5), id: 'demo-r-mike-3', user_id: 'demo-user-3', profile: DEMO_PROFILES[2] },
  { ...demoRound(23, 93, 37, 5, 3), id: 'demo-r-mike-4', user_id: 'demo-user-3', profile: DEMO_PROFILES[2] },
  { ...demoRound(30, 91, 35, 6, 4), id: 'demo-r-mike-5', user_id: 'demo-user-3', profile: DEMO_PROFILES[2] },
]
