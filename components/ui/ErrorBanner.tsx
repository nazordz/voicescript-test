export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="alert alert-error mb-4 text-sm" data-testid="error-banner">
      {message}
    </div>
  );
}
