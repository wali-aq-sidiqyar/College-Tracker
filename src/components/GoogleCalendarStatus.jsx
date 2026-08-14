export default function GoogleCalendarStatus({ google }) {
  const { connected, error, refreshing, connect, disconnect, refresh } = google

  if (connected === null) {
    return <span className="google-status google-status-checking">Checking Google…</span>
  }

  if (connected) {
    return (
      <div className="google-status">
        <div className="google-status-connected">
          <span className="google-status-dot" aria-hidden="true" />
          <span>Google Calendar</span>
          <button
            type="button"
            className="ghost google-refresh-btn"
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh from Google Calendar"
            title="Refresh from Google Calendar"
          >
            <RefreshIcon spinning={refreshing} />
          </button>
          <button type="button" className="ghost" onClick={disconnect}>
            Disconnect
          </button>
        </div>
        {error && <span className="google-status-error">{error}</span>}
      </div>
    )
  }

  return (
    <div className="google-status">
      <button type="button" className="secondary google-connect-btn" onClick={connect}>
        Connect Google
      </button>
      {error && <span className="google-status-error">{error}</span>}
    </div>
  )
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={spinning ? 'spin' : ''}
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  )
}
