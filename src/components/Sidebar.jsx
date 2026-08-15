import { todayBoardLabel } from '../utils/date'
import GoogleCalendarStatus from './GoogleCalendarStatus'

const NAV_ITEMS = [
  { key: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { key: 'tasks', label: 'Tasks', icon: TasksIcon },
  { key: 'events', label: 'Events', icon: EventsIcon },
  { key: 'reminders', label: 'Reminders', icon: RemindersIcon },
  { key: 'notes', label: 'Notes', icon: NotesIcon },
  { key: 'add', label: 'Add', icon: PlusIcon },
]

export default function Sidebar({ activeTab, onSelect, google, bgImageOn, onToggleBgImage }) {
  return (
    <nav className="sidebar" aria-label="Sections">
      <div className="sidebar-brand">
        <BrandMark />
        <div className="sidebar-brand-text">
          <span className="sidebar-app-name">College Tracker</span>
          <span className="sidebar-tagline">What&rsquo;s due, what&rsquo;s next.</span>
        </div>
      </div>

      <div className="sidebar-nav">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`sidebar-nav-item${activeTab === key ? ' active' : ''}`}
            aria-current={activeTab === key ? 'page' : undefined}
            onClick={() => onSelect(key)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className={`bg-image-toggle${bgImageOn ? ' active' : ''}`}
          aria-pressed={bgImageOn}
          onClick={onToggleBgImage}
        >
          <CityIcon />
          <span>City BG</span>
          <span className="bg-image-toggle-state">{bgImageOn ? 'On' : 'Off'}</span>
        </button>
        <GoogleCalendarStatus google={google} />
        <span className="today-chip">{todayBoardLabel()}</span>
      </div>
    </nav>
  )
}

function BrandMark() {
  return (
    <svg className="sidebar-mark" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" rx="4" fill="none" strokeWidth="1.6" style={{ stroke: 'var(--rail)' }} />
      <rect x="7" y="7" width="14" height="14" rx="4" fill="none" strokeWidth="1.6" style={{ stroke: 'var(--flag)' }} />
    </svg>
  )
}

function iconProps(extra) {
  return {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...extra,
  }
}

function CalendarIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  )
}

function TasksIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="4" width="4" height="4" rx="1" />
      <line x1="10" y1="6" x2="21" y2="6" />
      <rect x="3" y="10" width="4" height="4" rx="1" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <rect x="3" y="16" width="4" height="4" rx="1" />
      <line x1="10" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function EventsIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
      <path d="M9 2h6" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M15 2v5h5" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  )
}

function RemindersIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 3a5 5 0 0 0-5 5v3.586l-1.707 1.707A1 1 0 0 0 6 15h12a1 1 0 0 0 .707-1.707L17 11.586V8a5 5 0 0 0-5-5z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg {...iconProps()}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function CityIcon() {
  return (
    <svg {...iconProps({ width: 16, height: 16 })}>
      <path d="M3 21h18" />
      <path d="M5 21V9l4-3v15" />
      <path d="M13 21V5l4-2v18" />
      <path d="M9 9h.01" />
      <path d="M9 13h.01" />
      <path d="M17 9h.01" />
      <path d="M17 13h.01" />
    </svg>
  )
}
