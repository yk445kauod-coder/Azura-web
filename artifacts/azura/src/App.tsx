import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { BaristaProvider } from "@/contexts/BaristaContext";
import Layout from "@/components/Layout";
import Welcome from "@/pages/Welcome";
import Menu from "@/pages/Menu";
import AIBarista from "@/pages/AIBarista";
import Cart from "@/pages/Cart";
import Profile from "@/pages/Profile";
import Orders from "@/pages/Orders";
import Admin from "@/pages/Admin";
import Reels from "@/pages/Reels";
import NotFound from "@/pages/not-found";
import { seedMenuIfEmpty } from "@/lib/firebase";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();
  const [isAdmin] = useState(() => sessionStorage.getItem("azura-admin") === "true");
  useEffect(() => { seedMenuIfEmpty().catch(() => {}); }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg,hsl(38,50%,90%),hsl(35,40%,85%))" }}>
        <div className="text-center">
          <div className="rounded-[24px] p-1 mx-auto w-fit mb-4" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-xl)" }}>
            <img src="/logo.jpg" alt="Azura" className="w-20 h-20 rounded-[18px] object-cover" />
          </div>
          <div className="flex gap-1.5 justify-center">
            {[0,1,2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary dot-pulse" style={{ animationDelay: `${i*0.22}s` }} />
            ))}
          </div>
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
              <Route path="/" component={Menu} />
              <Route path="/menu" component={Menu} />
              <Route path="/barista" component={AIBarista} />
              <Route path="/cart" component={Cart} />
              <Route path="/orders" component={Orders} />
              {isAdmin && <Route path="/reels" component={Reels} />}
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
