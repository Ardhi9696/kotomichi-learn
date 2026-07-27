export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Memuat ringkasan belajar" className="mx-auto max-w-7xl animate-pulse px-5 py-10 sm:px-8">
      <div className="h-10 w-72 rounded-xl bg-muted" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div className="h-32 rounded-2xl bg-muted" key={index} />)}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-2xl bg-muted" />
        <div className="h-72 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
