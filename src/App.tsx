
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AIRecommendations from "./pages/AIRecommendations";
import MarketAnalysis from "./pages/MarketAnalysis";
import RiskAssessment from "./pages/RiskAssessment";
import LearningAI from "./pages/LearningAI";
import Simulator from "./pages/Simulator";
import TradingStrategyTesting from "./pages/TradingStrategyTesting";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-recommendations"
              element={
                <ProtectedRoute>
                  <AIRecommendations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/market-analysis"
              element={
                <ProtectedRoute>
                  <MarketAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/risk-assessment"
              element={
                <ProtectedRoute>
                  <RiskAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning"
              element={
                <ProtectedRoute>
                  <LearningAI />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulator"
              element={
                <ProtectedRoute>
                  <Simulator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/strategy-testing"
              element={
                <ProtectedRoute>
                  <TradingStrategyTesting />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
