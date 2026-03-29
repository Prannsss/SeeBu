import WorkforceAdminDock from "../../components/navigation/WorkforceAdminDock";

// Layout for Workforce Admin
export default function WorkforceAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {children}
      <WorkforceAdminDock />
    </div>
  );
}