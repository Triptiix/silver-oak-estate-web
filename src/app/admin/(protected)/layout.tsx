import { requireAdmin } from "@/lib/auth/admin";
import { AdminIdentityProvider } from "@/components/admin/admin-identity-context";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireAdmin();

  return (
    <AdminIdentityProvider admin={{ name: admin.name, role: admin.role }}>
      {children}
    </AdminIdentityProvider>
  );
}
