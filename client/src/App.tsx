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
import HabitTracker from "@/pages/HabitTracker";
import Statistics from "@/pages/Statistics";
import EmotionalHistory from "@/pages/EmotionalHistory";
import FindHelp from "@/pages/FindHelp";
import Journal from "@/pages/Journal";
import Resources from "@/pages/Resources";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute>
          <Redirect to="/dashboard" />
        </ProtectedRoute>
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

      <Route path="/habits">
        <ProtectedRoute>
          <Layout><HabitTracker /></Layout>
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

      <Route path="/settings">
        <ProtectedRoute>
          <Layout><Settings /></Layout>
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
