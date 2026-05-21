import { requireAdmin } from '@/lib/auth/admin';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'Backoffice',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-offwhite">
      <AdminSidebar adminName={profile.name ?? profile.email ?? 'Admin'} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
