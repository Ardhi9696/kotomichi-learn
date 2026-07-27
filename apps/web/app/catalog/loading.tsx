export default function CatalogLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-5 py-16 sm:px-8">
      <div className="h-4 w-36 rounded bg-primary-soft" />
      <div className="mt-5 h-12 max-w-2xl rounded bg-border" />
      <div className="mt-10 h-24 rounded-2xl bg-surface" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="h-64 rounded-2xl bg-surface" key={index} />
        ))}
      </div>
    </div>
  );
}
