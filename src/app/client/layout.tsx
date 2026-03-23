import ClientDock from "@/components/navigation/ClientDock";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {children}
      <ClientDock />
    </div>
  );
}
