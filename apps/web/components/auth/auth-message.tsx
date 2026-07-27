export function AuthMessage({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  const text = error ?? message;
  if (!text) return null;

  return (
    <div
      className={
        error
          ? 'mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900'
          : 'mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900'
      }
      role={error ? 'alert' : 'status'}
    >
      {text}
    </div>
  );
}
