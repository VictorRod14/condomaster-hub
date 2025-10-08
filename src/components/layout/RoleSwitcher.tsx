import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface RoleSwitcherProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  sindico: "Síndico",
  morador: "Morador"
};

export const RoleSwitcher = ({ currentRole, onRoleChange }: RoleSwitcherProps) => {
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roles) {
        setAvailableRoles(roles.map(r => r.role));
      }
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
    }
  };

  const handleRoleChange = (role: string) => {
    onRoleChange(role);
    localStorage.setItem('selectedRole', role);
    toast.success(`Perfil alterado para ${roleLabels[role]}`);
  };

  if (availableRoles.length <= 1) return null;

  return (
    <div className="px-4 py-2 border-b border-sidebar-border">
      <label className="text-xs text-sidebar-foreground/60 mb-2 block">Perfil Ativo</label>
      <Select value={currentRole} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-full bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
          <SelectValue>
            {roleLabels[currentRole] || currentRole}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {availableRoles.map((role) => (
            <SelectItem 
              key={role} 
              value={role}
              className="text-popover-foreground hover:bg-accent"
            >
              {roleLabels[role] || role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
