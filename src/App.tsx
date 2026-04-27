import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppShell } from "@/components/layout/AppShell";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Trainings from "./pages/Trainings";
import TrainingDetail from "./pages/TrainingDetail";
import CompleteSession from "./pages/CompleteSession";
import Progress from "./pages/Progress";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminTrainingForm from "./pages/AdminTrainingForm";
import Subscription from "./pages/Subscription";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Refund from "./pages/Refund";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              {/* Public legal & pricing pages — must remain accessible without authentication for Paddle compliance */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route element={<AppShell />}>
                <Route path="/" element={<Home />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/trainings" element={<Trainings />} />
                <Route path="/trainings/:id" element={<TrainingDetail />} />
                <Route path="/trainings/:id/complete" element={<CompleteSession />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/trainings/:id" element={<AdminTrainingForm />} />
                <Route path="/subscription" element={<Subscription />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
