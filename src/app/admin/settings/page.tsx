import { PageHeader } from "@/components/admin/ui";
import { PasswordForm } from "@/components/admin/password-form";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Seguridad"
        subtitle="Actualiza tu contraseña de acceso al panel de administración"
      />
      <div className="p-6">
        <PasswordForm />
      </div>
    </div>
  );
}
