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
          ? 'mb-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground'
          : 'mb-5 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground'
      }
      role={error ? 'alert' : 'status'}
    >
      {text}
    </div>
  );
}
