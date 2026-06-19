import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SplashScreen from "@/pages/SplashScreen";
import MenuLightweight from "@/pages/MenuLightweight";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Reels from "@/pages/Reels";
import Suggest from "@/pages/Suggest";
import SupportChat from "@/pages/SupportChat";
import NotFound from "@/pages/not-found";
import { Suspense } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Loading component
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div 
            key={i} 
            className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" 
            style={{ animationDelay: `${i * 0.15}s` }} 
          />
        ))}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/30">
          <img src="/logo.jpg" alt="Azura" className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/admin" component={Admin} />
      {!user ? (
        <Route component={SplashScreen} />
      ) : (
        <Route>
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Switch>
                <Route path="/" component={MenuLightweight} />
                <Route path="/menu" component={MenuLightweight} />
                <Route path="/reels" component={Reels} />
                <Route path="/support" component={SupportChat} />
                <Route path="/suggest" component={Suggest} />
                <Route path="/profile" component={Profile} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </Layout>
        </Route>
      )}
    </Switch>
  );
}

// Error logger for ErrorBoundary
function logError(error: Error, errorInfo: React.ErrorInfo) {
  console.error("App Error:", error, errorInfo);
}

export default function App() {
  return (
    <ErrorBoundary onError={logError}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
