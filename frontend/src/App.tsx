import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AIDefensePage } from './pages/AIDefensePage'
import { AttackPathsPage } from './pages/AttackPathsPage'
import { Dashboard } from './pages/Dashboard'
import { GraphPage } from './pages/GraphPage'
import { Landing } from './pages/Landing'
import { RiskPage } from './pages/RiskPage'
import { SimulatePage } from './pages/SimulatePage'

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/attack-paths" element={<AttackPathsPage />} />
          <Route path="/risk" element={<RiskPage />} />
          <Route path="/simulate" element={<SimulatePage />} />
          <Route path="/ai-defense" element={<AIDefensePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}
