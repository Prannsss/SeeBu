import SuperadminDock from "@/components/navigation/SuperadminDock";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {children}
      <SuperadminDock />
    </div>
  );
}
