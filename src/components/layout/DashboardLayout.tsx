import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Loader2 } from "lucide-react";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string>("morador");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else if (session.user.email !== "victorodovalho@gmail.com") {
          // Verificação de segurança: apenas o email autorizado pode acessar
          toast.error("Acesso não autorizado");
          supabase.auth.signOut();
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else if (session.user.email !== "victorodovalho@gmail.com") {
        // Verificação de segurança: apenas o email autorizado pode acessar
        toast.error("Acesso não autorizado");
        supabase.auth.signOut();
        navigate("/auth");
      } else {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserRole = async (userId: string) => {
    // Verificar se há um perfil salvo no localStorage
    const savedRole = localStorage.getItem('selectedRole');
    
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (data && !error && data.length > 0) {
      const roles = data.map(r => r.role as string);
      
      // Se há um perfil salvo e o usuário tem esse perfil, usar ele
      if (savedRole && roles.includes(savedRole)) {
        setUserRole(savedRole);
      } else {
        // Caso contrário, usar a prioridade padrão: admin > sindico > morador
        if (roles.includes('admin')) {
          setUserRole('admin');
        } else if (roles.includes('sindico')) {
          setUserRole('sindico');
        } else {
          setUserRole('morador');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleRoleChange = (newRole: string) => {
    setUserRole(newRole);
    localStorage.setItem('selectedRole', newRole);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'hsl(var(--role-admin))';
      case 'sindico':
        return 'hsl(var(--role-sindico))';
      case 'morador':
        return 'hsl(var(--role-morador))';
      default:
        return 'hsl(var(--primary))';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar userRole={userRole} onRoleChange={handleRoleChange} />
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <div 
              className="absolute top-0 left-0 right-0 h-1" 
              style={{ backgroundColor: getRoleColor(userRole) }}
            />
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <div className="flex-1 p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
