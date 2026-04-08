import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import NewRound from './pages/NewRound'
import RoundDetail from './pages/RoundDetail'
import Leaderboard from './pages/Leaderboard'
import ProfilePage from './pages/ProfilePage'
import AdminPanel from './pages/AdminPanel'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3" />
          <p className="text-green-700 dark:text-green-400 font-medium">Loading GolfTracker...</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new-round" element={<NewRound />} />
        <Route path="/round/:id" element={<RoundDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
