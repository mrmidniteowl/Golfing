import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, TrendingUp, Calendar, Target, AlertTriangle, Wine } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { calculateHandicap, getHandicapDisplay } from '../lib/handicap'
import { PlayModeFilter, filterByMode, type PlayModeFilterValue } from '../components/PlayModeFilter'
import { DEMO_ROUNDS, DEMO_COURSES } from '../lib/demo-data'
import type { Round, Course } from '../types/database'

export default function Dashboard() {
  const { user, isDemo } = useAuth()
  const [rounds, setRounds] = useState<Round[]>([])
  const [courses, setCourses] = useState<Map<string, Course>>(new Map())
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<PlayModeFilterValue>('all')

  useEffect(() => {
    if (!user) return
    if (isDemo) {
      setRounds(DEMO_ROUNDS)
      const map = new Map<string, Course>()
      DEMO_COURSES.forEach((c) => map.set(c.id, c))
      setCourses(map)
      setLoading(false)
      return
    }
    if (!isSupabaseConfigured) { setLoading(false); return }
    loadData()
  }, [user, isDemo])

  async function loadData() {
    setLoading(true)
    const [roundsRes, coursesRes] = await Promise.all([
      supabase
        .from('rounds')
        .select('*, course:courses(*)')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(50),
      supabase.from('courses').select('*'),
    ])

    if (roundsRes.data) setRounds(roundsRes.data as Round[])
    if (coursesRes.data) {
      const map = new Map<string, Course>()
      coursesRes.data.forEach((c) => map.set(c.id, c as Course))
      setCourses(map)
    }
    setLoading(false)
  }

  const filteredRounds = filterByMode(rounds, mode)
  const handicap = calculateHandicap(filteredRounds, courses)
  const avgScore = filteredRounds.length > 0
    ? Math.round(filteredRounds.reduce((s, r) => s + r.total_score, 0) / filteredRounds.length * 10) / 10
    : null
  const bestScore = filteredRounds.length > 0 ? Math.min(...filteredRounds.map((r) => r.total_score)) : null
  const totalRounds = filteredRounds.length
  const avgPenalties = filteredRounds.length > 0
    ? Math.round(filteredRounds.reduce((s, r) => s + r.total_penalties, 0) / filteredRounds.length * 10) / 10
    : null
  const avgSpirits = filteredRounds.length > 0
    ? Math.round(filteredRounds.reduce((s, r) => s + r.total_spirits, 0) / filteredRounds.length * 10) / 10
    : null

  const chartData = [...filteredRounds]
    .reverse()
    .slice(-20)
    .map((r) => ({
      date: format(new Date(r.date), 'M/d'),
      score: r.total_score,
    }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 text-xs text-amber-700 dark:text-amber-400 text-center">
          Demo Mode — Connect Supabase for full functionality
        </div>
      )}

      {/* Quick action */}
      <Link
        to="/new-round"
        className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 shadow-lg transition"
      >
        <PlusCircle size={28} />
        <div className="text-left">
          <div className="font-bold text-lg">Enter New Round</div>
          <div className="text-green-100 text-sm">Track your scores hole-by-hole</div>
        </div>
      </Link>

      {/* Mode filter */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stats</span>
        <PlayModeFilter value={mode} onChange={setMode} />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Target size={20} />} label="Handicap" value={getHandicapDisplay(handicap)} color="green" />
        <StatCard icon={<TrendingUp size={20} />} label="Avg Score" value={avgScore?.toString() ?? 'N/A'} color="blue" />
        <StatCard icon={<Calendar size={20} />} label="Rounds" value={totalRounds.toString()} color="purple" />
        <StatCard icon={<TrendingUp size={20} />} label="Best Score" value={bestScore?.toString() ?? 'N/A'} color="orange" />
        <StatCard icon={<AlertTriangle size={20} />} label="Avg Penalties" value={avgPenalties?.toFixed(1) ?? 'N/A'} color="red" />
        <StatCard icon={<Wine size={20} />} label="Avg Spirits" value={avgSpirits?.toFixed(1) ?? 'N/A'} color="amber" />
      </div>

      {/* Score trend chart */}
      {chartData.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Score Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" fontSize={12} stroke="#9ca3af" />
              <YAxis domain={['dataMin - 3', 'dataMax + 3']} fontSize={12} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ fill: '#16a34a', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent rounds */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 px-4 pt-4 pb-2">Recent Rounds</h3>
        {filteredRounds.length === 0 ? (
          <p className="text-gray-500 px-4 pb-4 text-sm">No rounds yet. Enter your first round!</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredRounds.slice(0, 10).map((round) => (
              <Link
                key={round.id}
                to={`/round/${round.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {round.course?.name ?? 'Unknown Course'}
                  </div>
                  <div className="text-xs text-gray-500">{format(new Date(round.date), 'MMM d, yyyy')}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-700 dark:text-green-400">{round.total_score}</div>
                  {round.course && (
                    <div className="text-xs text-gray-500">
                      {round.total_score - round.course.par >= 0 ? '+' : ''}
                      {round.total_score - round.course.par}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400',
    blue: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400',
  }

  return (
    <div className={`rounded-2xl p-4 ${colorMap[color] ?? colorMap.green}`}>
      <div className="flex items-center gap-2 mb-1 opacity-80">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
