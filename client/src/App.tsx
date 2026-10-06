import PersonalGoals from "./pages/PersonalGoals";
import WellnessDNA from "./pages/WellnessDNA";
import SafetyPlan from "./pages/SafetyPlan";
import PersonalWellnessPlan from "./pages/PersonalWellnessPlan";
import PatternExplorer from "./pages/PatternExplorer";
import ReflectionPrompts from "./pages/ReflectionPrompts";
import WellnessJourney from "./pages/WellnessJourney";
import SinceLastCheckin from "./pages/SinceLastCheckin";
import LifeTimeline from "./pages/LifeTimeline";
import WhyToday from "./pages/WhyToday";
import FocusMode from "./pages/FocusMode";
import ThenVsNow from "./pages/ThenVsNow";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { LanguageProvider } from "@/i18n/LanguageContext";

// Components
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Dashboard from "@/pages/Dashboard";
import Chatbot from "@/pages/Chatbot";
import MoodTracker from "@/pages/MoodTracker";
import MoodTrackerEnhanced from "@/pages/MoodTrackerEnhanced";
import HabitTracker from "@/pages/HabitTracker";
import SleepTracker from "@/pages/SleepTracker";
import Statistics from "@/pages/Statistics";
import EmotionalHistory from "@/pages/EmotionalHistory";
import FindHelp from "@/pages/FindHelp";
import Journal from "@/pages/Journal";
import Resources from "@/pages/Resources";
import ResourceDetail from "@/pages/ResourceDetail";
import Settings from "@/pages/Settings";
import WaterIntake from "@/pages/WaterIntake";
import StressTracker from "@/pages/StressTracker";
import HealthDashboard from "@/pages/HealthDashboard";
import Trends30Days from "@/pages/Trends30Days";
import Trends90Days from "@/pages/Trends90Days";
import ReportLibrary from "@/pages/ReportLibrary";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsConditions from "@/pages/TermsConditions";
import CookiePolicy from "@/pages/CookiePolicy";
import CookiePreferences from "@/pages/CookiePreferences";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Landing from "@/pages/Landing";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Landing />
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/chat">
        <ProtectedRoute>
          <Layout><Chatbot /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/journal">
        <ProtectedRoute>
          <Layout><Journal /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/mood">
        <ProtectedRoute>
          <Layout><MoodTracker /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/mood-enhanced">
        <ProtectedRoute>
          <Layout><MoodTrackerEnhanced /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/habits">
        <ProtectedRoute>
          <Layout><HabitTracker /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/sleep">
        <ProtectedRoute>
          <Layout><SleepTracker /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/water">
        <ProtectedRoute>
          <Layout><WaterIntake /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/stress">
        <ProtectedRoute>
          <Layout><StressTracker /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/health">
        <ProtectedRoute>
          <Layout><HealthDashboard /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/trends-30">
        <ProtectedRoute>
          <Layout><Trends30Days /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/trends-90">
        <ProtectedRoute>
          <Layout><Trends90Days /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute>
          <Layout><ReportLibrary /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/statistics">
        <ProtectedRoute>
          <Layout><Statistics /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/history">
        <ProtectedRoute>
          <Layout><EmotionalHistory /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/help">
        <ProtectedRoute>
          <Layout><FindHelp /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/resources">
        <ProtectedRoute>
          <Layout><Resources /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/resources/:slug">
        <ProtectedRoute>
          <Layout><ResourceDetail /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <Layout><Settings /></Layout>
        </ProtectedRoute>
      </Route>

      {/* Legal Pages */}
      <Route path="/privacy-policy">
        <Layout><PrivacyPolicy /></Layout>
      </Route>

      <Route path="/terms">
        <Layout><TermsConditions /></Layout>
      </Route>

      <Route path="/cookie-policy">
        <Layout><CookiePolicy /></Layout>
      </Route>

      <Route path="/cookie-preferences">
        <Layout><CookiePreferences /></Layout>
      </Route>

      {/* Auth Pages */}
      <Route path="/forgot-password">
        <ForgotPassword />
      </Route>

      <Route path="/reset-password">
        <ResetPassword />
      </Route>


    
      <Route path="/goals">
        <ProtectedRoute>
          <Layout><PersonalGoals /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/wellness-journey">
        <ProtectedRoute>
          <Layout><WellnessJourney /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/reflections">
        <ProtectedRoute>
          <Layout><ReflectionPrompts /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/pattern-explorer">
        <ProtectedRoute>
          <Layout><PatternExplorer /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/wellness-plan">
        <ProtectedRoute>
          <Layout><PersonalWellnessPlan /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/safety-plan">
        <ProtectedRoute>
          <Layout><SafetyPlan /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/wellness-dna">
        <ProtectedRoute>
          <Layout><WellnessDNA /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/then-vs-now">
        <ProtectedRoute>
          <Layout><ThenVsNow /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/focus-mode">
        <ProtectedRoute>
          <Layout><FocusMode /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/why-today">
        <ProtectedRoute>
          <Layout><WhyToday /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/life-timeline">
        <ProtectedRoute>
          <Layout><LifeTimeline /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/since-last-checkin">
        <ProtectedRoute>
          <Layout><SinceLastCheckin /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/lab">
        <ProtectedRoute>
          <Layout><TalkEasyLab /></Layout>
        </ProtectedRoute>
      </Route>
              <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;


import TalkEasyLab from "./pages/TalkEasyLab";
