import { Home, Building2, Users, Megaphone, DollarSign, Calendar, AlertCircle, MessageSquare, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  userRole?: string;
}

export const AppSidebar = ({ userRole = "morador" }: AppSidebarProps) => {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Logout realizado");
      navigate("/auth");
    }
  };

  const adminItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Condomínios", url: "/condominiums", icon: Building2 },
    { title: "Usuários", url: "/users", icon: Users },
  ];

  const sindicoItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Moradores", url: "/residents", icon: Users },
    { title: "Avisos", url: "/announcements", icon: Megaphone },
    { title: "Financeiro", url: "/financial", icon: DollarSign },
    { title: "Reservas", url: "/reservations", icon: Calendar },
    { title: "Ocorrências", url: "/occurrences", icon: AlertCircle },
    { title: "Mensagens", url: "/messages", icon: MessageSquare },
  ];

  const moradorItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Avisos", url: "/announcements", icon: Megaphone },
    { title: "Boletos", url: "/financial", icon: DollarSign },
    { title: "Reservas", url: "/reservations", icon: Calendar },
    { title: "Ocorrências", url: "/occurrences", icon: AlertCircle },
    { title: "Chat", url: "/messages", icon: MessageSquare },
  ];

  const items = 
    userRole === "admin" ? adminItems : 
    userRole === "sindico" ? sindicoItems : 
    moradorItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sidebar-primary rounded-lg">
              <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-sidebar-foreground">CondoManager</h2>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{userRole}</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

const Button = ({ children, variant, className, onClick }: any) => (
  <button className={className} onClick={onClick}>
    {children}
  </button>
);
