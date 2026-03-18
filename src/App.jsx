import React, { useState, useEffect, useCallback } from "react";
import { db } from "./firebase.js";
import { ref, push, remove, onValue } from "firebase/database";

// --- Helpers ---
const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const fmtDate = (iso) => new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
const toDateKey = (iso) => new Date(iso).toISOString().slice(0, 10);
const isToday = (iso) => toDateKey(iso) === toDateKey(new Date().toISOString());
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateKey(d.toISOString());
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const hourLabel = (h) => {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
};

// --- Palette ---
const C = {
  bg: "#FAF6F0", card: "#FFFFFF", accent: "#E8843C", accentLight: "#FFF0E5",
  green: "#4CAF82", greenLight: "#E8F8EF", red: "#E25C5C", redLight: "#FDE8E8",
  blue: "#5B8DEF", blueLight: "#EAF0FF", purple: "#9B72CF", purpleLight: "#F3EDFA",
  text: "#2D2319", textMuted: "#8C7E72", border: "#EDE6DC",
  shadow: "0 2px 12px rgba(45,35,25,0.06)",
};

const typeEmoji = { pee: "💧", poop: "💩", both: "💧💩" };
const locEmoji = { outside: "🌳", inside: "🏠" };

// --- Small Components ---
function Pill({ active, onClick, children, color = C.accent }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", borderRadius: 99, border: `2px solid ${active ? color : C.border}`,
      background: active ? color : C.card, color: active ? "#FFF" : C.text,
      fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14,
      cursor: "pointer", transition: "all .2s",
    }}>{children}</button>
  );
}

