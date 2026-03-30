interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div className="error-alert" role="alert">
      <span className="error-icon" aria-hidden="true">⚠</span>
      <div className="error-body">
        <p>{message}</p>
      </div>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry} type="button">
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorAlert;
