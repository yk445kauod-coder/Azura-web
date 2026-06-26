import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BaristaProvider } from "@/contexts/BaristaContext";
import { db, ref, onValue, off } from "@/lib/firebase";
import Layout from "@/components/Layout";
import Welcome from "@/pages/Welcome";
import MenuLightweight from "@/pages/MenuLightweight";
import Reels from "@/pages/Reels";
import SupportChat from "@/pages/SupportChat";
import NotFound from "@/pages/not-found";
import { seedMenuIfEmpty, mergeMenuIngredients } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { lazy, Suspense } from "react";

// Lazy load heavy pages only - use defineAsyncComponent for React 19
const AIBarista = lazy(() => 
  import("@/pages/AIBarista")
);
const Admin = lazy(() => 
  import("@/pages/Admin")
);
const Profile = lazy(() => 
  import("@/pages/Profile")
);

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
          <img src="/logo.jpg" alt="Azura" className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/admin">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
          <Admin />
        </Suspense>
      </Route>
      {!user ? (
        <Route component={Welcome} />
      ) : (
        <Route>
          <Layout>
            <Switch>
              <Route path="/" component={MenuLightweight} />
              <Route path="/menu" component={MenuLightweight} />
              <Route path="/barista">
                {flags.baristaEnabled ? (
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
                    <AIBarista />
                  </Suspense>
                ) : <Redirect to="/menu" />}
              </Route>
              <Route path="/reels">
                {flags.reelsEnabled ? <Reels /> : <Redirect to="/menu" />}
              </Route>
              <Route path="/support">
                {flags.supportEnabled ? <SupportChat /> : <Redirect to="/menu" />}
              </Route>
              <Route path="/profile">
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
                  <Profile />
                </Suspense>
              </Route>
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      )}
    </Switch>
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
