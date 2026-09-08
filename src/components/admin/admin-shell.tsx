import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Boxes, LayoutDashboard, LogOut, Plug, ReceiptText } from "lucide-react";
import weettahLogo from "@/assets/weettah-logo.png";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const links = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/packages", label: "Packages", icon: Boxes },
  { to: "/admin/integrations", label: "Integrations", icon: Plug },
] as const;

export function AdminShell({ children, title, description }: { children: ReactNode; title: string; description: string }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-border bg-secondary text-secondary-foreground lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col px-4 py-4 lg:px-5 lg:py-6">
          <Link to="/admin" className="inline-flex w-fit rounded-sm bg-background px-2 py-1.5" aria-label="Weettah operations home">
            <img src={weettahLogo} alt="Weettah" width={1276} height={371} className="h-8 w-auto" />
          </Link>
          <p className="mt-3 text-xs font-bold uppercase text-secondary-foreground/55">Operations</p>
          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-col" aria-label="Operations navigation">
            {links.map(({ to, label, icon: Icon }) => {
              const active = path === to;
              return (
                <Button key={to} variant="ghost" asChild className={cn("shrink-0 justify-start text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground", active && "bg-surface text-surface-foreground hover:bg-surface hover:text-surface-foreground")}>
                  <Link to={to}><Icon />{label}</Link>
                </Button>
              );
            })}
          </nav>
          <Button variant="ghost" className="mt-4 justify-start text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground lg:mt-auto" onClick={() => void signOut()}>
            <LogOut /> Sign out
          </Button>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="mb-8 border-b border-border pb-6">
          <p className="text-xs font-bold uppercase text-primary">Weettah control room</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        </header>
        {children}
      </main>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const good = value === "ready" || value === "completed" || value === "live";
  const bad = value === "failed" || value === "invalid" || value === "cancelled";
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize", good ? "bg-accent/15 text-accent" : bad ? "bg-destructive/10 text-destructive" : "bg-surface text-surface-foreground")}>{value.replaceAll("_", " ")}</span>;
}