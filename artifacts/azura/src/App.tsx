import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { BaristaProvider } from "@/contexts/BaristaContext";
import Layout from "@/components/Layout";
import Welcome from "@/pages/Welcome";
import MenuLightweight from "@/pages/MenuLightweight";
import AIBarista from "@/pages/AIBarista";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Reels from "@/pages/Reels";
import Suggest from "@/pages/Suggest";
import SupportChat from "@/pages/SupportChat";
import NotFound from "@/pages/not-found";
import { seedMenuIfEmpty } from "@/lib/firebase";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { user, loading } = useAuth();
  useEffect(() => { seedMenuIfEmpty().catch(() => {}); }, []);

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
        <Route component={Welcome} />
      ) : (
        <Route>
          <Layout>
            <Switch>
              <Route path="/" component={MenuLightweight} />
              <Route path="/menu" component={MenuLightweight} />
              <Route path="/barista" component={AIBarista} />
              <Route path="/reels" component={Reels} />
              <Route path="/support" component={SupportChat} />
              <Route path="/suggest" component={Suggest} />
              <Route path="/profile" component={Profile} />
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
          <CartProvider>
            <BaristaProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <AppRoutes />
              </WouterRouter>
            </BaristaProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
