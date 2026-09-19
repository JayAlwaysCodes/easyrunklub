export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}