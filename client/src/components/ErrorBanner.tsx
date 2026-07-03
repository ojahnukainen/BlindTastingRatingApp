import { useGameStore } from '../store/gameStore';

export function ErrorBanner() {
  const error = useGameStore((state) => state.error);
  const setError = useGameStore((state) => state.setError);

  if (!error) return null;

  return (
    <div
      role="alert"
      className="mb-4 flex items-center justify-between rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <span>{error}</span>
      <button
        type="button"
        onClick={() => setError(null)}
        aria-label="Dismiss error"
        className="ml-4 text-red-500 hover:text-red-700"
      >
        ✕
      </button>
    </div>
  );
}
