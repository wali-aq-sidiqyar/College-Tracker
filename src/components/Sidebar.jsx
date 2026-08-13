import { todayBoardLabel } from '../utils/date'

const NAV_ITEMS = [
  { key: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { key: 'assignments', label: 'Assignments', icon: AssignmentsIcon },
  { key: 'notes', label: 'Notes', icon: NotesIcon },
  { key: 'add', label: 'Add', icon: PlusIcon },
]

export default function Sidebar({ activeTab, onSelect }) {
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
        <span className="today-chip">{todayBoardLabel()}</span>
      </div>
    </nav>
  )
}

function BrandMark() {
  return (
    <svg className="sidebar-mark" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" rx="4" style={{ fill: 'var(--rail)' }} />
      <rect x="7" y="7" width="14" height="14" rx="4" style={{ fill: 'var(--flag)' }} />
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

function AssignmentsIcon() {
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

function PlusIcon() {
  return (
    <svg {...iconProps()}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
