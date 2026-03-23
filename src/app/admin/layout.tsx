import AdminDock from "@/components/navigation/AdminDock";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {children}
      <AdminDock />
    </div>
  );
}
