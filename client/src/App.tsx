import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/pages/auth-page";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Principal from "@/pages/principal";
import CyclesSettings from "@/pages/cycles-settings";
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";
import SurveysDashboard from "@/pages/surveys-dashboard";
import SurveyBuilderPage from "@/pages/survey-builder";
import SurveyResponsePage from "@/pages/survey-response";
import SurveyAnalyticsPage from "@/pages/survey-analytics";
import StandardsPage from "@/pages/standards-page";
import NafesPage from "@/pages/nafes-page";
import type { User } from "@shared/schema";
import { useEffect } from "react";
import { OfflineBanner } from "@/components/offline-banner";

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const isAdminOrCreator = user.role === "admin" || user.role === "creator";
      const needsOnboarding = user.role === "teacher" && !user.onboardingCompleted;
      const isAuthPage = location === "/auth" || location === "/login";

      if (needsOnboarding && location !== "/onboarding") {
        setLocation("/onboarding");
      } else if (!needsOnboarding && location === "/onboarding") {
        setLocation(isAdminOrCreator ? "/principal" : "/home");
      } else if (isAdminOrCreator && (location === "/home" || location === "/" || isAuthPage)) {
        setLocation("/principal");
      } else if (!isAdminOrCreator && (location === "/principal" || location === "/" || isAuthPage)) {
        setLocation("/home");
      }
    }
  }, [user, location, isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/login" component={AuthPage} />
          <Route path="/s/:token" component={SurveyResponsePage} />
          <Route path="/:rest*">
            {() => {
              setLocation("/auth");
              return null;
            }}
          </Route>
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/principal" component={Principal} />
          <Route path="/principal/cycles" component={CyclesSettings} />
          <Route path="/onboarding" component={Onboarding} />

          <Route path="/surveys" component={SurveysDashboard} />
          <Route path="/surveys/new" component={SurveyBuilderPage} />
          <Route path="/surveys/:id/edit" component={SurveyBuilderPage} />
          <Route path="/surveys/:id/analytics" component={SurveyAnalyticsPage} />

          <Route path="/s/:token" component={SurveyResponsePage} />
          <Route path="/standards" component={StandardsPage} />
          <Route path="/nafes" component={NafesPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="school-ui-theme">
        <TooltipProvider>
          <OfflineBanner />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
