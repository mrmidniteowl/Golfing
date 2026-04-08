import { useEffect, useState } from 'react'
import { Trophy, Medal } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { calculateHandicap, getHandicapDisplay, adjustedScore } from '../lib/handicap'
import { ALL_DEMO_ROUNDS, DEMO_PROFILES, DEMO_COURSES } from '../lib/demo-data'
import type { Round, Profile, Course } from '../types/database'

interface PlayerStats {
  profile: Profile
  rounds: Round[]
  handicap: number | null
  avgScore: number | null
  bestScore: number | null
  latestScore: number | null
  adjustedLatest: number | null
}

type SortMode = 'handicap' | 'average' | 'latest'

export default function Leaderboard() {
  const { isDemo } = useAuth()
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState<SortMode>('handicap')
  const [tab, setTab] = useState<'weekly' | 'season'>('weekly')

  useEffect(() => {
    if (isDemo) {
      loadDemoLeaderboard()
    } else if (isSupabaseConfigured) {
      loadLeaderboard()
    } else {
      setLoading(false)
    }
  }, [isDemo])

  function loadDemoLeaderboard() {
    const coursePars = new Map<string, number>()
    DEMO_COURSES.forEach((c) => coursePars.set(c.id, c.par))
    const stats = buildStats(DEMO_PROFILES, ALL_DEMO_ROUNDS, coursePars)
    setPlayers(stats)
    setLoading(false)
  }

  async function loadLeaderboard() {
    const [profilesRes, roundsRes, coursesRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('rounds').select('*').order('date', { ascending: false }),
      supabase.from('courses').select('*'),
    ])

    const profiles = (profilesRes.data ?? []) as Profile[]
    const rounds = (roundsRes.data ?? []) as Round[]
    const courseMap = new Map<string, Course>()
    ;(coursesRes.data ?? []).forEach((c) => courseMap.set((c as Course).id, c as Course))
    const coursePars = new Map<string, number>()
    courseMap.forEach((c, id) => coursePars.set(id, c.par))

    const stats = buildStats(profiles, rounds, coursePars)
    setPlayers(stats)
    setLoading(false)
  }

  function buildStats(profiles: Profile[], rounds: Round[], coursePars: Map<string, number>): PlayerStats[] {
    return profiles.map((profile) => {
      const playerRounds = rounds.filter((r) => r.user_id === profile.id)
      const handicap = calculateHandicap(playerRounds, coursePars)
      const avgScore = playerRounds.length > 0
        ? Math.round(playerRounds.reduce((s, r) => s + r.total_score, 0) / playerRounds.length * 10) / 10
        : null
      const bestScore = playerRounds.length > 0 ? Math.min(...playerRounds.map((r) => r.total_score)) : null
      const latestScore = playerRounds.length > 0 ? playerRounds[0].total_score : null
      const adjustedLatest = latestScore !== null && handicap !== null
        ? adjustedScore(latestScore, handicap)
        : null

      return { profile, rounds: playerRounds, handicap, avgScore, bestScore, latestScore, adjustedLatest }
    }).filter((p) => p.rounds.length > 0)
  }

  function getSorted() {
    const copy = [...players]
    if (tab === 'weekly') {
      return copy.sort((a, b) => {
        if (a.adjustedLatest === null) return 1
        if (b.adjustedLatest === null) return -1
        return a.adjustedLatest - b.adjustedLatest
      })
    }
    switch (sortMode) {
      case 'handicap':
        return copy.sort((a, b) => (a.handicap ?? 999) - (b.handicap ?? 999))
      case 'average':
        return copy.sort((a, b) => (a.avgScore ?? 999) - (b.avgScore ?? 999))
      case 'latest':
        return copy.sort((a, b) => (a.latestScore ?? 999) - (b.latestScore ?? 999))
    }
  }

  const sorted = getSorted()

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Trophy size={24} className="text-yellow-500" /> Leaderboard
      </h2>

      {/* Tabs */}
      <div className="flex gap-2">
        <TabButton active={tab === 'weekly'} onClick={() => setTab('weekly')}>Weekly</TabButton>
        <TabButton active={tab === 'season'} onClick={() => setTab('season')}>Season</TabButton>
      </div>

      {tab === 'season' && (
        <div className="flex gap-2">
          <SortButton active={sortMode === 'handicap'} onClick={() => setSortMode('handicap')}>Handicap</SortButton>
          <SortButton active={sortMode === 'average'} onClick={() => setSortMode('average')}>Average</SortButton>
          <SortButton active={sortMode === 'latest'} onClick={() => setSortMode('latest')}>Total</SortButton>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No rounds recorded yet.</p>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          {sorted.map((player, i) => (
            <div
              key={player.profile.id}
              className="flex items-center px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0"
            >
              <div className="w-8 flex-shrink-0">
                {i === 0 ? <Medal size={20} className="text-yellow-500" /> :
                 i === 1 ? <Medal size={20} className="text-gray-400" /> :
                 i === 2 ? <Medal size={20} className="text-amber-600" /> :
                 <span className="text-sm text-gray-400 font-medium">{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {player.profile.full_name}
                </div>
                <div className="text-xs text-gray-500">
                  {player.rounds.length} round{player.rounds.length !== 1 ? 's' : ''} &middot; HCP {getHandicapDisplay(player.handicap)}
                </div>
              </div>
              <div className="text-right">
                {tab === 'weekly' ? (
                  <>
                    <div className="text-lg font-bold text-green-700 dark:text-green-400">
                      {player.adjustedLatest ?? player.latestScore ?? '--'}
                    </div>
                    <div className="text-xs text-gray-500">adj. score</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold text-green-700 dark:text-green-400">
                      {sortMode === 'handicap' ? getHandicapDisplay(player.handicap) :
                       sortMode === 'average' ? (player.avgScore?.toFixed(1) ?? '--') :
                       player.latestScore ?? '--'}
                    </div>
                    <div className="text-xs text-gray-500">{sortMode}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
        active
          ? 'bg-green-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function SortButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
        active
          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  )
}
