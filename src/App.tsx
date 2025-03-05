
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import NotFound from "@/components/NotFound";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import AIRecommendations from "@/pages/AIRecommendations";
import RiskAssessment from "@/pages/RiskAssessment";
import MarketAnalysis from "@/pages/MarketAnalysis";
import TradingStrategyTesting from "@/pages/TradingStrategyTesting";
import Profile from "@/pages/Profile";
import Simulator from "@/pages/Simulator";
import LearningAI from "@/pages/LearningAI";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from "@/components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}

// Define routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        path: "/",
        element: <Index />
      },
      {
        path: "/auth",
        element: <Auth />
      },
      {
        path: "/recommendations",
        element: <ProtectedRoute><AIRecommendations /></ProtectedRoute>
      },
      {
        path: "/risk-assessment",
        element: <ProtectedRoute><RiskAssessment /></ProtectedRoute>
      },
      {
        path: "/market-analysis",
        element: <ProtectedRoute><MarketAnalysis /></ProtectedRoute>
      },
      {
        path: "/strategy-testing",
        element: <ProtectedRoute><TradingStrategyTesting /></ProtectedRoute>
      },
      {
        path: "/profile",
        element: <ProtectedRoute><Profile /></ProtectedRoute>
      },
      {
        path: "/simulator",
        element: <ProtectedRoute><Simulator /></ProtectedRoute>
      },
      {
        path: "/learn",
        element: <ProtectedRoute><LearningAI /></ProtectedRoute>
      }
    ]
  }
]);

export default App;
