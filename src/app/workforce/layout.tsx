import WorkforceDock from "@/components/navigation/WorkforceDock";

export default function WorkforceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {children}
      <WorkforceDock />
    </div>
  );
}
