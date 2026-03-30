interface LoadingSpinnerProps {
  message?: string;
}

function LoadingSpinner({ message = 'Loading…' }: LoadingSpinnerProps) {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
