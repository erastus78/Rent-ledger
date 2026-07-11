import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Building2,
  Users,
  Wallet,
  Receipt,
  Plus,
  X,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Printer,
} from "lucide-react";

// ---------- design tokens ----------
const T = {
  ink: "#14181D",
  navy: "#1B2733",
  paper: "#EDEFF2",
  card: "#FFFFFF",
  gold: "#B8862E",
  goldSoft: "#F3E7CF",
  brick: "#A63D3D",
  brickSoft: "#F5E1DF",
  sage: "#4F6F5D",
  sageSoft: "#E1E9E3",
  slate: "#6B7280",
  line: "#D8DCE1",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
@media print {
  body * { visibility: hidden; }
  #receipt-print, #receipt-print * { visibility: visible; }
  #receipt-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
}
`;

const fDisplay = { fontFamily: "'Fraunces', serif" };
const fBody = { fontFamily: "'Inter', sans-serif" };
const fMono = { fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums" };

const currency = (n) =>
  "KES " + (Number(n) || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 });

const monthLabel = (ym) => {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ---------- phone helpers (assumes Kenyan numbers by default: 07xx -> 2547xx) ----------
function phoneDigits(phone) {
  let p = (phone || "").replace(/[^\d]/g, "");
  if (!p) return "";
  if (p.startsWith("0")) p = "254" + p.slice(1);
  else if (p.startsWith("7") && p.length === 9) p = "254" + p;
  return p;
}
function smsLink(phone, message) {
  const digits = phoneDigits(phone);
  if (!digits) return null;
  return `sms:+${digits}?body=${encodeURIComponent(message)}`;
}
function waLink(phone, message) {
  const digits = phoneDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
function receiptNo(payment) {
  return "RCT-" + payment.id.slice(-6).toUpperCase();
}

// ---------- storage helpers ----------
async function loadKey(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // silently ignore; UI already reflects the in-memory state
  }
}

// ================= APP =================
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [loaded, setLoaded] = useState(false);
  const [buildingName, setBuildingName] = useState("Riverside Court");
  const [units, setUnits] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    (async () => {
      const [bn, u, p, e] = await Promise.all([
        loadKey("buildingName", "Riverside Court"),
        loadKey("units", SEED_UNITS),
        loadKey("payments", SEED_PAYMENTS),
        loadKey("expenses", SEED_EXPENSES),
      ]);
      setBuildingName(bn);
      setUnits(u);
      setPayments(p);
      setExpenses(e);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) saveKey("buildingName", buildingName);
  }, [buildingName, loaded]);
  useEffect(() => {
    if (loaded) saveKey("units", units);
  }, [units, loaded]);
  useEffect(() => {
    if (loaded) saveKey("payments", payments);
  }, [payments, loaded]);
  useEffect(() => {
    if (loaded) saveKey("expenses", expenses);
  }, [expenses, loaded]);

  const addUnit = useCallback((unit) => setUnits((u) => [...u, { id: uid(), ...unit }]), []);
  const updateUnit = useCallback(
    (id, patch) => setUnits((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    []
  );
  const deleteUnit = useCallback((id) => {
    setUnits((u) => u.filter((x) => x.id !== id));
    setPayments((p) => p.filter((x) => x.unitId !== id));
  }, []);

  const addPayment = useCallback((pmt) => setPayments((p) => [...p, { id: uid(), ...pmt }]), []);
  const deletePayment = useCallback((id) => setPayments((p) => p.filter((x) => x.id !== id)), []);

  const addExpense = useCallback((ex) => setExpenses((e) => [...e, { id: uid(), ...ex }]), []);
  const deleteExpense = useCallback((id) => setExpenses((e) => e.filter((x) => x.id !== id)), []);

  if (!loaded) {
    return (
      <div style={{ ...fBody, background: T.paper, minHeight: "100vh" }} className="flex items-center justify-center">
        <div style={{ color: T.slate }}>Loading rent ledger…</div>
      </div>
    );
  }

  return (
    <div style={{ ...fBody, background: T.paper, minHeight: "100vh", color: T.ink }}>
      <style>{FONTS}</style>
      <Header buildingName={buildingName} setBuildingName={setBuildingName} />
      <TabNav tab={tab} setTab={setTab} />
      <main className="max-w-5xl mx-auto px-4 pb-24 pt-6">
        {tab === "dashboard" && <Dashboard units={units} payments={payments} expenses={expenses} buildingName={buildingName} />}
        {tab === "units" && (
          <UnitsTab units={units} addUnit={addUnit} updateUnit={updateUnit} deleteUnit={deleteUnit} payments={payments} />
        )}
        {tab === "payments" && (
          <PaymentsTab units={units} payments={payments} addPayment={addPayment} deletePayment={deletePayment} buildingName={buildingName} />
        )}
        {tab === "expenses" && (
          <ExpensesTab expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} />
        )}
      </main>
    </div>
  );
}

// ---------- seed data ----------
const SEED_UNITS = [
  { id: "u1", number: "A1", tenant: "Wanjiru Kamau", phone: "0712345001", rent: 15000, status: "occupied" },
  { id: "u2", number: "A2", tenant: "Otieno Ochieng", phone: "0712345002", rent: 15000, status: "occupied" },
  { id: "u3", number: "A3", tenant: "", phone: "", rent: 15000, status: "vacant" },
  { id: "u4", number: "B1", tenant: "Achieng Odhiambo", phone: "0712345003", rent: 18000, status: "occupied" },
];
const SEED_PAYMENTS = [
  { id: "p1", unitId: "u1", month: currentMonth(), amount: 15000, date: new Date().toISOString().slice(0, 10) },
  { id: "p2", unitId: "u2", month: currentMonth(), amount: 8000, date: new Date().toISOString().slice(0, 10) },
];
const SEED_EXPENSES = [
  { id: "e1", date: new Date().toISOString().slice(0, 10), category: "Maintenance", description: "Plumbing repair - Unit A2", amount: 3500 },
];

// ================= HEADER =================
function Header({ buildingName, setBuildingName }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(buildingName);
  return (
    <header style={{ background: T.navy }} className="px-4 pt-6 pb-5">
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <div
          style={{ background: T.gold }}
          className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
        >
          <Building2 size={18} color={T.navy} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <div style={{ color: "#8B98A6", ...fBody }} className="text-[11px] tracking-wider uppercase">
            Rent Ledger
          </div>
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                setBuildingName(draft.trim() || "Untitled Property");
                setEditing(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              style={{ ...fDisplay, background: "transparent", color: "#fff", borderBottom: `1px solid ${T.gold}` }}
              className="text-xl font-semibold outline-none w-full"
            />
          ) : (
            <h1
              onClick={() => {
                setDraft(buildingName);
                setEditing(true);
              }}
              style={{ ...fDisplay, color: "#fff" }}
              className="text-xl font-semibold truncate cursor-pointer"
              title="Tap to rename"
            >
              {buildingName}
            </h1>
          )}
        </div>
      </div>
    </header>
  );
}

// ================= TAB NAV =================
function TabNav({ tab, setTab }) {
  const items = [
    { id: "dashboard", label: "Overview", icon: TrendingUp },
    { id: "units", label: "Units", icon: Users },
    { id: "payments", label: "Rent", icon: Wallet },
    { id: "expenses", label: "Expenses", icon: Receipt },
  ];
  return (
    <div style={{ background: T.navy, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-5xl mx-auto px-2 flex">
        {items.map((it) => {
          const active = tab === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              style={{
                ...fBody,
                color: active ? T.gold : "#9AA6B2",
                borderBottom: active ? `2px solid ${T.gold}` : "2px solid transparent",
              }}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors"
            >
              <Icon size={16} strokeWidth={2} />
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ================= DASHBOARD =================
function Dashboard({ units, payments, expenses, buildingName }) {
  const cm = currentMonth();

  const occupied = units.filter((u) => u.status === "occupied");
  const vacant = units.filter((u) => u.status === "vacant");
  const occupancyRate = units.length ? occupied.length / units.length : 0;

  const expectedThisMonth = occupied.reduce((s, u) => s + Number(u.rent || 0), 0);
  const collectedThisMonth = payments
    .filter((p) => p.month === cm)
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const collectionRate = expectedThisMonth ? collectedThisMonth / expectedThisMonth : 0;

  const expensesThisMonth = expenses
    .filter((e) => (e.date || "").slice(0, 7) === cm)
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const net = collectedThisMonth - expensesThisMonth;

  const arrears = useMemo(() => {
    return occupied
      .map((u) => {
        const paid = payments
          .filter((p) => p.unitId === u.id && p.month === cm)
          .reduce((s, p) => s + Number(p.amount || 0), 0);
        const due = Number(u.rent || 0) - paid;
        return { ...u, paid, due };
      })
      .filter((u) => u.due > 0)
      .sort((a, b) => b.due - a.due);
  }, [occupied, payments, cm]);

  const trend = useMemo(() => {
    const months = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
      months.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
    }
    return months.map((m) => ({
      month: m,
      collected: payments.filter((p) => p.month === m).reduce((s, p) => s + Number(p.amount || 0), 0),
      spent: expenses.filter((e) => (e.date || "").slice(0, 7) === m).reduce((s, e) => s + Number(e.amount || 0), 0),
    }));
  }, [payments, expenses]);

  const maxVal = Math.max(1, ...trend.map((t) => Math.max(t.collected, t.spent)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Occupancy" value={`${Math.round(occupancyRate * 100)}%`} sub={`${occupied.length} of ${units.length} units`} accent={T.sage} />
        <KpiCard label="Collection rate" value={`${Math.round(collectionRate * 100)}%`} sub={`${currency(collectedThisMonth)} of ${currency(expectedThisMonth)}`} accent={T.gold} />
        <KpiCard label="Expenses (month)" value={currency(expensesThisMonth)} sub={monthLabel(cm)} accent={T.brick} />
        <KpiCard
          label="Net position"
          value={currency(net)}
          sub={net >= 0 ? "Surplus" : "Deficit"}
          accent={net >= 0 ? T.sage : T.brick}
          icon={net >= 0 ? TrendingUp : TrendingDown}
        />
      </div>

      <Panel title="6-month cash flow">
        <div className="flex items-end gap-3 h-36 px-1">
          {trend.map((t) => (
            <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end gap-0.5 h-28">
                <div
                  style={{ background: T.gold, height: `${(t.collected / maxVal) * 100}%` }}
                  className="flex-1 rounded-t-sm min-h-[2px]"
                  title={`Collected ${currency(t.collected)}`}
                />
                <div
                  style={{ background: T.brick, height: `${(t.spent / maxVal) * 100}%` }}
                  className="flex-1 rounded-t-sm min-h-[2px]"
                  title={`Spent ${currency(t.spent)}`}
                />
              </div>
              <div style={{ ...fMono, color: T.slate }} className="text-[9px]">
                {monthLabel(t.month).split(" ")[0]}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 px-1">
          <Legend swatch={T.gold} label="Collected" />
          <Legend swatch={T.brick} label="Spent" />
        </div>
      </Panel>

      <Panel title={`Arrears this month${arrears.length ? ` (${arrears.length})` : ""}`}>
        {arrears.length === 0 ? (
          <EmptyRow icon={CheckCircle2} color={T.sage} text="Every occupied unit is paid up for this month." />
        ) : (
          <div className="divide-y" style={{ borderColor: T.line }}>
            {arrears.map((u) => {
              const msg = `Dear ${u.tenant || "Tenant"}, this is a reminder that ${currency(u.due)} rent for ${u.number} (${monthLabel(cm)}) is still outstanding. Kindly settle at your earliest convenience. - ${buildingName} Management`;
              const sms = smsLink(u.phone, msg);
              const wa = waLink(u.phone, msg);
              return (
                <div key={u.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div style={{ ...fBody }} className="text-sm font-medium">
                        {u.number} — {u.tenant || "Vacant"}
                      </div>
                      <div style={{ ...fMono, color: T.slate }} className="text-xs">
                        Paid {currency(u.paid)} of {currency(u.rent)}
                      </div>
                    </div>
                    <div style={{ ...fMono, color: T.brick }} className="text-sm font-semibold">
                      {currency(u.due)}
                    </div>
                  </div>
                  {(sms || wa) ? (
                    <div className="flex gap-2 mt-2">
                      {sms && (
                        <a href={sms} style={{ background: T.goldSoft, color: T.navy }} className="inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs font-semibold no-underline">
                          <MessageCircle size={12} /> SMS
                        </a>
                      )}
                      {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" style={{ background: T.sageSoft, color: T.sage }} className="inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs font-semibold no-underline">
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      )}
                    </div>
                  ) : (
                    <div style={{ ...fBody, color: T.slate }} className="text-[11px] mt-1.5">
                      Add a phone number in Units to send a reminder
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Legend({ swatch, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div style={{ background: swatch }} className="w-2.5 h-2.5 rounded-sm" />
      <span style={{ ...fBody, color: T.slate }} className="text-xs">
        {label}
      </span>
    </div>
  );
}

function KpiCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div style={{ background: T.card, borderLeft: `3px solid ${accent}` }} className="rounded-sm p-3.5 shadow-sm">
      <div style={{ ...fBody, color: T.slate }} className="text-[11px] uppercase tracking-wide flex items-center gap-1">
        {label}
      </div>
      <div style={{ ...fDisplay, color: T.ink }} className="text-2xl font-semibold mt-0.5 flex items-center gap-1.5">
        {value}
        {Icon && <Icon size={16} color={accent} />}
      </div>
      <div style={{ ...fBody, color: T.slate }} className="text-xs mt-0.5">
        {sub}
      </div>
    </div>
  );
}

function Panel({ title, children, action }) {
  return (
    <div style={{ background: T.card }} className="rounded-sm shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ ...fDisplay, color: T.ink }} className="text-base font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ icon: Icon, color, text }) {
  return (
    <div className="flex flex-col items-center text-center py-8 gap-2">
      <Icon size={22} color={color} />
      <div style={{ ...fBody, color: T.slate }} className="text-sm max-w-xs">
        {text}
      </div>
    </div>
  );
}

// ================= UNITS TAB =================
function UnitsTab({ units, addUnit, updateUnit, deleteUnit, payments }) {
  const [showForm, setShowForm] = useState(false);
  const cm = currentMonth();

  return (
    <div className="space-y-4">
      <Panel
        title={`Units (${units.length})`}
        action={
          <button onClick={() => setShowForm(true)} style={{ background: T.navy, color: "#fff" }} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-sm">
            <Plus size={14} /> Add unit
          </button>
        }
      >
        {units.length === 0 ? (
          <EmptyRow icon={Building2} color={T.slate} text="No units yet. Add your first unit to start tracking rent." />
        ) : (
          <div className="divide-y" style={{ borderColor: T.line }}>
            {units
              .slice()
              .sort((a, b) => a.number.localeCompare(b.number))
              .map((u) => {
                const paidThisMonth = payments
                  .filter((p) => p.unitId === u.id && p.month === cm)
                  .reduce((s, p) => s + Number(p.amount || 0), 0);
                return (
                  <UnitRow
                    key={u.id}
                    unit={u}
                    paidThisMonth={paidThisMonth}
                    onUpdate={(patch) => updateUnit(u.id, patch)}
                    onDelete={() => deleteUnit(u.id)}
                  />
                );
              })}
          </div>
        )}
      </Panel>

      {showForm && <UnitFormModal onClose={() => setShowForm(false)} onSave={(u) => { addUnit(u); setShowForm(false); }} />}
    </div>
  );
}

function UnitRow({ unit, paidThisMonth, onUpdate, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const occupied = unit.status === "occupied";
  const fullyPaid = occupied ? paidThisMonth >= Number(unit.rent) : true;

  return (
    <div className="py-3 flex items-center gap-3">
      <div
        style={{ background: occupied ? T.sageSoft : T.brickSoft }}
        className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
      >
        <span style={{ ...fMono, color: occupied ? T.sage : T.brick }} className="text-[11px] font-semibold">
          {unit.number}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ ...fBody, color: T.ink }} className="text-sm font-medium truncate">
          {unit.tenant || <span style={{ color: T.slate }}>Vacant</span>}
        </div>
        <div style={{ ...fMono, color: T.slate }} className="text-xs flex items-center gap-2">
          {currency(unit.rent)}/mo
          {occupied && (
            <span style={{ color: fullyPaid ? T.sage : T.brick }} className="flex items-center gap-0.5">
              · {fullyPaid ? "Paid" : `${currency(paidThisMonth)} paid`}
            </span>
          )}
        </div>
      </div>
      <select
        value={unit.status}
        onChange={(e) => onUpdate({ status: e.target.value })}
        style={{ ...fBody, borderColor: T.line, color: T.ink }}
        className="text-xs border rounded-sm px-1.5 py-1 bg-white"
      >
        <option value="occupied">Occupied</option>
        <option value="vacant">Vacant</option>
      </select>
      {confirmDel ? (
        <div className="flex items-center gap-1">
          <button onClick={onDelete} style={{ color: T.brick }} className="text-xs font-medium px-1.5">
            Confirm
          </button>
          <button onClick={() => setConfirmDel(false)} style={{ color: T.slate }} className="text-xs px-1">
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirmDel(true)} style={{ color: T.slate }} className="p-1">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

function UnitFormModal({ onClose, onSave }) {
  const [number, setNumber] = useState("");
  const [tenant, setTenant] = useState("");
  const [phone, setPhone] = useState("");
  const [rent, setRent] = useState("");
  const [status, setStatus] = useState("occupied");

  const canSave = number.trim() && rent;

  return (
    <Modal title="Add unit" onClose={onClose}>
      <Field label="Unit number">
        <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. A1" style={inputStyle} />
      </Field>
      <Field label="Tenant name (optional if vacant)">
        <input value={tenant} onChange={(e) => setTenant(e.target.value)} placeholder="e.g. Wanjiru Kamau" style={inputStyle} />
      </Field>
      <Field label="Tenant phone (for SMS/WhatsApp)">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712345678" style={inputStyle} />
      </Field>
      <Field label="Monthly rent (KES)">
        <input type="number" value={rent} onChange={(e) => setRent(e.target.value)} placeholder="15000" style={inputStyle} />
      </Field>
      <Field label="Status">
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
          <option value="occupied">Occupied</option>
          <option value="vacant">Vacant</option>
        </select>
      </Field>
      <ModalActions onClose={onClose} onSave={() => onSave({ number: number.trim(), tenant: tenant.trim(), phone: phone.trim(), rent: Number(rent), status })} disabled={!canSave} />
    </Modal>
  );
}

// ================= PAYMENTS TAB =================
function PaymentsTab({ units, payments, addPayment, deletePayment, buildingName }) {
  const [showForm, setShowForm] = useState(false);
  const [receiptFor, setReceiptFor] = useState(null);
  const sorted = payments.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));

  return (
    <div className="space-y-4">
      <Panel
        title={`Rent payments (${payments.length})`}
        action={
          <button onClick={() => setShowForm(true)} style={{ background: T.navy, color: "#fff" }} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-sm" disabled={units.length === 0}>
            <Plus size={14} /> Log payment
          </button>
        }
      >
        {units.length === 0 ? (
          <EmptyRow icon={AlertTriangle} color={T.slate} text="Add a unit first before logging rent payments." />
        ) : sorted.length === 0 ? (
          <EmptyRow icon={Wallet} color={T.slate} text="No payments logged yet." />
        ) : (
          <div className="divide-y" style={{ borderColor: T.line }}>
            {sorted.map((p) => {
              const u = unitMap[p.unitId];
              return (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div style={{ ...fBody }} className="text-sm font-medium truncate">
                      {u ? `${u.number} — ${u.tenant || "Vacant"}` : "Unit removed"}
                    </div>
                    <div style={{ ...fMono, color: T.slate }} className="text-xs">
                      {monthLabel(p.month)} · {p.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span style={{ ...fMono, color: T.gold }} className="text-sm font-semibold">
                      {currency(p.amount)}
                    </span>
                    {u && (
                      <button onClick={() => setReceiptFor(p.id)} style={{ color: T.navy, background: T.goldSoft }} className="text-[11px] font-semibold px-2 py-1 rounded-sm">
                        Receipt
                      </button>
                    )}
                    <button onClick={() => deletePayment(p.id)} style={{ color: T.slate }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {showForm && <PaymentFormModal units={units} onClose={() => setShowForm(false)} onSave={(p) => { addPayment(p); setShowForm(false); }} />}
      {receiptFor && (() => {
        const payment = payments.find((p) => p.id === receiptFor);
        const unit = payment ? unitMap[payment.unitId] : null;
        if (!payment || !unit) return null;
        const paidThisMonth = payments.filter((p) => p.unitId === unit.id && p.month === payment.month).reduce((s, p) => s + Number(p.amount || 0), 0);
        const balance = Number(unit.rent || 0) - paidThisMonth;
        return <ReceiptView payment={payment} unit={unit} balance={balance} buildingName={buildingName} onClose={() => setReceiptFor(null)} />;
      })()}
    </div>
  );
}

function PaymentFormModal({ units, onClose, onSave }) {
  const [unitId, setUnitId] = useState(units[0]?.id || "");
  const [month, setMonth] = useState(currentMonth());
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const canSave = unitId && amount && month && date;

  return (
    <Modal title="Log rent payment" onClose={onClose}>
      <Field label="Unit">
        <select value={unitId} onChange={(e) => setUnitId(e.target.value)} style={inputStyle}>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.number} — {u.tenant || "Vacant"}
            </option>
          ))}
        </select>
      </Field>
      <Field label="For month">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Amount paid (KES)">
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="15000" style={inputStyle} />
      </Field>
      <Field label="Date paid">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </Field>
      <ModalActions onClose={onClose} onSave={() => onSave({ unitId, month, amount: Number(amount), date })} disabled={!canSave} />
    </Modal>
  );
}

// ================= EXPENSES TAB =================
const EXPENSE_CATEGORIES = ["Maintenance", "Utilities", "Security", "Cleaning", "Insurance", "Rates & Taxes", "Management Fee", "Other"];

function ExpensesTab({ expenses, addExpense, deleteExpense }) {
  const [showForm, setShowForm] = useState(false);
  const sorted = expenses.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div className="space-y-4">
      <Panel
        title={`Expenses (${expenses.length})`}
        action={
          <button onClick={() => setShowForm(true)} style={{ background: T.navy, color: "#fff" }} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-sm">
            <Plus size={14} /> Log expense
          </button>
        }
      >
        {sorted.length === 0 ? (
          <EmptyRow icon={Receipt} color={T.slate} text="No expenses logged yet." />
        ) : (
          <div className="divide-y" style={{ borderColor: T.line }}>
            {sorted.map((e) => (
              <div key={e.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div style={{ ...fBody }} className="text-sm font-medium truncate">
                    {e.description || e.category}
                  </div>
                  <div style={{ ...fMono, color: T.slate }} className="text-xs">
                    {e.category} · {e.date}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span style={{ ...fMono, color: T.brick }} className="text-sm font-semibold">
                    {currency(e.amount)}
                  </span>
                  <button onClick={() => deleteExpense(e.id)} style={{ color: T.slate }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {showForm && <ExpenseFormModal onClose={() => setShowForm(false)} onSave={(ex) => { addExpense(ex); setShowForm(false); }} />}
    </div>
  );
}

function ExpenseFormModal({ onClose, onSave }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const canSave = amount && date && category;

  return (
    <Modal title="Log expense" onClose={onClose}>
      <Field label="Date">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Category">
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Description">
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Plumbing repair - Unit A2" style={inputStyle} />
      </Field>
      <Field label="Amount (KES)">
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="3500" style={inputStyle} />
      </Field>
      <ModalActions onClose={onClose} onSave={() => onSave({ date, category, description: description.trim(), amount: Number(amount) })} disabled={!canSave} />
    </Modal>
  );
}

// ================= RECEIPT VIEW =================
function ReceiptView({ payment, unit, balance, buildingName, onClose }) {
  const message = `Dear ${unit.tenant || "Tenant"}, receipt ${receiptNo(payment)}: we have received ${currency(payment.amount)} for ${unit.number} rent (${monthLabel(payment.month)}) on ${payment.date}. ${balance > 0 ? `Balance remaining: ${currency(balance)}.` : "Rent fully paid for this month."} - ${buildingName} Management`;
  const sms = smsLink(unit.phone, message);
  const wa = waLink(unit.phone, message);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(20,24,29,0.5)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.card }} className="w-full sm:w-96 rounded-t-lg sm:rounded-sm p-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 no-print">
          <h3 style={{ ...fDisplay, color: T.ink }} className="text-lg font-semibold">Receipt</h3>
          <button onClick={onClose} style={{ color: T.slate }}><X size={18} /></button>
        </div>

        <div id="receipt-print" style={{ border: `2px solid ${T.navy}` }} className="rounded p-4">
          <div style={{ ...fDisplay, color: T.navy }} className="text-xl font-bold">{buildingName}</div>
          <div style={{ ...fBody, color: T.slate }} className="text-xs italic mb-3.5">OFFICIAL RENT RECEIPT</div>

          <ReceiptLine label="Receipt No." value={receiptNo(payment)} />
          <ReceiptLine label="Date" value={payment.date} />
          <ReceiptLine label="Received From" value={unit.tenant || "Vacant"} />
          <ReceiptLine label="Unit" value={unit.number} />
          <ReceiptLine label="For Month" value={monthLabel(payment.month)} />
          <ReceiptLine label="Amount Paid" value={currency(payment.amount)} strong />
          <ReceiptLine label="Balance Remaining" value={currency(Math.max(balance, 0))} strong={balance > 0} color={balance > 0 ? T.brick : T.sage} />

          <div style={{ color: T.ink }} className="text-xs mt-4">Received By: ________________________</div>
        </div>

        <div className="no-print flex flex-col gap-2 mt-4">
          <button onClick={() => window.print()} style={{ background: T.navy, color: "#fff" }} className="flex items-center justify-center gap-1.5 rounded py-2.5 text-sm font-semibold">
            <Printer size={15} /> Print receipt
          </button>
          {sms ? (
            <a href={sms} style={{ background: T.gold, color: "#fff" }} className="flex items-center justify-center gap-1.5 rounded py-2.5 text-sm font-semibold no-underline">
              <MessageCircle size={15} /> Send via SMS
            </a>
          ) : (
            <div style={{ ...fBody, color: T.slate }} className="text-xs text-center">Add a phone number to this unit to send SMS/WhatsApp</div>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" style={{ background: T.sage, color: "#fff" }} className="flex items-center justify-center gap-1.5 rounded py-2.5 text-sm font-semibold no-underline">
              <MessageCircle size={15} /> Send via WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ReceiptLine({ label, value, strong, color }) {
  return (
    <div style={{ borderBottom: `1px dashed ${T.line}` }} className="flex justify-between py-1.5">
      <span style={{ ...fBody, color: T.slate }} className="text-xs">{label}</span>
      <span style={{ ...fMono, color: color || T.ink, fontWeight: strong ? 700 : 500, fontSize: strong ? 15 : 13 }}>{value}</span>
    </div>
  );
}

// ================= SHARED UI =================
const inputStyle = {
  ...fBody,
  width: "100%",
  border: `1px solid ${T.line}`,
  borderRadius: "2px",
  padding: "8px 10px",
  fontSize: "14px",
  color: T.ink,
  background: "#fff",
};

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <div style={{ ...fBody, color: T.slate }} className="text-xs font-medium mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(20,24,29,0.5)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: T.card }}
        className="w-full sm:w-96 rounded-t-lg sm:rounded-sm p-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ ...fDisplay, color: T.ink }} className="text-lg font-semibold">
            {title}
          </h3>
          <button onClick={onClose} style={{ color: T.slate }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, onSave, disabled }) {
  return (
    <div className="flex gap-2 mt-4">
      <button onClick={onClose} style={{ ...fBody, color: T.ink, border: `1px solid ${T.line}` }} className="flex-1 py-2 rounded-sm text-sm font-medium">
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={disabled}
        style={{ ...fBody, background: disabled ? T.line : T.navy, color: disabled ? T.slate : "#fff" }}
        className="flex-1 py-2 rounded-sm text-sm font-medium"
      >
        Save
      </button>
    </div>
  );
}
