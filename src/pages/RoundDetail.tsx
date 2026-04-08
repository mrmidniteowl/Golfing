import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Share2 } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
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
        <SummaryCard label="vs Par" value={`${round.total_score - (round.course?.par ?? 72) >= 0 ? '+' : ''}${round.total_score - (round.course?.par ?? 72)}`} />
        <SummaryCard label="Putts" value={round.total_putts?.toString() ?? '--'} />
        <SummaryCard label="GIR" value={round.greens_in_regulation !== null ? `${round.greens_in_regulation}/18` : '--'} />
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
                <th className="px-3 py-2">Putts</th>
                <th className="px-3 py-2">FW</th>
                <th className="px-3 py-2">GIR</th>
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
                    <td className="px-3 py-2 text-center text-gray-500">{hs.putts ?? '-'}</td>
                    <td className="px-3 py-2 text-center">{hs.fairway_hit === true ? '✓' : hs.fairway_hit === false ? '✗' : '-'}</td>
                    <td className="px-3 py-2 text-center">{hs.gir === true ? '✓' : hs.gir === false ? '✗' : '-'}</td>
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
