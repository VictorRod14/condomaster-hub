import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface RoleSwitcherProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
}

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
    toast.success(`Perfil alterado para ${role}`);
  };

  if (availableRoles.length <= 1) return null;

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    sindico: "Síndico",
    morador: "Morador"
  };

  return (
    <div className="px-4 py-2">
      <Select value={currentRole} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o perfil" />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {roleLabels[role] || role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
