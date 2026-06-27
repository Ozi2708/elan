import { useState, useEffect, useRef } from 'react';
import { C, AREA_COLORS } from './constants.js';

/* ── Btn ── */
export function Btn({ label, icon, color, outline, small, full, disabled, onClick, style = {} }) {
  const bg = outline ? 'transparent' : (color || C.teal);
  const border = outline ? `1.5px solid ${color || C.teal}` : 'none';
  const textColor = outline ? (color || C.teal) : '#fff';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        background: bg, border, borderRadius: 14, color: textColor,
        padding: small ? '8px 16px' : '13px 20px',
        fontSize: small ? 13 : 15, fontWeight: 600, fontFamily: 'inherit',
        width: full ? '100%' : undefined, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'opacity .15s', ...style,
      }}
    >
      {icon && <span style={{ fontSize: small ? 14 : 16 }}>{icon}</span>}
      {label}
    </button>
  );
}

/* ── EnergyGauge ── */
export function EnergyGauge({ value, onChange }) {
  const levels = [
    { v: 1, label: 'Épuisé', color: '#E5534B' },
    { v: 3, label: 'Fatigué', color: '#E08A0B' },
    { v: 5, label: 'Neutre', color: '#7F9A94' },
    { v: 7, label: 'Bien', color: '#2FBFA1' },
    { v: 9, label: 'Pleine forme', color: '#0B8071' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {levels.map(l => (
        <button
          key={l.v}
          onClick={() => onChange(l.v)}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
            background: value === l.v ? l.color : C.tint, cursor: 'pointer',
            fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
            color: value === l.v ? '#fff' : C.muted,
            transition: 'all .15s',
          }}
        >{l.label}</button>
      ))}
    </div>
  );
}

/* ── MetricSlider ── */
export function MetricSlider({ label, value, min = 1, max = 10, step = 1, color = C.teal, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.body }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color }}
      />
    </div>
  );
}

/* ── LineChart ── */
export function LineChart({ data, color = C.teal, height = 80, labels }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 340, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 16) - 4;
    return `${x},${y}`;
  });
  const path = `M ${pts.join(' L ')}`;
  const area = `M ${pts[0]} L ${pts.join(' L ')} L ${(data.length - 1) / (data.length - 1) * w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`lg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#lg-${color.replace('#','')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 16) - 4;
        return <circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 4 : 2.5} fill={color} />;
      })}
    </svg>
  );
}

/* ── RingChart ── */
export function RingChart({ value, max = 100, color = C.teal, size = 80, strokeWidth = 8, label, sub }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.line} strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset .5s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {label && <span style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1 }}>{label}</span>}
        {sub && <span style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ── CircleTimer ── */
export function CircleTimer({ total, elapsed, color = C.teal, size = 160, fill = false, children }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(elapsed / total, 1) : 0;
  const remaining = Math.max(0, total - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}`;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ position: 'absolute' }}>
        <defs>
          <clipPath id={`clip-${size}`}>
            <rect x={0} y={0} width={size} height={size * (1 - pct)} />
          </clipPath>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.line} strokeWidth={12} />
        {fill ? (
          <>
            <circle cx={size/2} cy={size/2} r={r} fill={color} opacity={0.13} />
            <circle cx={size/2} cy={size/2} r={r} fill={color} clipPath={`url(#clip-${size})`} opacity={0} />
            <circle
              cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={12}
              strokeDasharray={circ} strokeDashoffset={circ * pct}
              strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
            />
          </>
        ) : (
          <circle
            cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={12}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {children || <span style={{ fontSize: size > 120 ? 36 : 22, fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>}
      </div>
    </div>
  );
}

/* ── BottomNav ── */
export function BottomNav({ tabs, active, onSelect }) {
  const icons = { today: '⚡', progress: '📈', calendar: '📅', stretching: '🧘' };
  return (
    <nav style={{
      display: 'flex', background: '#fff', borderTop: `1px solid ${C.line}`,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, padding: '10px 0 8px', border: 'none', background: 'none',
            cursor: 'pointer', color: active === t.id ? C.teal : C.muted,
            fontSize: 11, fontWeight: active === t.id ? 600 : 400, fontFamily: 'inherit',
            transition: 'color .15s',
          }}
        >
          <span style={{ fontSize: 20 }}>{icons[t.id] || '•'}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

/* ── LogoMark ── */
export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <defs>
        <linearGradient id="lmBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2FBFA1"/><stop offset="1" stopColor="#0B8071"/>
        </linearGradient>
        <radialGradient id="lmSp" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#FFD9C7"/><stop offset="1" stopColor="#F2602E"/>
        </radialGradient>
      </defs>
      <rect width="120" height="120" rx="26" fill="url(#lmBg)"/>
      <path d="M30 86 L54 64 L78 44" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".95"/>
      <circle cx="30" cy="86" r="7.5" fill="#fff" opacity=".92"/>
      <circle cx="54" cy="64" r="8.5" fill="#fff"/>
      <circle cx="84" cy="38" r="13" fill="url(#lmSp)"/>
      <circle cx="84" cy="38" r="13" fill="none" stroke="#fff" strokeWidth="3.5"/>
    </svg>
  );
}

/* ── BrandMark ── */
export function BrandMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <LogoMark size={28} />
      <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 600, letterSpacing: '-.02em', color: C.ink }}>
        él<span style={{ color: C.teal }}>a</span>n
      </span>
    </div>
  );
}

/* ── Card ── */
export function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card, borderRadius: 18, padding: 16,
        boxShadow: C.sh, ...style,
        cursor: onClick ? 'pointer' : undefined,
      }}
    >{children}</div>
  );
}

/* ── Section ── */
export function Section({ label, children, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted }}>{label}</div>}
      {children}
    </div>
  );
}

/* ── Tag ── */
export function Tag({ label, color = C.teal }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: color + '18', color,
    }}>{label}</span>
  );
}

/* ── Toast ── */
let _toastFn = null;
export function useToast() { return _toastFn; }
export function ToastHost() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _toastFn = (msg, color = C.teal) => {
      const id = Date.now();
      setToasts(t => [...t, { id, msg, color }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
    };
    return () => { _toastFn = null; };
  }, []);
  return (
    <div style={{ position: 'absolute', bottom: 80, left: 16, right: 16, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.color, color: '#fff', borderRadius: 12, padding: '12px 16px',
          fontSize: 14, fontWeight: 500, boxShadow: C.shLg,
          animation: 'toastUp .3s ease',
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

/* ── AreaBadge ── */
export function AreaBadge({ area, label }) {
  const color = AREA_COLORS[area] || C.teal;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 99, fontSize: 10, fontWeight: 600,
      background: color + '20', color,
    }}>{label}</span>
  );
}

/* ── Divider ── */
export function Divider() {
  return <div style={{ height: 1, background: C.line, margin: '4px 0' }} />;
}
