import { useEffect, useState } from 'react'
import { BarChart3, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { calculateHandicap, getHandicapDisplay } from '../lib/handicap'
import type { Round, Course } from '../types/database'

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const [rounds, setRounds] = useState<Round[]>([])
  const [courses, setCourses] = useState<Map<string, Course>>(new Map())
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.full_name ?? '')

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  useEffect(() => {
    setName(profile?.full_name ?? '')
  }, [profile])

  async function loadData() {
    const [roundsRes, coursesRes] = await Promise.all([
      supabase
        .from('rounds')
        .select('*, course:courses(*)')
        .eq('user_id', user!.id)
        .order('date', { ascending: false }),
      supabase.from('courses').select('*'),
    ])
    if (roundsRes.data) setRounds(roundsRes.data as Round[])
    if (coursesRes.data) {
      const map = new Map<string, Course>()
      coursesRes.data.forEach((c) => map.set((c as Course).id, c as Course))
      setCourses(map)
    }
    setLoading(false)
  }

  async function saveName() {
    await updateProfile({ full_name: name })
    setEditing(false)
  }

  const coursePars = new Map<string, number>()
  courses.forEach((c, id) => coursePars.set(id, c.par))

  const handicap = calculateHandicap(rounds, coursePars)
  const avgScore = rounds.length > 0
    ? Math.round(rounds.reduce((s, r) => s + r.total_score, 0) / rounds.length * 10) / 10
    : null
  const avgPutts = rounds.filter((r) => r.total_putts).length > 0
    ? Math.round(rounds.filter((r) => r.total_putts).reduce((s, r) => s + (r.total_putts ?? 0), 0) / rounds.filter((r) => r.total_putts).length * 10) / 10
    : null
  const avgGir = rounds.filter((r) => r.greens_in_regulation !== null).length > 0
    ? Math.round(rounds.filter((r) => r.greens_in_regulation !== null).reduce((s, r) => s + (r.greens_in_regulation ?? 0), 0) / rounds.filter((r) => r.greens_in_regulation !== null).length * 10) / 10
    : null
  const avgFw = rounds.filter((r) => r.fairways_hit !== null).length > 0
    ? Math.round(rounds.filter((r) => r.fairways_hit !== null).reduce((s, r) => s + (r.fairways_hit ?? 0), 0) / rounds.filter((r) => r.fairways_hit !== null).length * 10) / 10
    : null

  // Score distribution for chart
  const scoreDistribution = rounds.reduce((acc, r) => {
    const par = r.course?.par ?? 72
    const diff = r.total_score - par
    const bucket = diff <= -3 ? '-3+' : diff <= -1 ? '-1 to -2' : diff === 0 ? 'Even' : diff <= 2 ? '+1 to +2' : diff <= 5 ? '+3 to +5' : diff <= 10 ? '+6 to +10' : '11+'
    acc[bucket] = (acc[bucket] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const distData = Object.entries(scoreDistribution).map(([name, value]) => ({ name, value }))

  const COLORS = ['#16a34a', '#22c55e', '#86efac', '#fbbf24', '#f97316', '#ef4444', '#dc2626']

  // Monthly averages
  const monthlyAvg = rounds.reduce((acc, r) => {
    const month = format(new Date(r.date), 'MMM yyyy')
    if (!acc[month]) acc[month] = { total: 0, count: 0 }
    acc[month].total += r.total_score
    acc[month].count++
    return acc
  }, {} as Record<string, { total: number; count: number }>)

  const monthlyData = Object.entries(monthlyAvg)
    .map(([month, { total, count }]) => ({ month, avg: Math.round(total / count * 10) / 10 }))
    .reverse()
    .slice(0, 12)
    .reverse()

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Profile header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl font-bold text-green-700 dark:text-green-400">
            {(profile?.full_name ?? '?')[0].toUpperCase()}
          </span>
        </div>
        {editing ? (
          <div className="flex items-center gap-2 justify-center">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <button onClick={saveName} className="text-green-600 text-sm font-medium">Save</button>
            <button onClick={() => setEditing(false)} className="text-gray-400 text-sm">Cancel</button>
          </div>
        ) : (
          <h2 className="text-xl font-bold text-gray-900 dark:text-white" onClick={() => setEditing(true)}>
            {profile?.full_name ?? 'Player'} <Edit size={14} className="inline text-gray-400" />
          </h2>
        )}
        <p className="text-sm text-gray-500">{profile?.email}</p>
        <p className="text-xs text-gray-400 mt-1 capitalize">{profile?.role}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Handicap" value={getHandicapDisplay(handicap)} />
        <MiniStat label="Avg Score" value={avgScore?.toFixed(1) ?? '--'} />
        <MiniStat label="Rounds" value={rounds.length.toString()} />
        <MiniStat label="Avg Putts" value={avgPutts?.toFixed(1) ?? '--'} />
        <MiniStat label="Avg GIR" value={avgGir !== null ? `${avgGir.toFixed(1)}/18` : '--'} />
        <MiniStat label="Avg FW" value={avgFw !== null ? `${avgFw.toFixed(1)}/14` : '--'} />
      </div>

      {/* Monthly average chart */}
      {monthlyData.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <BarChart3 size={18} /> Monthly Average
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={10} stroke="#9ca3af" />
              <YAxis domain={['dataMin - 3', 'dataMax + 3']} fontSize={11} stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="avg" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Score distribution */}
      {distData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Target size={18} /> Score vs Par Distribution
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={distData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {distData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-sm">
      <div className="text-xs text-gray-500 uppercase">{label}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}

function Edit({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 4H4a2 2 0 0 2-2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
