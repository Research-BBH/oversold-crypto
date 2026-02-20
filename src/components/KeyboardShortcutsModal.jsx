const NAV_SHORTCUTS = [
  { keys: ['J', '↓'], desc: 'Move down in table' },
  { keys: ['K', '↑'], desc: 'Move up in table' },
  { keys: ['Enter'], desc: 'Open selected token' },
  { keys: ['O'], desc: 'Open in new tab' },
  { keys: ['['], desc: 'Previous page' },
  { keys: [']'], desc: 'Next page' },
  { keys: ['G'], desc: 'Go to last row' },
];

const ACTION_SHORTCUTS = [
  { keys: ['/'], desc: 'Focus search' },
  { keys: ['W'], desc: 'Toggle watchlist view' },
  { keys: ['S'], desc: 'Star/unstar selected token' },
  { keys: ['D'], desc: 'Toggle dark mode' },
  { keys: ['R'], desc: 'Refresh data' },
];

const GENERAL_SHORTCUTS = [
  { keys: ['?'], desc: 'Show this help' },
  { keys: ['Esc'], desc: 'Close modal / clear selection' },
];

function ShortcutRow({ keys, desc, darkMode }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{desc}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <span key={i}>
            <kbd className={`px-2 py-1 rounded text-xs font-mono ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              {key}
            </kbd>
            {i < keys.length - 1 && (
              <span className={`mx-1 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>or</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function ShortcutGroup({ title, shortcuts, darkMode }) {
  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {title}
      </h3>
      <div className="space-y-2">
        {shortcuts.map((s) => (
          <ShortcutRow key={s.desc} keys={s.keys} desc={s.desc} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsModal({ show, onClose, darkMode }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl p-6 max-w-lg w-full shadow-2xl border ${
          darkMode ? 'bg-[#1a1a24] border-white/10' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <ShortcutGroup title="Navigation" shortcuts={NAV_SHORTCUTS} darkMode={darkMode} />
          <ShortcutGroup title="Actions" shortcuts={ACTION_SHORTCUTS} darkMode={darkMode} />
          <ShortcutGroup title="General" shortcuts={GENERAL_SHORTCUTS} darkMode={darkMode} />
        </div>

        <p className={`mt-6 text-xs text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          Press{' '}
          <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>?</kbd>{' '}
          anytime to show this help
        </p>
      </div>
    </div>
  );
}
