export default function LearningLoading() {
  return (
    <div aria-busy="true" aria-label="Memuat sesi belajar" className="mx-auto max-w-4xl animate-pulse px-5 py-10 sm:px-8">
      <div className="h-8 w-48 rounded-xl bg-muted" />
      <div className="mt-8 h-96 rounded-3xl bg-muted" />
    </div>
  );
}
