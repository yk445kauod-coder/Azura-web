import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BaristaProvider } from "@/contexts/BaristaContext";
import { db, ref, onValue, off } from "@/lib/firebase";
import Layout from "@/components/Layout";
const Welcome = lazy(() => import("@/pages/Welcome"));
const MenuLightweight = lazy(() => import("@/pages/MenuLightweight"));
const AIBarista = lazy(() => import("@/pages/AIBarista"));
const Profile = lazy(() => import("@/pages/Profile"));
const Admin = lazy(() => import("@/pages/Admin"));
const Reels = lazy(() => import("@/pages/Reels"));
const SupportChat = lazy(() => import("@/pages/SupportChat"));
const NotFound = lazy(() => import("@/pages/not-found"));
import { seedMenuIfEmpty, mergeMenuIngredients } from "@/lib/firebase";
import { useEffect, useState, lazy, Suspense } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface FeatureFlags {
  baristaEnabled: boolean;
  reelsEnabled: boolean;
  supportEnabled: boolean;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>({
    baristaEnabled: true,
    reelsEnabled: true,
    supportEnabled: true,
  });

  useEffect(() => {
    seedMenuIfEmpty()
      .then(() => mergeMenuIngredients())
      .catch(() => {});
  }, []);

  // Listen for feature flags globally
  useEffect(() => {
    const ffRef = ref(db, "feature-flags");
    onValue(ffRef, (snap) => {
      if (snap.exists()) {
        const d = snap.val();
        setFlags({
          baristaEnabled: d.baristaEnabled !== false,
          reelsEnabled: d.reelsEnabled !== false,
          supportEnabled: d.supportEnabled !== false,
        });
      }
    });
    return () => off(ffRef);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/30">
          <img src="/logo.jpg" alt="Azura" className="w-full h-full object-cover" loading="lazy" />
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-primary-foreground gap-4">
        <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 animate-pulse">
          <img src="/logo.jpg" alt="Azura" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    }>
      <Switch>
        <Route path="/admin" component={Admin} />
        {!user ? (
          <Route component={Welcome} />
        ) : (
          <Route>
            <Layout>
              <Switch>
                <Route path="/" component={MenuLightweight} />
                <Route path="/menu" component={MenuLightweight} />
                <Route path="/barista">
                  {flags.baristaEnabled ? <AIBarista /> : <Redirect to="/menu" />}
                </Route>
                <Route path="/reels">
                  {flags.reelsEnabled ? <Reels /> : <Redirect to="/menu" />}
                </Route>
                <Route path="/support">
                  {flags.supportEnabled ? <SupportChat /> : <Redirect to="/menu" />}
                </Route>
                <Route path="/profile" component={Profile} />
                <Route component={NotFound} />
              </Switch>
            </Layout>
          </Route>
        )}
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BaristaProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
          </BaristaProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
