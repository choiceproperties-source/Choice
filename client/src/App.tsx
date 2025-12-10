import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProtectedRoute } from "@/components/protected-route";
import { lazy, Suspense as ReactSuspense } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Properties from "@/pages/properties";
import PropertyDetails from "@/pages/property-details";
import { AuthProvider } from "@/lib/auth-context";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

// Lazy load pages that aren't immediately needed
const Apply = lazy(() => import("@/pages/apply"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const OwnerProfile = lazy(() => import("@/pages/owner-profile"));
const Applications = lazy(() => import("@/pages/applications"));
const Buy = lazy(() => import("@/pages/buy"));
const Sell = lazy(() => import("@/pages/sell"));
const MortgageCalculator = lazy(() => import("@/pages/mortgage-calculator"));
const Login = lazy(() => import("@/pages/login"));
const Signup = lazy(() => import("@/pages/signup"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const Agents = lazy(() => import("@/pages/agents"));
const FAQ = lazy(() => import("@/pages/faq"));
const Admin = lazy(() => import("@/pages/admin"));
const RenterDashboard = lazy(() => import("@/pages/renter-dashboard"));
const SellerDashboard = lazy(() => import("@/pages/seller-dashboard"));
const BuyerDashboard = lazy(() => import("@/pages/buyer-dashboard"));
const PropertyRequirements = lazy(() => import("@/pages/property-requirements"));
const AgentDashboard = lazy(() => import("@/pages/agent-dashboard"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading page content">
      <div className="text-muted-foreground flex flex-col items-center gap-2">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
        <span>Loading...</span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/properties" component={Properties} />
      <Route path="/property/:id" component={PropertyDetails} />
      <Route path="/owner/:slug" component={OwnerProfile} />
      <Route path="/apply">
        <ReactSuspense fallback={<LoadingFallback />}>
          <Apply />
        </ReactSuspense>
      </Route>
      <Route path="/applications">
        <ReactSuspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <Applications />
          </ProtectedRoute>
        </ReactSuspense>
      </Route>
      <Route path="/buy">
        <ReactSuspense fallback={<LoadingFallback />}>
          <Buy />
        </ReactSuspense>
      </Route>
      <Route path="/sell">
        <ReactSuspense fallback={<LoadingFallback />}>
          <Sell />
        </ReactSuspense>
      </Route>
      <Route path="/mortgage-calculator">
        <ReactSuspense fallback={<LoadingFallback />}>
          <MortgageCalculator />
        </ReactSuspense>
      </Route>
      <Route path="/login">
        <ReactSuspense fallback={<LoadingFallback />}>
          <Login />
        </ReactSuspense>
      </Route>
      <Route path="/signup">
        <ReactSuspense fallback={<LoadingFallback />}>
          <Signup />
        </ReactSuspense>
      </Route>
      <Route path="/forgot-password">
        <ReactSuspense fallback={<LoadingFallback />}>
          <ForgotPassword />
        </ReactSuspense>
      </Route>
      <Route path="/reset-password">
        <ReactSuspense fallback={<LoadingFallback />}>
          <ResetPassword />
        </ReactSuspense>
      </Route>
      <Route path="/agents">
        <ReactSuspense fallback={<LoadingFallback />}>
          <Agents />
        </ReactSuspense>
      </Route>
      <Route path="/faq">
        <ReactSuspense fallback={<LoadingFallback />}>
          <FAQ />
        </ReactSuspense>
      </Route>
      <Route path="/admin">
        <ReactSuspense fallback={<LoadingFallback />}>
          <ProtectedRoute requiredRoles={['admin']}>
            <Admin />
          </ProtectedRoute>
        </ReactSuspense>
      </Route>
      <Route path="/renter-dashboard">
        <ReactSuspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <RenterDashboard />
          </ProtectedRoute>
        </ReactSuspense>
      </Route>
      <Route path="/seller-dashboard">
        <ReactSuspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <SellerDashboard />
          </ProtectedRoute>
        </ReactSuspense>
      </Route>
      <Route path="/buyer-dashboard">
        <ReactSuspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <BuyerDashboard />
          </ProtectedRoute>
        </ReactSuspense>
      </Route>
      <Route path="/about">
        <ReactSuspense fallback={<LoadingFallback />}>
          <About />
        </ReactSuspense>
      </Route>
      <Route path="/contact">
        <ReactSuspense fallback={<LoadingFallback />}>
          <Contact />
        </ReactSuspense>
      </Route>
      <Route path="/privacy">
        <ReactSuspense fallback={<LoadingFallback />}>
          <Privacy />
        </ReactSuspense>
      </Route>
      <Route path="/terms">
        <ReactSuspense fallback={<LoadingFallback />}>
          <Terms />
        </ReactSuspense>
      </Route>
      <Route path="/property-requirements">
        <ReactSuspense fallback={<LoadingFallback />}>
          <PropertyRequirements />
        </ReactSuspense>
      </Route>
      <Route path="/agent-dashboard">
        <ReactSuspense fallback={<LoadingFallback />}>
          <ProtectedRoute requiredRoles={['agent', 'admin']}>
            <AgentDashboard />
          </ProtectedRoute>
        </ReactSuspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  return (
    <AuthProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
