export default function GoogleCalendarStatus({ google }) {
  const { connected, error, connect, disconnect } = google

  if (connected === null) {
    return <span className="google-status google-status-checking">Checking Google…</span>
  }

  if (connected) {
    return (
      <div className="google-status">
        <div className="google-status-connected">
          <span className="google-status-dot" aria-hidden="true" />
          <span>Google Calendar</span>
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
