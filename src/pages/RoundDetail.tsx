import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Share2 } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getRoundPar } from '../lib/handicap'
import type { Round, HoleScore } from '../types/database'

export default function RoundDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [round, setRound] = useState<Round | null>(null)
  const [holeScores, setHoleScores] = useState<HoleScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    loadRound()
  }, [id])

  async function loadRound() {
    const [roundRes, holesRes] = await Promise.all([
      supabase.from('rounds').select('*, course:courses(*)').eq('id', id!).single(),
      supabase.from('hole_scores').select('*').eq('round_id', id!).order('hole_number'),
    ])
    if (roundRes.data) setRound(roundRes.data as Round)
    if (holesRes.data) setHoleScores(holesRes.data as HoleScore[])
    setLoading(false)
  }

  async function deleteRound() {
    if (!confirm('Delete this round? This cannot be undone.')) return
    await supabase.from('hole_scores').delete().eq('round_id', id!)
    await supabase.from('rounds').delete().eq('id', id!)
    navigate('/')
  }

  async function shareRound() {
    if (!round) return
    const text = `${round.course?.name ?? 'Golf'} - Score: ${round.total_score} (${format(new Date(round.date), 'MMM d, yyyy')})`
    if (navigator.share) {
      await navigator.share({ title: 'Golf Round', text })
    } else {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>
  }

  if (!round) {
    return <div className="text-center py-12 text-gray-500">Round not found</div>
  }

  const isOwner = user?.id === round.user_id

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{round.course?.name}</h2>
          <p className="text-sm text-gray-500">{format(new Date(round.date), 'EEEE, MMMM d, yyyy')}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {round.play_mode === 'league' && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                League &middot; {round.league_id_night} &middot; {round.team_name}
              </span>
            )}
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
              {round.hole_count === 9
                ? `9 Holes (${round.nine_side === 'back' ? 'Back' : 'Front'})`
                : '18 Holes'}
            </span>
          </div>
        </div>
        {isOwner && !round.is_locked && (
          <div className="flex gap-2">
            <button onClick={shareRound} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <Share2 size={18} className="text-gray-500" />
            </button>
            <button onClick={deleteRound} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950">
              <Trash2 size={18} className="text-red-500" />
            </button>
          </div>
        )}
        {round.is_locked && (
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
            Locked
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="Score" value={round.total_score.toString()} />
        <SummaryCard label="vs Par" value={(() => {
          const par = getRoundPar(round, round.course)
          const diff = round.total_score - par
          return `${diff >= 0 ? '+' : ''}${diff}`
        })()} />
        <SummaryCard label="Putts" value={round.total_putts?.toString() ?? '--'} />
        <SummaryCard label="FW Hit" value={round.fairways_hit !== null ? `${round.fairways_hit}/${round.hole_count === 9 ? 7 : 14}` : '--'} />
        <SummaryCard label="GIR" value={round.greens_in_regulation !== null ? `${round.greens_in_regulation}/${round.hole_count}` : '--'} />
        <SummaryCard label="Penalties" value={(round.total_penalties ?? 0).toString()} />
        <SummaryCard label="Spirits" value={(round.total_spirits ?? 0).toString()} />
      </div>

      {/* Hole-by-hole */}
      {holeScores.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Scorecard</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <th className="px-3 py-2 text-left">Hole</th>
                <th className="px-3 py-2">Par</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">+/-</th>
                <th className="px-3 py-2">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {holeScores.map((hs) => {
                const par = round.course?.hole_pars?.[hs.hole_number - 1] ?? 4
                const diff = hs.strokes - par
                let color = 'text-gray-900 dark:text-white'
                if (diff < 0) color = 'text-red-600 dark:text-red-400 font-bold'
                else if (diff === 0) color = 'text-green-600 dark:text-green-400'
                else if (diff > 1) color = 'text-orange-600 dark:text-orange-400'

                return (
                  <tr key={hs.hole_number} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="px-3 py-2 text-gray-500">#{hs.hole_number}</td>
                    <td className="px-3 py-2 text-center text-gray-400">{par}</td>
                    <td className={`px-3 py-2 text-center ${color}`}>{hs.strokes}</td>
                    <td className={`px-3 py-2 text-center ${color}`}>{diff >= 0 ? '+' : ''}{diff}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{hs.penalty_strokes ? hs.penalty_strokes : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {round.notes && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400">{round.notes}</p>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-sm">
      <div className="text-xs text-gray-500 uppercase">{label}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}
