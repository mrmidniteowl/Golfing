import { useEffect, useState } from 'react'
import { Shield, Lock, Unlock, Trash2, Download, Users, Calendar, Pencil, KeyRound, UserPlus } from 'lucide-react'
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
  const [tab, setTab] = useState<'players' | 'rounds' | 'scorecards' | 'reports'>('players')
  const [editingScore, setEditingScore] = useState<{ id: string; score: number } | null>(null)
  const [editingName, setEditingName] = useState<{ id: string; value: string } | null>(null)
  const [pwModalUser, setPwModalUser] = useState<Profile | null>(null)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newPlayerEmail, setNewPlayerEmail] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerPw, setNewPlayerPw] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSubmitting, setCreateSubmitting] = useState(false)

  const [scTeam, setScTeam] = useState('')
  const [scPlayer, setScPlayer] = useState('')
  const [scRoundId, setScRoundId] = useState('')
  const [scHoleScores, setScHoleScores] = useState<{ id: string; hole_number: number; strokes: number; putts: number | null; fairway_hit: boolean | null; gir: boolean | null }[]>([])
  const [scEdits, setScEdits] = useState<Record<number, number>>({})
  const [scSaving, setScSaving] = useState(false)

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

  async function loadScorecard(roundId: string) {
    setScRoundId(roundId)
    setScEdits({})
    const { data } = await supabase
      .from('hole_scores')
      .select('*')
      .eq('round_id', roundId)
      .order('hole_number')
    setScHoleScores((data ?? []) as typeof scHoleScores)
  }

  async function saveScorecard() {
    if (!scRoundId) return
    setScSaving(true)
    const updates = Object.entries(scEdits).map(([holeNum, strokes]) => {
      const existing = scHoleScores.find((h) => h.hole_number === Number(holeNum))
      if (existing) {
        return supabase.from('hole_scores').update({ strokes }).eq('id', existing.id)
      }
      return supabase.from('hole_scores').insert({ round_id: scRoundId, hole_number: Number(holeNum), strokes })
    })
    await Promise.all(updates)
    const updatedHoles = scHoleScores.map((h) =>
      scEdits[h.hole_number] !== undefined ? { ...h, strokes: scEdits[h.hole_number] } : h
    )
    const newTotal = updatedHoles.reduce((s, h) => s + h.strokes, 0)
    await supabase.from('rounds').update({ total_score: newTotal }).eq('id', scRoundId)
    setRounds((prev) => prev.map((r) => r.id === scRoundId ? { ...r, total_score: newTotal } : r))
    setScHoleScores(updatedHoles)
    setScEdits({})
    setScSaving(false)
  }

  async function changeRole(userId: string, newRole: 'player' | 'commissioner') {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setPlayers((prev) => prev.map((p) => p.id === userId ? { ...p, role: newRole } : p))
  }

  async function saveName(userId: string) {
    if (!editingName) return
    const trimmed = editingName.value.trim()
    if (trimmed.length === 0) {
      setEditingName(null)
      return
    }
    const { error } = await supabase.from('profiles').update({ full_name: trimmed }).eq('id', userId)
    if (error) {
      alert('Failed to update name: ' + error.message)
      return
    }
    setPlayers((prev) => prev.map((p) => p.id === userId ? { ...p, full_name: trimmed } : p))
    setEditingName(null)
  }

  async function submitCreatePlayer() {
    setCreateError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPlayerEmail)) {
      setCreateError('Please enter a valid email address.')
      return
    }
    if (newPlayerName.trim().length === 0) {
      setCreateError('Full name is required.')
      return
    }
    if (newPlayerPw.length < 8) {
      setCreateError('Password must be at least 8 characters.')
      return
    }

    setCreateSubmitting(true)
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email: newPlayerEmail.trim(),
        password: newPlayerPw,
        fullName: newPlayerName.trim(),
      },
    })
    setCreateSubmitting(false)

    if (error) {
      setCreateError('Failed to create player: ' + error.message)
      return
    }
    if (data && typeof data === 'object' && 'error' in data) {
      setCreateError(String((data as { error: string }).error))
      return
    }

    alert(`Player ${newPlayerName} created. Email: ${newPlayerEmail}, password: ${newPlayerPw}. Send those credentials to them out-of-band.`)
    setCreateModalOpen(false)
    setNewPlayerEmail('')
    setNewPlayerName('')
    setNewPlayerPw('')
    // Refresh player list to show the newcomer
    loadData()
  }

  async function submitPasswordReset() {
    if (!pwModalUser) return
    setPwError(null)
    if (newPw.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }
    if (newPw !== confirmPw) {
      setPwError('Passwords do not match.')
      return
    }

    setPwSubmitting(true)
    const { error } = await supabase.functions.invoke('admin-set-password', {
      body: { targetUserId: pwModalUser.id, newPassword: newPw },
    })
    setPwSubmitting(false)

    if (error) {
      setPwError('Failed to reset password: ' + error.message)
      return
    }

    alert(`Password updated for ${pwModalUser.full_name}. Make sure to communicate the new password to them out-of-band.`)
    setPwModalUser(null)
    setNewPw('')
    setConfirmPw('')
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
        {(['players', 'rounds', 'scorecards', 'reports'] as const).map((t) => (
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
            <button
              onClick={() => {
                setCreateModalOpen(true)
                setNewPlayerEmail('')
                setNewPlayerName('')
                setNewPlayerPw('')
                setCreateError(null)
              }}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
            >
              <UserPlus size={14} />
              New Player
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {players.map((player) => (
              <div key={player.id} className="flex items-center px-4 py-3 gap-2">
                <div className="flex-1 min-w-0">
                  {editingName?.id === player.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editingName.value}
                        onChange={(e) => setEditingName({ id: player.id, value: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveName(player.id)
                          if (e.key === 'Escape') setEditingName(null)
                        }}
                        className="flex-1 min-w-0 px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        autoFocus
                      />
                      <button onClick={() => saveName(player.id)} className="text-xs text-green-700 dark:text-green-400 font-medium">Save</button>
                      <button onClick={() => setEditingName(null)} className="text-xs text-gray-400">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{player.full_name}</span>
                      <button
                        onClick={() => setEditingName({ id: player.id, value: player.full_name })}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Edit name"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 truncate">{player.email}</div>
                </div>
                <select
                  value={player.role}
                  onChange={(e) => changeRole(player.id, e.target.value as 'player' | 'commissioner')}
                  className="text-xs border rounded-lg px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <option value="player">Player</option>
                  <option value="commissioner">Commissioner</option>
                </select>
                <button
                  onClick={() => { setPwModalUser(player); setNewPw(''); setConfirmPw(''); setPwError(null) }}
                  className="p-1.5 rounded-full text-gray-400 hover:text-green-700 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Reset password"
                >
                  <KeyRound size={14} />
                </button>
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

      {/* Scorecards tab */}
      {tab === 'scorecards' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 font-semibold text-sm text-gray-700 dark:text-gray-300">Edit Scorecard</div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Team Name</label>
                <select
                  value={scTeam}
                  onChange={(e) => { setScTeam(e.target.value); setScPlayer(''); setScRoundId(''); setScHoleScores([]); setScEdits({}) }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select team...</option>
                  {[...new Set(rounds.filter((r) => r.team_name).map((r) => r.team_name!))].sort().map((tn) => (
                    <option key={tn} value={tn}>{tn}</option>
                  ))}
                </select>
              </div>
              {scTeam && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Player</label>
                  <select
                    value={scPlayer}
                    onChange={(e) => { setScPlayer(e.target.value); setScRoundId(''); setScHoleScores([]); setScEdits({}) }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select player...</option>
                    {players
                      .filter((p) => rounds.some((r) => r.user_id === p.id && r.team_name === scTeam))
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                  </select>
                </div>
              )}
              {scPlayer && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Round</label>
                  <select
                    value={scRoundId}
                    onChange={(e) => e.target.value && loadScorecard(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select round...</option>
                    {rounds
                      .filter((r) => r.user_id === scPlayer && r.team_name === scTeam)
                      .map((r) => (
                        <option key={r.id} value={r.id}>{r.date} — {r.course?.name ?? 'Unknown'} ({r.total_score})</option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {scRoundId && scHoleScores.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 font-semibold text-sm text-gray-700 dark:text-gray-300">Hole Scores</div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {scHoleScores.map((h) => (
                  <div key={h.id} className="flex items-center px-4 py-2 gap-3">
                    <span className="w-16 text-sm text-gray-500">Hole {h.hole_number}</span>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={scEdits[h.hole_number] ?? h.strokes}
                      onChange={(e) => setScEdits((prev) => ({ ...prev, [h.hole_number]: Number(e.target.value) }))}
                      className="w-20 px-2 py-1 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                    <span className="text-xs text-gray-400">
                      {h.putts !== null ? `${h.putts} putts` : ''}{h.fairway_hit ? ' · FW' : ''}{h.gir ? ' · GIR' : ''}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Total: {scHoleScores.map((h) => scEdits[h.hole_number] ?? h.strokes).reduce((a, b) => a + b, 0)}
                  {Object.keys(scEdits).length > 0 && <span className="text-amber-500 ml-2">(unsaved changes)</span>}
                </span>
                <button
                  onClick={saveScorecard}
                  disabled={scSaving || Object.keys(scEdits).length === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
                >
                  {scSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
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

      {/* New-player modal */}
      {createModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => !createSubmitting && setCreateModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">New Player</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Create an account for a buddy. They'll be able to log in immediately with the email + password you set.
            </p>
            <input
              type="text"
              placeholder="Full name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="w-full mb-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              autoFocus
            />
            <input
              type="email"
              placeholder="Email"
              value={newPlayerEmail}
              onChange={(e) => setNewPlayerEmail(e.target.value)}
              className="w-full mb-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="text"
              placeholder="Initial password (min 8 chars)"
              value={newPlayerPw}
              onChange={(e) => setNewPlayerPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitCreatePlayer()}
              className="w-full mb-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
            {createError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{createError}</p>
            )}
            <p className="text-xs text-gray-500 mb-4">
              Password is shown in plaintext on purpose so you can copy it to send to the player.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCreateModalOpen(false)}
                disabled={createSubmitting}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={submitCreatePlayer}
                disabled={createSubmitting}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium"
              >
                {createSubmitting ? 'Creating...' : 'Create Player'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password-reset modal */}
      {pwModalUser && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => !pwSubmitting && setPwModalUser(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Reset Password</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              For <span className="font-medium text-gray-700 dark:text-gray-300">{pwModalUser.full_name}</span> ({pwModalUser.email})
            </p>
            <input
              type="password"
              placeholder="New password (min 8 chars)"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full mb-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              autoFocus
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitPasswordReset()}
              className="w-full mb-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
            {pwError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{pwError}</p>
            )}
            <p className="text-xs text-gray-500 mb-4">
              You'll need to share the new password with the player yourself (text/phone). They can change it later from their own account.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPwModalUser(null)}
                disabled={pwSubmitting}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={submitPasswordReset}
                disabled={pwSubmitting}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium"
              >
                {pwSubmitting ? 'Updating...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
