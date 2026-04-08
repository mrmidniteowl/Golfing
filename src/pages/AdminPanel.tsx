import { useEffect, useState } from 'react'
import { Shield, Lock, Unlock, Trash2, Download, Users, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile, Round, Course } from '../types/database'

export default function AdminPanel() {
  const { profile: currentProfile } = useAuth()
  const [players, setPlayers] = useState<Profile[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [_courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'players' | 'rounds' | 'reports'>('players')
  const [editingScore, setEditingScore] = useState<{ id: string; score: number } | null>(null)

  const isAdmin = currentProfile?.role === 'commissioner' || currentProfile?.role === 'admin'

  useEffect(() => {
    if (!isAdmin) return
    loadData()
  }, [isAdmin])

  async function loadData() {
    const [p, r, c] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('rounds').select('*, course:courses(*), profile:profiles(*)').order('date', { ascending: false }),
      supabase.from('courses').select('*').order('name'),
    ])
    if (p.data) setPlayers(p.data as Profile[])
    if (r.data) setRounds(r.data as Round[])
    if (c.data) setCourses(c.data as Course[])
    setLoading(false)
  }

  async function toggleLock(roundId: string, currentLock: boolean) {
    await supabase.from('rounds').update({ is_locked: !currentLock }).eq('id', roundId)
    setRounds((prev) => prev.map((r) => r.id === roundId ? { ...r, is_locked: !currentLock } : r))
  }

  async function updateScore(roundId: string, newScore: number) {
    await supabase.from('rounds').update({ total_score: newScore }).eq('id', roundId)
    setRounds((prev) => prev.map((r) => r.id === roundId ? { ...r, total_score: newScore } : r))
    setEditingScore(null)
  }

  async function deleteRound(roundId: string) {
    if (!confirm('Delete this round?')) return
    await supabase.from('hole_scores').delete().eq('round_id', roundId)
    await supabase.from('rounds').delete().eq('id', roundId)
    setRounds((prev) => prev.filter((r) => r.id !== roundId))
  }

  async function changeRole(userId: string, newRole: 'player' | 'commissioner') {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setPlayers((prev) => prev.map((p) => p.id === userId ? { ...p, role: newRole } : p))
  }

  function exportCSV() {
    const headers = 'Player,Date,Course,Score,Putts,FW Hit,GIR,Notes\n'
    const rows = rounds.map((r) =>
      `"${r.profile?.full_name ?? ''}","${r.date}","${r.course?.name ?? ''}",${r.total_score},${r.total_putts ?? ''},${r.fairways_hit ?? ''},${r.greens_in_regulation ?? ''},"${r.notes ?? ''}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `golf-scores-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function generateWeeklyReport(): string {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const weeklyRounds = rounds.filter((r) => new Date(r.date) >= oneWeekAgo)
    if (weeklyRounds.length === 0) return 'No rounds this week.'

    let report = `Weekly Summary (${format(oneWeekAgo, 'MMM d')} - ${format(new Date(), 'MMM d, yyyy')})\n\n`
    report += `Total Rounds: ${weeklyRounds.length}\n\n`

    const byPlayer = weeklyRounds.reduce((acc, r) => {
      const name = r.profile?.full_name ?? 'Unknown'
      if (!acc[name]) acc[name] = []
      acc[name].push(r)
      return acc
    }, {} as Record<string, Round[]>)

    for (const [name, pRounds] of Object.entries(byPlayer)) {
      const avg = Math.round(pRounds.reduce((s, r) => s + r.total_score, 0) / pRounds.length)
      const best = Math.min(...pRounds.map((r) => r.total_score))
      report += `${name}: ${pRounds.length} round(s), Avg: ${avg}, Best: ${best}\n`
    }

    return report
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Shield size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Admin Access Required</h2>
        <p className="text-gray-500">Contact your league commissioner to get admin access.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Shield size={24} className="text-green-600" /> Commissioner Panel
      </h2>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['players', 'rounds', 'reports'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${
              tab === t
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Players tab */}
      {tab === 'players' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{players.length} Players</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {players.map((player) => (
              <div key={player.id} className="flex items-center px-4 py-3">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">{player.full_name}</div>
                  <div className="text-xs text-gray-500">{player.email}</div>
                </div>
                <select
                  value={player.role}
                  onChange={(e) => changeRole(player.id, e.target.value as 'player' | 'commissioner')}
                  className="text-xs border rounded-lg px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <option value="player">Player</option>
                  <option value="commissioner">Commissioner</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rounds tab */}
      {tab === 'rounds' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rounds.slice(0, 50).map((round) => (
              <div key={round.id} className="flex items-center px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {round.profile?.full_name} - {round.course?.name}
                  </div>
                  <div className="text-xs text-gray-500">{format(new Date(round.date), 'MMM d, yyyy')}</div>
                </div>
                <div className="flex items-center gap-2">
                  {editingScore?.id === round.id ? (
                    <input
                      type="number"
                      value={editingScore.score}
                      onChange={(e) => setEditingScore({ id: round.id, score: Number(e.target.value) })}
                      onBlur={() => updateScore(round.id, editingScore.score)}
                      onKeyDown={(e) => e.key === 'Enter' && updateScore(round.id, editingScore.score)}
                      className="w-16 px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="font-bold text-green-700 dark:text-green-400 cursor-pointer"
                      onClick={() => setEditingScore({ id: round.id, score: round.total_score })}
                    >
                      {round.total_score}
                    </span>
                  )}
                  <button
                    onClick={() => toggleLock(round.id, round.is_locked)}
                    className={`p-1.5 rounded-full ${round.is_locked ? 'text-yellow-600' : 'text-gray-400'} hover:bg-gray-100 dark:hover:bg-gray-800`}
                    title={round.is_locked ? 'Unlock' : 'Lock'}
                  >
                    {round.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <button
                    onClick={() => deleteRound(round.id)}
                    className="p-1.5 rounded-full text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <div className="space-y-4">
          <button
            onClick={exportCSV}
            className="w-full flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Download size={20} className="text-green-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white text-sm">Export All Scores (CSV)</div>
              <div className="text-xs text-gray-500">Download complete score history</div>
            </div>
          </button>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Calendar size={16} /> Weekly Summary
            </h3>
            <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">
              {generateWeeklyReport()}
            </pre>
            <button
              onClick={() => {
                const report = generateWeeklyReport()
                if (navigator.share) {
                  navigator.share({ title: 'Weekly Golf Report', text: report })
                } else {
                  navigator.clipboard.writeText(report)
                  alert('Report copied to clipboard!')
                }
              }}
              className="mt-3 text-sm text-green-700 dark:text-green-400 font-medium"
            >
              Share Report
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
