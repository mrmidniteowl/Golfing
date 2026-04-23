import { useState, type ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured as isConfigured } from '../lib/supabase'

function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-8 pb-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${import.meta.env.BASE_URL}auth-bg.png')` }}
      />
      <div className="absolute inset-0 bg-green-50/50 dark:bg-gray-950/60" />
      <div className="relative z-10 w-full flex items-start justify-center">
        {children}
      </div>
    </div>
  )
}

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (isSignUp) {
      const { error: err } = await signUp(email, password, fullName)
      if (err) setError(err)
      else setSignUpSuccess(true)
    } else {
      const { error: err } = await signIn(email, password)
      if (err) setError(err)
    }
    setLoading(false)
  }

  const handleDemo = () => {
    localStorage.setItem('golf_demo_mode', 'true')
    window.location.reload()
  }

  if (signUpSuccess) {
    return (
      <AuthBackground>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">&#9989;</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <button
            onClick={() => { setSignUpSuccess(false); setIsSignUp(false) }}
            className="text-green-700 dark:text-green-400 font-semibold"
          >
            Back to Sign In
          </button>
        </div>
      </AuthBackground>
    )
  }

  return (
    <AuthBackground>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">Golfing with the Boyz</h1>
          <p className="text-gray-500 dark:text-gray-400">Track scores. Compete. Improve.</p>
        </div>

        {!isConfigured && (
          <div className="mb-5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300 mb-2">Supabase Not Connected</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mb-3">
              Set <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
              <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your{' '}
              <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env</code> file to enable full functionality.
            </p>
            <button
              onClick={handleDemo}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl transition"
            >
              Try Demo Mode
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            className="text-green-700 dark:text-green-400 font-semibold"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </AuthBackground>
  )
}
