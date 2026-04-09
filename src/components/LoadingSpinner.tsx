import "./LoadingSpinner.css";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
}

export function LoadingSpinner({ message = "Loading...", size = "medium" }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner-container loading-spinner-${size}`}>
      <div className="loading-spinner" />
      {message && <p className="loading-spinner-message">{message}</p>}
    </div>
  );
}