function StatCard({ emoji, label, value, color, bg }) {
  return (
    <div style={{
      background: bg, borderRadius: 16, padding: "16px 20px", flex: 1, minWidth: 130,
      border: `1.5px solid ${color}22`,
    }}>
      <div style={{ fontSize: 24 }}>{emoji}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Nunito', sans-serif" }}>{value}</div>
      <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// --- Charts ---
function TimeHeatmap({ entries }) {
  const last7 = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
  const grid = {};
  last7.forEach((d) => HOURS.forEach((h) => { grid[`${d}-${h}`] = 0; }));
  entries.forEach((e) => {
    const dk = toDateKey(e.time);
    const h = new Date(e.time).getHours();
    const key = `${dk}-${h}`;
    if (key in grid) grid[key]++;
  });
  const max = Math.max(1, ...Object.values(grid));
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `60px repeat(${HOURS.length}, 1fr)`, gap: 2, minWidth: 500 }}>
        <div />
        {HOURS.filter((_, i) => i % 3 === 0).map((h) => (
          <div key={h} style={{ gridColumn: "span 3", fontSize: 10, color: C.textMuted, textAlign: "center", fontWeight: 600 }}>{hourLabel(h)}</div>
        ))}
        {last7.map((d) => (
          <React.Fragment key={d}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, display: "flex", alignItems: "center" }}>
              {new Date(d + "T12:00:00").toLocaleDateString([], { weekday: "short" })}
            </div>
            {HOURS.map((h) => {
              const v = grid[`${d}-${h}`] || 0;
              const opacity = v === 0 ? 0.08 : 0.2 + (v / max) * 0.8;
              return <div key={h} title={`${hourLabel(h)}: ${v}`} style={{ borderRadius: 4, aspectRatio: "1", background: C.accent, opacity, transition: "opacity .3s" }} />;
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function AccidentChart({ entries }) {
  const last14 = Array.from({ length: 14 }, (_, i) => daysAgo(13 - i));
  const data = last14.map((d) => {
    const dayEntries = entries.filter((e) => toDateKey(e.time) === d);
    return { day: d, accidents: dayEntries.filter((e) => e.location === "inside").length, total: dayEntries.length };
  });
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.accidents, d.total)));
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, fontSize: 12, fontWeight: 600 }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: C.green, marginRight: 4 }} />Total</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: C.red, marginRight: 4 }} />Accidents</span>
      </div>
      <svg viewBox="0 0 400 120" style={{ width: "100%", overflow: "visible" }}>
        {data.map((d, i) => {
          const x = i * (400 / data.length) + 4;
          const w = (400 / data.length) - 8;
          const totalH = (d.total / maxVal) * 90;
          const accH = (d.accidents / maxVal) * 90;
          return (
            <g key={d.day}>
              <rect x={x} y={100 - totalH} width={w} height={totalH} rx={4} fill={C.green} opacity={0.7} />
              {d.accidents > 0 && <rect x={x} y={100 - accH} width={w} height={accH} rx={4} fill={C.red} opacity={0.8} />}
              <text x={x + w / 2} y={115} textAnchor="middle" fontSize="8" fill={C.textMuted} fontFamily="Nunito" fontWeight="600">
                {new Date(d.day + "T12:00:00").getDate()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function WeeklySummary({ entries }) {
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const week = entries.filter((e) => new Date(e.time) >= thisWeekStart);
  const pees = week.filter((e) => e.type === "pee" || e.type === "both").length;
  const poops = week.filter((e) => e.type === "poop" || e.type === "both").length;
  const accidents = week.filter((e) => e.location === "inside").length;
  const outside = week.filter((e) => e.location === "outside").length;
  const rate = week.length > 0 ? Math.round((outside / week.length) * 100) : 0;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      <StatCard emoji="💧" label="Pees" value={pees} color={C.blue} bg={C.blueLight} />
      <StatCard emoji="💩" label="Poops" value={poops} color={C.accent} bg={C.accentLight} />
      <StatCard emoji="🏠" label="Accidents" value={accidents} color={C.red} bg={C.redLight} />
      <StatCard emoji="🎯" label="Success Rate" value={`${rate}%`} color={C.green} bg={C.greenLight} />
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("log");
  const [form, setForm] = useState({ type: "pee", location: "outside", notes: "" });
  const [deleting, setDeleting] = useState(null);

  // Subscribe to Firebase — live sync across devices
  useEffect(() => {
    const entriesRef = ref(db, "entries");
    const unsub = onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.entries(data).map(([fbKey, val]) => ({ ...val, fbKey }));
        arr.sort((a, b) => b.time.localeCompare(a.time));
        setEntries(arr);
      } else {
        setEntries([]);
      }
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const addEntry = async () => {
    const entry = { ...form, time: new Date().toISOString() };
    await push(ref(db, "entries"), entry);
    setForm({ type: "pee", location: "outside", notes: "" });
    setView("log");
  };

  const deleteEntry = async (fbKey) => {
    await remove(ref(db, `entries/${fbKey}`));
    setDeleting(null);
  };

  // Group by date
  const grouped = {};
  entries.forEach((e) => {
    const k = toDateKey(e.time);
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(e);
  });
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 48, animation: "bounce 1s infinite" }}>🐾</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Nunito', sans-serif", color: C.text, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.accent}, #D4722E)`, color: "#FFF",
        padding: "28px 20px 20px", borderRadius: "0 0 28px 28px",
        boxShadow: "0 4px 20px rgba(232,132,60,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 36 }}>🐶</span>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Fredoka One', cursive", fontSize: 28, letterSpacing: 0.5 }}>Louie's Potty Log</h1>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.85, fontWeight: 600 }}>
              {fmtDate(new Date().toISOString())} · {entries.filter((e) => isToday(e.time)).length} breaks today
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 6, padding: "16px 16px 0", justifyContent: "center" }}>
        {[
          { key: "log", icon: "📋", label: "Log" },
          { key: "stats", icon: "📊", label: "Stats" },
          { key: "add", icon: "➕", label: "Add" },
        ].map((t) => (
          <button key={t.key} onClick={() => setView(t.key)} style={{
            flex: 1, maxWidth: 140, padding: "10px 0", borderRadius: 14,
            border: view === t.key ? `2px solid ${C.accent}` : `2px solid ${C.border}`,
            background: view === t.key ? C.accentLight : C.card,
            color: view === t.key ? C.accent : C.textMuted,
            fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14,
            cursor: "pointer", transition: "all .2s",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>

        {/* ADD VIEW */}
        {view === "add" && (
          <div style={{
            background: C.card, borderRadius: 20, padding: 24, boxShadow: C.shadow,
            animation: "fadeIn .3s ease",
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800 }}>🐾 New Entry</h2>

            <label style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, marginBottom: 8, display: "block" }}>Type</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {["pee", "poop", "both"].map((t) => (
                <Pill key={t} active={form.type === t} onClick={() => setForm({ ...form, type: t })}>
                  {typeEmoji[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                </Pill>
              ))}
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, marginBottom: 8, display: "block" }}>Location</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <Pill active={form.location === "outside"} onClick={() => setForm({ ...form, location: "outside" })} color={C.green}>
                🌳 Outside
              </Pill>
              <Pill active={form.location === "inside"} onClick={() => setForm({ ...form, location: "inside" })} color={C.red}>
                🏠 Inside (Accident)
              </Pill>
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, marginBottom: 8, display: "block" }}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. on the grass, after walk, quick one..."
              rows={2}
              style={{
                width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
                border: `2px solid ${C.border}`, fontFamily: "'Nunito', sans-serif", fontSize: 14,
                resize: "vertical", outline: "none", transition: "border .2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = C.accent)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />

            <button onClick={addEntry} style={{
              marginTop: 20, width: "100%", padding: "14px 0", borderRadius: 14,
              background: `linear-gradient(135deg, ${C.accent}, #D4722E)`, color: "#FFF",
              border: "none", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 16,
              cursor: "pointer", boxShadow: "0 4px 16px rgba(232,132,60,0.3)", transition: "transform .15s",
            }}
              onMouseDown={(e) => (e.target.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
            >
              Log It! 🐾
            </button>
          </div>
        )}

        {/* LOG VIEW */}
        {view === "log" && (
          <div>
            {dateKeys.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", color: C.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🐕</div>
                <p style={{ fontWeight: 700, fontSize: 16 }}>No entries yet!</p>
                <p style={{ fontSize: 14 }}>Tap <strong>+ Add</strong> to log Louie's first break.</p>
              </div>
            )}
            {dateKeys.map((dk) => (
              <div key={dk} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 13, fontWeight: 800, color: C.textMuted, padding: "4px 0 8px",
                  borderBottom: `2px solid ${C.border}`, marginBottom: 8,
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span>{isToday(grouped[dk][0].time) ? "Today" : fmtDate(grouped[dk][0].time)}</span>
                  <span>{grouped[dk].length} break{grouped[dk].length !== 1 ? "s" : ""}</span>
                </div>
                {grouped[dk].map((e) => (
                  <div key={e.fbKey} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    background: C.card, borderRadius: 14, marginBottom: 6, boxShadow: C.shadow,
                    border: e.location === "inside" ? `2px solid ${C.red}33` : `1.5px solid ${C.border}`,
                    animation: "fadeIn .3s ease",
                  }}>
                    <div style={{ fontSize: 24, lineHeight: 1 }}>{typeEmoji[e.type]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        {e.type.charAt(0).toUpperCase() + e.type.slice(1)}
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                          background: e.location === "outside" ? C.greenLight : C.redLight,
                          color: e.location === "outside" ? C.green : C.red,
                        }}>
                          {locEmoji[e.location]} {e.location === "outside" ? "Outside" : "Accident"}
                        </span>
                      </div>
                      {e.notes && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.notes}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(e.time)}</div>
                    {deleting === e.fbKey ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => deleteEntry(e.fbKey)} style={{
                          background: C.red, color: "#FFF", border: "none", borderRadius: 8,
                          padding: "4px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                        }}>Delete</button>
                        <button onClick={() => setDeleting(null)} style={{
                          background: C.border, color: C.text, border: "none", borderRadius: 8,
                          padding: "4px 8px", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                        }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleting(e.fbKey)} style={{
                        background: "none", border: "none", fontSize: 16, cursor: "pointer",
                        color: C.textMuted, padding: 4, opacity: 0.5,
                      }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* STATS VIEW */}
        {view === "stats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn .3s ease" }}>
            <div style={{ background: C.card, borderRadius: 20, padding: 20, boxShadow: C.shadow }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>📅 This Week</h3>
              <WeeklySummary entries={entries} />
            </div>
            <div style={{ background: C.card, borderRadius: 20, padding: 20, boxShadow: C.shadow }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>📊 Last 14 Days</h3>
              <AccidentChart entries={entries} />
            </div>
            <div style={{ background: C.card, borderRadius: 20, padding: 20, boxShadow: C.shadow }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>🕐 Time of Day (Last 7 Days)</h3>
              <TimeHeatmap entries={entries} />
            </div>
            {entries.length === 0 && (
              <div style={{ textAlign: "center", padding: 20, color: C.textMuted, fontSize: 14, fontWeight: 600 }}>
                Start logging to see Louie's patterns! 🐾
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
