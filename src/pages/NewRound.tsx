import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Loader2, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentPosition, findNearbyCourses, type NearbyPlace } from '../lib/gps'
import { isOnline, queueOfflineAction } from '../lib/offline'
import type { Course, PlayMode, NineSide, HoleCount } from '../types/database'
import { PATRIOT_GOLF_CLUB } from '../lib/patriot-course'

const DEFAULT_PARS = PATRIOT_GOLF_CLUB.hole_pars

const LEAGUE_ID_NIGHT_OPTIONS = ['PGC.Thursday', 'PGC.Test'] as const
const TEAM_NAME_OPTIONS = ['Wisconsin Knights', 'Test'] as const

export default function NewRound() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'course' | 'setup' | 'scores'>('course')
  const [courses, setCourses] = useState<Course[]>([])
  const [nearbyCourses, setNearbyCourses] = useState<NearbyPlace[]>([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [scores, setScores] = useState<number[]>(Array(18).fill(0))
  const [putts, setPutts] = useState<(number | null)[]>(Array(18).fill(null))
  const [fairways, setFairways] = useState<(boolean | null)[]>(Array(18).fill(null))
  const [girs, setGirs] = useState<(boolean | null)[]>(Array(18).fill(null))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourseName, setNewCourseName] = useState('')
  const [newCoursePar, setNewCoursePar] = useState(72)
  const [playMode, setPlayMode] = useState<PlayMode>('non_league')
  const [leagueIdNight, setLeagueIdNight] = useState<string>('')
  const [teamName, setTeamName] = useState<string>('')
  const [holeCount, setHoleCount] = useState<HoleCount>(18)
  const [nineSide, setNineSide] = useState<NineSide | ''>('')

  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    const { data } = await supabase.from('courses').select('*').order('name')
    if (data) setCourses(data as Course[])
  }

  async function detectLocation() {
    setGpsLoading(true)
    try {
      const pos = await getCurrentPosition()
      const nearby = await findNearbyCourses(pos.coords.latitude, pos.coords.longitude)
      setNearbyCourses(nearby)
    } catch {
      // GPS not available or denied
    }
    setGpsLoading(false)
  }

  async function addCourse() {
    if (!newCourseName.trim()) return
    const { data } = await supabase
      .from('courses')
      .insert({
        name: newCourseName.trim(),
        par: newCoursePar,
        hole_pars: DEFAULT_PARS,
        city: null,
        state: null,
        lat: null,
        lng: null,
      })
      .select()
      .single()
    if (data) {
      const course = data as Course
      setCourses((prev) => [...prev, course])
      setSelectedCourse(course)
      setShowAddCourse(false)
      setNewCourseName('')
    }
  }

  function selectNearby(place: NearbyPlace) {
    const existing = courses.find((c) => c.name.toLowerCase() === place.name.toLowerCase())
    if (existing) {
      setSelectedCourse(existing)
    } else {
      setNewCourseName(place.name)
      setShowAddCourse(true)
    }
  }

  function updateScore(hole: number, value: number) {
    setScores((prev) => {
      const next = [...prev]
      next[hole] = value
      return next
    })
  }

  function updatePutts(hole: number, value: number | null) {
    setPutts((prev) => {
      const next = [...prev]
      next[hole] = value
      return next
    })
  }

  function getHoleRange(): [number, number] {
    if (holeCount === 18) return [0, 18]
    if (nineSide === 'back') return [9, 18]
    return [0, 9] // front (also the fallback for a not-yet-selected 9-hole round)
  }

  function isSetupValid(): boolean {
    if (playMode === 'league') {
      return leagueIdNight !== '' && teamName !== '' && nineSide !== ''
    }
    // non-league
    if (holeCount === 9) return nineSide !== ''
    return true
  }

  async function saveRound() {
    if (!user || !selectedCourse) return
    setSaving(true)

    const [start, end] = getHoleRange()
    const playedScores = scores.slice(start, end)
    const playedPutts = putts.slice(start, end)
    const playedFairways = fairways.slice(start, end)
    const playedGirs = girs.slice(start, end)

    const totalScore = playedScores.reduce((a, b) => a + b, 0)
    const totalPutts = playedPutts.some((p) => p !== null) ? playedPutts.reduce((a: number, p) => a + (p ?? 0), 0) : null
    const fwHit = playedFairways.some((f) => f !== null) ? playedFairways.filter((f) => f === true).length : null
    const girCount = playedGirs.some((g) => g !== null) ? playedGirs.filter((g) => g === true).length : null

    const roundData = {
      user_id: user.id,
      course_id: selectedCourse.id,
      date,
      total_score: totalScore,
      total_putts: totalPutts,
      fairways_hit: fwHit,
      greens_in_regulation: girCount,
      notes: notes || null,
      is_locked: false,
      play_mode: playMode,
      league_id_night: playMode === 'league' ? leagueIdNight : null,
      team_name: playMode === 'league' ? teamName : null,
      nine_side: holeCount === 9 ? (nineSide || null) : null,
      hole_count: holeCount,
    }

    if (!isOnline()) {
      queueOfflineAction({ type: 'insert_round', table: 'rounds', data: { ...roundData, scores, putts, fairways, girs } })
      navigate('/')
      setSaving(false)
      return
    }

    const { data: round, error } = await supabase.from('rounds').insert(roundData).select().single()
    if (error || !round) {
      alert('Failed to save round: ' + (error?.message ?? 'Unknown error'))
      setSaving(false)
      return
    }

    const holeScores = scores.map((strokes, i) => ({
      round_id: round.id,
      hole_number: i + 1,
      strokes,
      putts: putts[i],
      fairway_hit: fairways[i],
      gir: girs[i],
    })).filter((h, i) => h.strokes > 0 && i >= start && i < end)

    if (holeScores.length > 0) {
      await supabase.from('hole_scores').insert(holeScores)
    }

    setSaving(false)
    navigate('/')
  }

  const filteredCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const holePars = selectedCourse?.hole_pars ?? DEFAULT_PARS

  if (step === 'course') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Round</h2>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* GPS detection */}
        <button
          onClick={detectLocation}
          disabled={gpsLoading}
          className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-sm"
        >
          {gpsLoading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
          {gpsLoading ? 'Detecting...' : 'Find Nearby Courses'}
        </button>

        {nearbyCourses.length > 0 && (
          <div className="bg-green-50 dark:bg-green-950 rounded-xl p-3 space-y-2">
            <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase">Nearby Courses</p>
            {nearbyCourses.slice(0, 5).map((place, i) => (
              <button
                key={i}
                onClick={() => selectNearby(place)}
                className="w-full text-left px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-gray-700 transition"
              >
                <span className="font-medium text-gray-900 dark:text-white">{place.name}</span>
                <span className="text-gray-500 ml-2">{(place.distance / 1000).toFixed(1)} km</span>
              </button>
            ))}
          </div>
        )}

        {/* Course search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {filteredCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className={`w-full text-left px-4 py-3 rounded-xl transition text-sm ${
                selectedCourse?.id === course.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <span className="font-medium">{course.name}</span>
              <span className="opacity-70 ml-2">Par {course.par}</span>
            </button>
          ))}
        </div>

        {/* Add new course */}
        {!showAddCourse ? (
          <button
            onClick={() => setShowAddCourse(true)}
            className="text-sm text-green-700 dark:text-green-400 font-medium"
          >
            + Add New Course
          </button>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
            <input
              type="text"
              placeholder="Course name"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-gray-400">Par:</label>
              <input
                type="number"
                value={newCoursePar}
                onChange={(e) => setNewCoursePar(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={addCourse}
                className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Add
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setStep('setup')}
          disabled={!selectedCourse}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
        >
          Continue
        </button>
      </div>
    )
  }

  // Setup step: play mode, league fields, hole count, nine side
  if (step === 'setup') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCourse?.name}</h2>
            <p className="text-sm text-gray-500">Par {selectedCourse?.par} &middot; {date}</p>
          </div>
          <button onClick={() => setStep('course')} className="text-sm text-green-700 dark:text-green-400">
            Change
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Play Mode</label>
          <select
            value={playMode}
            onChange={(e) => {
              const mode = e.target.value as PlayMode
              setPlayMode(mode)
              if (mode === 'league') {
                setHoleCount(9)
              } else {
                setHoleCount(18)
                setLeagueIdNight('')
                setTeamName('')
                setNineSide('')
              }
            }}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="non_league">Non-League</option>
            <option value="league">League</option>
          </select>
        </div>

        {playMode === 'league' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">League ID.Night</label>
              <select
                value={leagueIdNight}
                onChange={(e) => setLeagueIdNight(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select...</option>
                {LEAGUE_ID_NIGHT_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Name</label>
              <select
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select...</option>
                {TEAM_NAME_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-xl px-4 py-3 text-sm text-green-800 dark:text-green-300">
              9 Holes (automatic for League play)
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nine</label>
              <select
                value={nineSide}
                onChange={(e) => setNineSide(e.target.value as NineSide | '')}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select...</option>
                <option value="front">Front (Holes 1-9)</option>
                <option value="back">Back (Holes 10-18)</option>
              </select>
            </div>
          </>
        )}

        {playMode === 'non_league' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Holes</label>
              <select
                value={holeCount}
                onChange={(e) => {
                  const hc = Number(e.target.value) as HoleCount
                  setHoleCount(hc)
                  if (hc === 18) setNineSide('')
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value={18}>18 Holes</option>
                <option value={9}>9 Holes</option>
              </select>
            </div>

            {holeCount === 9 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nine</label>
                <select
                  value={nineSide}
                  onChange={(e) => setNineSide(e.target.value as NineSide | '')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select...</option>
                  <option value="front">Front (Holes 1-9)</option>
                  <option value="back">Back (Holes 10-18)</option>
                </select>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => setStep('scores')}
          disabled={!isSetupValid()}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
        >
          Continue to Scores
        </button>
      </div>
    )
  }

  // Score entry step
  const [holeStart, holeEnd] = getHoleRange()
  const showFront = holeStart === 0
  const showBack = holeEnd === 18
  const playedScoresHaveValue = scores.slice(holeStart, holeEnd).some((s) => s > 0)
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCourse?.name}</h2>
          <p className="text-sm text-gray-500">Par {selectedCourse?.par} &middot; {date}</p>
        </div>
        <button onClick={() => setStep('setup')} className="text-sm text-green-700 dark:text-green-400">
          Change
        </button>
      </div>

      {showFront && (
        <ScoreSection
          title="Front 9"
          holeStart={0}
          holeEnd={9}
          holePars={holePars}
          scores={scores}
          putts={putts}
          fairways={fairways}
          girs={girs}
          onScoreChange={updateScore}
          onPuttsChange={updatePutts}
          onFairwayChange={(h, v) => setFairways((p) => { const n = [...p]; n[h] = v; return n })}
          onGirChange={(h, v) => setGirs((p) => { const n = [...p]; n[h] = v; return n })}
        />
      )}

      {showBack && (
        <ScoreSection
          title="Back 9"
          holeStart={9}
          holeEnd={18}
          holePars={holePars}
          scores={scores}
          putts={putts}
          fairways={fairways}
          girs={girs}
          onScoreChange={updateScore}
          onPuttsChange={updatePutts}
          onFairwayChange={(h, v) => setFairways((p) => { const n = [...p]; n[h] = v; return n })}
          onGirChange={(h, v) => setGirs((p) => { const n = [...p]; n[h] = v; return n })}
        />
      )}

      {/* Total */}
      <div className="bg-green-50 dark:bg-green-950 rounded-xl p-4 flex justify-between items-center">
        <span className="font-semibold text-green-800 dark:text-green-300">Total Score</span>
        <span className="text-2xl font-bold text-green-700 dark:text-green-400">
          {scores.slice(holeStart, holeEnd).reduce((a, b) => a + b, 0) || '--'}
        </span>
      </div>

      {/* Notes */}
      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
      />

      <button
        onClick={saveRound}
        disabled={saving || !playedScoresHaveValue}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
      >
        {saving ? 'Saving...' : 'Save Round'}
      </button>
    </div>
  )
}

interface ScoreSectionProps {
  title: string
  holeStart: number
  holeEnd: number
  holePars: number[]
  scores: number[]
  putts: (number | null)[]
  fairways: (boolean | null)[]
  girs: (boolean | null)[]
  onScoreChange: (hole: number, value: number) => void
  onPuttsChange: (hole: number, value: number | null) => void
  onFairwayChange: (hole: number, value: boolean | null) => void
  onGirChange: (hole: number, value: boolean | null) => void
}

function ScoreSection({ title, holeStart, holeEnd, holePars, scores, putts, fairways, girs, onScoreChange, onPuttsChange, onFairwayChange, onGirChange }: ScoreSectionProps) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const sectionTotal = scores.slice(holeStart, holeEnd).reduce((a, b) => a + b, 0)
  const sectionPar = holePars.slice(holeStart, holeEnd).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-800">
        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{title}</span>
        <span className="text-sm text-gray-500">
          {sectionTotal || '--'} / Par {sectionPar}
        </span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: holeEnd - holeStart }, (_, i) => {
          const hole = holeStart + i
          const par = holePars[hole] ?? 4
          const score = scores[hole]
          const isExpanded = expanded === hole

          let scoreBg = ''
          if (score > 0) {
            if (score < par) scoreBg = 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' // birdie or better
            else if (score === par) scoreBg = 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
            else if (score === par + 1) scoreBg = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
            else scoreBg = 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
          }

          return (
            <div key={hole}>
              <div
                className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setExpanded(isExpanded ? null : hole)}
              >
                <span className="w-12 text-sm font-medium text-gray-500">#{hole + 1}</span>
                <span className="w-16 text-xs text-gray-400">Par {par}</span>
                <div className="flex-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                    <button
                      key={v}
                      onClick={(e) => { e.stopPropagation(); onScoreChange(hole, v) }}
                      className={`w-7 h-7 rounded-full text-xs font-medium transition ${
                        score === v
                          ? scoreBg || 'bg-green-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expanded stats */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-1 flex flex-wrap gap-3 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Putts:</label>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((v) => (
                        <button
                          key={v}
                          onClick={() => onPuttsChange(hole, v)}
                          className={`w-7 h-7 rounded-full text-xs ${
                            putts[hole] === v
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => onFairwayChange(hole, fairways[hole] === true ? null : true)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      fairways[hole] === true
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Fairway Hit
                  </button>
                  <button
                    onClick={() => onGirChange(hole, girs[hole] === true ? null : true)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      girs[hole] === true
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Green in Regulation
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
