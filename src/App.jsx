import { useState, useCallback, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell
} from "recharts";

const C = {
  bg: "#0a0e1a", panel: "#111827", card: "#1a2235", border: "#1f2d44",
  accent: "#f59e0b", accent2: "#38bdf8", accent3: "#a78bfa",
  green: "#34d399", red: "#f87171", text: "#e2e8f0", muted: "#64748b", subtle: "#94a3b8",
};

// ─── RESPONSIVE HELPERS ────────────────────────────────────────────────────
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  return { isMobile, isTablet };
};

const responsiveGrid = (isMobile, isTablet, mobileGap = 12, tabletGap = 14, desktopGap = 16) => {
  if (isMobile) return { display: "grid", gridTemplateColumns: "1fr", gap: mobileGap };
  if (isTablet) return { display: "grid", gridTemplateColumns: "1fr", gap: tabletGap };
  return { display: "grid", gridTemplateColumns: "1fr 1fr", gap: desktopGap };
};

const responsiveGridThreeCols = (isMobile, isTablet, mobileGap = 10, tabletGap = 12, desktopGap = 16) => {
  if (isMobile) return { display: "grid", gridTemplateColumns: "1fr", gap: mobileGap };
  if (isTablet) return { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: tabletGap };
  return { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: desktopGap };
};

const sigmoid = x => 1 / (1 + Math.exp(-x));
const deriv = (f, x, h = 0.001) => (f(x + h) - f(x - h)) / (2 * h);

const SECTIONS = [
  { id: "algebra", icon: "∑", label: "Algebra", color: "#f59e0b",
    topics: [{ id: "variables", label: "Variables & Functions" }, { id: "linear-eq", label: "Linear Equations" }, { id: "logarithms", label: "Logarithms" }, { id: "sigmoid", label: "Sigmoid Function" }] },
  { id: "linalg", icon: "⊗", label: "Linear Algebra", color: "#38bdf8",
    topics: [{ id: "tensors", label: "Tensors & Ranks" }, { id: "matmul", label: "Matrix Multiplication" }] },
  { id: "trig", icon: "∿", label: "Trigonometry", color: "#ec4899",
    topics: [{ id: "tanh", label: "tanh Activation Function" }] },
  { id: "stats", icon: "σ", label: "Statistics", color: "#34d399",
    topics: [{ id: "mean-median", label: "Mean, Median & Outliers" }, { id: "std-dev", label: "Standard Deviation" }, { id: "histogram", label: "Reading Histograms" }] },
  { id: "calculus", icon: "∂", label: "Calculus (Optional)", color: "#a78bfa",
    topics: [{ id: "derivatives", label: "Derivatives & Slopes" }, { id: "gradient", label: "Gradients" }, { id: "gradient-descent", label: "Gradient Descent" }, { id: "chain-rule", label: "Chain Rule" }, { id: "partial-deriv", label: "Partial Derivatives" }] },
  { id: "python", icon: "🐍", label: "Python Basics", color: "#fb923c",
    topics: [{ id: "data-types", label: "Data Types & Variables" }, { id: "functions", label: "Functions" }, { id: "data-structures", label: "Lists, Dicts & Sets" }, { id: "control-flow", label: "Loops & Conditionals" }, { id: "string-format", label: "String Formatting" }, { id: "list-comp", label: "List Comprehensions" }] },
  { id: "numpy", icon: "🔢", label: "NumPy Basics", color: "#06b6d4",
    topics: [{ id: "numpy-arrays", label: "NumPy Arrays" }, { id: "numpy-ops", label: "Array Operations" }, { id: "numpy-reshape", label: "Reshaping & Broadcasting" }] },
  { id: "pandas", icon: "🐼", label: "Pandas & Data", color: "#8b5cf6",
    topics: [{ id: "dataframes", label: "DataFrames & Series" }, { id: "data-access", label: "Accessing & Filtering Data" }, { id: "data-agg", label: "Aggregation & Grouping" }] },
  { id: "bash", icon: "⌨️", label: "Bash Terminal", color: "#6366f1",
    topics: [{ id: "bash-intro", label: "Command Line Basics" }, { id: "bash-files", label: "Files & Directories" }, { id: "bash-advanced", label: "Advanced Commands" }] },
];

function SliderInput({ label, min, max, step = 0.1, value, onChange, color = C.accent }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: C.subtle, fontSize: 12, fontFamily: "monospace" }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>{Number(value).toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, cursor: "pointer" }} />
    </div>
  );
}

function CodeBlock({ code }) {
  const kw = ["def","return","for","if","else","elif","in","not","and","or","True","False","None","import","from","class","print","range","len","int","float","str","bool","while"];
  return (
    <pre style={{ background: "#0d1117", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px", fontSize: 12.5, lineHeight: 1.75, overflowX: "auto", fontFamily: "'Fira Code', 'Cascadia Code', monospace", margin: "10px 0" }}>
      {code.split("\n").map((line, li) => {
        const parts = line.split(/(\s+|[()[\]{},:#=<>+\-*/]|"[^"]*"|'[^']*'|\b\d+\.?\d*\b)/);
        return (
          <div key={li}>{parts.map((part, pi) => {
            if (kw.includes(part.trim())) return <span key={pi} style={{ color: "#ff79c6" }}>{part}</span>;
            if (/^["'].*["']$/.test(part.trim())) return <span key={pi} style={{ color: "#f1fa8c" }}>{part}</span>;
            if (/^\d+\.?\d*$/.test(part.trim())) return <span key={pi} style={{ color: "#bd93f9" }}>{part}</span>;
            if (part.startsWith("#")) return <span key={pi} style={{ color: "#6272a4" }}>{part}</span>;
            return <span key={pi} style={{ color: "#f8f8f2" }}>{part}</span>;
          })}</div>
        );
      })}
    </pre>
  );
}

function Callout({ emoji = "💡", title, children, color = C.accent }) {
  return (
    <div style={{ background: `${color}11`, border: `1px solid ${color}44`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "11px 15px", margin: "12px 0" }}>
      <div style={{ color, fontWeight: 700, marginBottom: 3, fontSize: 12 }}>{emoji} {title}</div>
      <div style={{ color: C.subtle, fontSize: 12, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

const SectionTitle = ({ children }) => <h2 style={{ color: C.text, fontSize: 21, fontWeight: 800, marginBottom: 6, fontFamily: "Georgia, serif", marginTop: 0 }}>{children}</h2>;
const SubTitle = ({ children }) => <h3 style={{ color: C.accent2, fontSize: 13, fontWeight: 700, marginBottom: 8, letterSpacing: 0.3, marginTop: 0 }}>{children}</h3>;
const Para = ({ children }) => <p style={{ color: C.subtle, fontSize: 13, lineHeight: 1.75, marginBottom: 10, marginTop: 0 }}>{children}</p>;

const btnStyle = (color, size = "normal") => ({
  marginTop: 14, padding: size === "full" ? "9px 0" : size === "small" ? "5px 13px" : "9px 22px",
  width: size === "full" ? "100%" : undefined,
  background: color, border: "none", borderRadius: 8,
  color: [C.border, C.muted].includes(color) ? C.subtle : "#000",
  fontWeight: 700, fontSize: 12, cursor: "pointer",
});

function Card({ children, style = {} }) {
  return <div style={{ background: C.card, borderRadius: 12, padding: 18, border: `1px solid ${C.border}`, ...style }}>{children}</div>;
}

// ─── LESSONS ──────────────────────────────────────────────────────────────────

function LessonVariables({ onComplete, done, isMobile, isTablet }) {
  const [a, setA] = useState(2), [b, setB] = useState(3);
  const data = Array.from({ length: 11 }, (_, i) => { const x = i - 5; return { x, y: a * x + b }; });
  const gridStyle = isMobile ? { display: "flex", flexDirection: "column", gap: 16, marginTop: 14 } : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14 };
  return (
    <div>
      <SectionTitle>Variables & Functions</SectionTitle>
      <Para>A <strong style={{ color: C.accent }}>variable</strong> is a named value. In ML, <code style={{ color: C.accent3 }}>w</code> (weight) and <code style={{ color: C.accent3 }}>b</code> (bias) are the model's learnable variables.</Para>
      <Para>A <strong style={{ color: C.accent }}>function</strong> maps inputs to outputs: <code style={{ color: C.green }}>f(x) = a·x + b</code>. Adjust the sliders below.</Para>
      <div style={gridStyle}>
        <Card>
          <SubTitle>f(x) = a·x + b</SubTitle>
          <SliderInput label="a (slope / coefficient)" min={-4} max={4} value={a} onChange={setA} color={C.accent} />
          <SliderInput label="b (intercept / bias)" min={-5} max={5} value={b} onChange={setB} color={C.accent2} />
          <div style={{ padding: "9px 13px", background: "#0d1117", borderRadius: 7, fontFamily: "monospace", color: C.green, fontSize: 13 }}>
            f(x) = <span style={{ color: C.accent }}>{a.toFixed(2)}</span>·x + <span style={{ color: C.accent2 }}>{b.toFixed(2)}</span>
          </div>
        </Card>
        <Card style={{ padding: 12 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 190}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="x" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} />
              <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={C.muted} /><ReferenceLine x={0} stroke={C.muted} />
              <Line type="monotone" dataKey="y" stroke={C.accent} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Callout emoji="🤖" title="ML Connection" color={C.green}>In linear regression, the model learns <strong>w</strong> and <strong>b</strong> to fit data — exactly like tuning <em>a</em> and <em>b</em> above!</Callout>
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonLinearEq({ onComplete, done, isMobile, isTablet }) {
  const [w1, setW1] = useState(1.5), [w2, setW2] = useState(-0.8), [b, setB] = useState(2), [x2, setX2] = useState(1);
  const data = Array.from({ length: 21 }, (_, i) => { const x1 = (i - 10) * 0.5; return { x1, y: +(b + w1 * x1 + w2 * x2).toFixed(3) }; });
  const gridStyle = isMobile ? { display: "flex", flexDirection: "column", gap: 16, marginTop: 14 } : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14 };
  return (
    <div>
      <SectionTitle>Linear Equations</SectionTitle>
      <Para>The core ML equation: <code style={{ color: C.green }}>y = b + w₁x₁ + w₂x₂</code> where <code style={{ color: C.accent }}>x</code> = features, <code style={{ color: C.accent2 }}>w</code> = weights, <code style={{ color: C.accent3 }}>b</code> = bias. Every linear model is built on this.</Para>
      <div style={gridStyle}>
        <Card>
          <SubTitle>y = b + w₁·x₁ + w₂·x₂</SubTitle>
          <SliderInput label="w₁ (weight for x₁)" min={-3} max={3} value={w1} onChange={setW1} color={C.accent} />
          <SliderInput label="w₂ (weight for x₂)" min={-3} max={3} value={w2} onChange={setW2} color={C.accent2} />
          <SliderInput label="b (bias)" min={-5} max={5} value={b} onChange={setB} color={C.accent3} />
          <SliderInput label="x₂ (fixed feature val)" min={-3} max={3} value={x2} onChange={setX2} color={C.green} />
          <div style={{ padding: "8px 12px", background: "#0d1117", borderRadius: 7, fontFamily: "monospace", color: C.text, fontSize: 12, marginTop: 6 }}>
            y = <span style={{ color: C.accent3 }}>{b.toFixed(1)}</span> + <span style={{ color: C.accent }}>{w1.toFixed(1)}</span>·x₁ + <span style={{ color: C.accent2 }}>{w2.toFixed(1)}</span>·<span style={{ color: C.green }}>{x2.toFixed(1)}</span>
          </div>
        </Card>
        <Card style={{ padding: 12 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 210}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="x1" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} label={{ value: "x₁", fill: C.muted, fontSize: 11 }} />
              <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, fontSize: 11 }} />
              <Line type="monotone" dataKey="y" stroke={C.accent} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Callout emoji="🎯" title="Foundation of ML" color={C.accent}>Every neural network is stacked linear equations + nonlinear activations. This equation <em>is</em> the foundation.</Callout>
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonLogarithms({ onComplete, done, isMobile, isTablet }) {
  const data = Array.from({ length: 50 }, (_, i) => { const x = 0.1 + i * 0.2; return { x: +x.toFixed(2), ln: +Math.log(x).toFixed(3), log10: +Math.log10(x).toFixed(3), log2: +Math.log2(x).toFixed(3) }; });
  const gridStyle = isMobile ? { display: "flex", flexDirection: "column", gap: 16, marginTop: 14 } : { display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, marginTop: 14 };
  return (
    <div>
      <SectionTitle>Logarithms</SectionTitle>
      <Para>The <strong style={{ color: C.accent }}>natural log</strong> <code style={{ color: C.green }}>ln(x)</code> (base e) appears everywhere in ML — in the loss function of logistic regression: <code style={{ color: C.green }}>L = -[y·ln(p) + (1-y)·ln(1-p)]</code> and in softplus: <code style={{ color: C.green }}>ln(1 + eᶻ)</code>.</Para>
      <div style={gridStyle}>
        <Card style={{ padding: 14 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 230}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="x" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} />
              <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} domain={[-4, 4]} />
              <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={C.muted} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="ln" stroke={C.accent} strokeWidth={2.5} dot={false} name="ln(x)" />
              <Line type="monotone" dataKey="log10" stroke={C.accent2} strokeWidth={2} dot={false} name="log₁₀(x)" />
              <Line type="monotone" dataKey="log2" stroke={C.accent3} strokeWidth={2} dot={false} name="log₂(x)" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 6, justifyContent: "center", fontSize: 11, flexWrap: "wrap" }}>
            {[["ln(x)", C.accent], ["log₁₀(x)", C.accent2], ["log₂(x)", C.accent3]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 3, background: c, borderRadius: 2 }} /><span style={{ color: C.subtle }}>{l}</span></div>
            ))}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 8 : 10 }}>
          {[["ln(1) = 0", "Log of 1 is always 0", C.accent], ["ln(e) = 1", "Natural base property", C.accent2], ["ln(0) → -∞", "Undefined at 0", C.red], ["eˡⁿ⁽ˣ⁾ = x", "Log inverts exp", C.green]].map(([f, d, c]) => (
            <div key={f} style={{ background: C.card, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ fontFamily: "monospace", color: c, fontWeight: 700, fontSize: isMobile ? 12 : 13 }}>{f}</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonSigmoid({ onComplete, done, isMobile, isTablet }) {
  const [z, setZ] = useState(0);
  const data = Array.from({ length: 101 }, (_, i) => { const x = -5 + i * 0.1; return { x: +x.toFixed(2), sigmoid: +sigmoid(x).toFixed(4), tanh: +Math.tanh(x).toFixed(4), relu: +Math.max(0, x).toFixed(4) }; });
  const sigZ = sigmoid(z);
  const gridStyle = isMobile ? { display: "flex", flexDirection: "column", gap: 16, marginTop: 14 } : { display: "grid", gridTemplateColumns: "190px 1fr", gap: 16, marginTop: 14 };
  return (
    <div>
      <SectionTitle>Sigmoid Function</SectionTitle>
      <Para>Sigmoid maps any number to (0,1): <code style={{ color: C.green }}>σ(z) = 1 / (1 + e⁻ᶻ)</code>. It turns a raw score into a <strong>probability</strong>. Used in logistic regression and as a neural network activation.</Para>
      <div style={gridStyle}>
        <Card>
          <SubTitle>Try it live</SubTitle>
          <SliderInput label="z (input)" min={-5} max={5} value={z} onChange={setZ} color={C.accent} />
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>σ({z.toFixed(2)}) =</div>
            <div style={{ fontSize: isMobile ? 28 : 34, fontWeight: 900, color: C.accent, fontFamily: "monospace" }}>{sigZ.toFixed(4)}</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ background: C.border, borderRadius: 999, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${sigZ * 100}%`, background: `linear-gradient(90deg, ${C.accent2}, ${C.accent})`, height: "100%", borderRadius: 999, transition: "width 0.2s" }} />
              </div>
              <div style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{(sigZ * 100).toFixed(1)}% probability</div>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
            z ≪ 0 → σ ≈ 0 (unlikely)<br />z = 0 → σ = 0.5 (uncertain)<br />z ≫ 0 → σ ≈ 1 (very likely)
          </div>
        </Card>
        <Card style={{ padding: 12 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="x" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} />
              <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} domain={[-1.1, 1.5]} />
              <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={C.muted} strokeDasharray="2 2" />
              <ReferenceLine y={1} stroke={C.muted} strokeDasharray="2 2" />
              <ReferenceLine x={z} stroke={C.accent} strokeDasharray="4 2" strokeWidth={1.5} />
              <Line type="monotone" dataKey="sigmoid" stroke={C.accent} strokeWidth={2.5} dot={false} name="σ(z)" />
              <Line type="monotone" dataKey="tanh" stroke={C.accent2} strokeWidth={2} dot={false} name="tanh(z)" />
              <Line type="monotone" dataKey="relu" stroke={C.accent3} strokeWidth={2} dot={false} name="ReLU(z)" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 6, justifyContent: "center", fontSize: 11, flexWrap: "wrap" }}>
            {[["σ(z)", C.accent], ["tanh(z)", C.accent2], ["ReLU(z)", C.accent3]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 3, background: c }} /><span style={{ color: C.subtle }}>{l}</span></div>
            ))}
          </div>
        </Card>
      </div>
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonTensors({ onComplete, done, isMobile, isTablet }) {
  const [rank, setRank] = useState(2);
  const ranks = [
    { r: 0, name: "Scalar", shape: "()", example: "42.0", desc: "Single number. e.g., a loss value or single weight.",
      viz: <div style={{ display: "flex", justifyContent: "center" }}><div style={{ background: C.accent, width: 52, height: 52, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#000" }}>42</div></div> },
    { r: 1, name: "Vector", shape: "(3,)", example: "[0.2, 0.8, 1.5]", desc: "1D array. e.g., one data sample with 3 features.",
      viz: <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>{[0.2, 0.8, 1.5].map((v, i) => <div key={i} style={{ background: C.accent2, width: 44, height: 44, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#000" }}>{v}</div>)}</div> },
    { r: 2, name: "Matrix", shape: "(2, 3)", example: "[[1,2,3],[4,5,6]]", desc: "2D array. e.g., dataset with 2 samples × 3 features.",
      viz: <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>{[[1,2,3],[4,5,6]].map((row, i) => <div key={i} style={{ display: "flex", gap: 5 }}>{row.map((v, j) => <div key={j} style={{ background: C.accent3, width: 38, height: 38, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{v}</div>)}</div>)}</div> },
    { r: 3, name: "3D Tensor", shape: "(2, 3, 3)", example: "Image: (H, W, C)", desc: "3D array. e.g., image with height × width × color channels.",
      viz: <div style={{ position: "relative", width: 110, height: 90, margin: "0 auto" }}>{[C.red, C.green, C.accent2].map((c, k) => <div key={k} style={{ position: "absolute", left: k * 10, top: k * 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, background: c + "44", padding: 5, borderRadius: 5, border: `1px solid ${c}77` }}>{Array(9).fill(0).map((_, vi) => <div key={vi} style={{ width: 14, height: 14, background: c + "bb", borderRadius: 2 }} />)}</div>)}</div> },
  ];
  const cur = ranks[rank];
  const gridStyle = isMobile ? { display: "flex", flexDirection: "column", gap: 14 } : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
  return (
    <div>
      <SectionTitle>Tensors & Tensor Rank</SectionTitle>
      <Para>A <strong style={{ color: C.accent2 }}>tensor</strong> is the fundamental data structure in ML frameworks. The <strong>rank</strong> is the number of dimensions. Click a rank to explore.</Para>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {ranks.map(r => (
          <button key={r.r} onClick={() => setRank(r.r)} style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: rank === r.r ? C.accent2 : C.border, color: rank === r.r ? "#000" : C.subtle }}>
            Rank {r.r}
          </button>
        ))}
      </div>
      <div style={gridStyle}>
        <Card>
          <div style={{ color: C.accent2, fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{cur.name}</div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>Shape: <code style={{ color: C.accent }}>{cur.shape}</code></div>
          <div style={{ padding: "9px 12px", background: "#0d1117", borderRadius: 7, fontFamily: "monospace", color: C.green, fontSize: 12 }}>{cur.example}</div>
          <div style={{ color: C.subtle, fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>{cur.desc}</div>
        </Card>
        <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
          {cur.viz}
        </Card>
      </div>
      <Callout emoji="🔢" title="TensorFlow / NumPy" color={C.accent2}>Shape like <code>[32, 224, 224, 3]</code> = 32 images, each 224×224 pixels with 3 RGB channels. This is how batches of images are stored!</Callout>
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent2)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonMatMul({ onComplete, done, isMobile, isTablet }) {
  const [step, setStep] = useState(-1);
  const A = [[1, 2], [3, 4]], B = [[5, 6], [7, 8]];
  const Cmat = [[1*5+2*7, 1*6+2*8], [3*5+4*7, 3*6+4*8]];
  const steps = [{ row: 0, col: 0, calc: "1×5 + 2×7 = 19" }, { row: 0, col: 1, calc: "1×6 + 2×8 = 22" }, { row: 1, col: 0, calc: "3×5 + 4×7 = 43" }, { row: 1, col: 1, calc: "3×6 + 4×8 = 50" }];
  const cur = step >= 0 ? steps[step] : null;
  const MatCell = ({ val, highlight, bg }) => (
    <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontWeight: 700, fontSize: isMobile ? 12 : 14, borderRadius: 7, background: highlight ? bg : C.border, color: highlight ? "#000" : C.text, border: `2px solid ${highlight ? bg : C.border}`, transition: "all 0.25s" }}>{val}</div>
  );
  const renderMat = (mat, name, color, hRow, hCol) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ color, fontSize: 11, marginBottom: 5, fontWeight: 700, letterSpacing: 1 }}>{name}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {mat.map((row, ri) => <div key={ri} style={{ display: "flex", gap: 4 }}>{row.map((val, ci) => <MatCell key={ci} val={val} highlight={hRow === ri || hCol === ci} bg={color} />)}</div>)}
      </div>
    </div>
  );
  return (
    <div>
      <SectionTitle>Matrix Multiplication</SectionTitle>
      <Para>Each element <code style={{ color: C.green }}>C[i][j]</code> = dot product of row i of A and column j of B. Requires <strong>inner dimensions match</strong>: A is (m×n), B is (n×p) → C is (m×p).</Para>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 10 : 20, flexWrap: "wrap", padding: "10px 0" }}>
          {renderMat(A, "Matrix A", C.accent, cur?.row, null)}
          <div style={{ fontSize: isMobile ? 20 : 26, color: C.muted }}>×</div>
          {renderMat(B, "Matrix B", C.accent2, null, cur?.col)}
          <div style={{ fontSize: isMobile ? 20 : 26, color: C.muted }}>=</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: C.green, fontSize: 11, marginBottom: 5, fontWeight: 700, letterSpacing: 1 }}>Result C</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {Cmat.map((row, ri) => <div key={ri} style={{ display: "flex", gap: 4 }}>{row.map((val, ci) => { const revealed = step >= 0 && steps.slice(0, step+1).some(s => s.row===ri&&s.col===ci); return <MatCell key={ci} val={revealed ? val : "?"} highlight={cur?.row===ri&&cur?.col===ci} bg={C.green} />; })}</div>)}
            </div>
          </div>
        </div>
        {cur && <div style={{ marginTop: 16, textAlign: "center", padding: "10px 18px", background: "#0d1117", borderRadius: 8, fontFamily: "monospace", color: C.green, fontSize: isMobile ? 12 : 14 }}>C[{cur.row}][{cur.col}] = {cur.calc}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
          <button onClick={() => setStep(Math.max(-1, step-1))} style={btnStyle(C.muted, "small")} disabled={step<0}>← Back</button>
          <button onClick={() => setStep(Math.min(steps.length-1, step+1))} style={btnStyle(C.accent2, "small")} disabled={step>=steps.length-1}>Next Step →</button>
          <button onClick={() => setStep(-1)} style={btnStyle(C.border, "small")}>Reset</button>
        </div>
      </Card>
      <Callout emoji="🧠" title="Why it matters" color={C.accent2}>Every neural network layer is a matrix multiply: <code>output = W @ input + b</code>. GPUs are so fast at ML because they excel at matrix multiplication!</Callout>
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent2)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonMeanMedian({ onComplete, done, isMobile, isTablet }) {
  const [outlier, setOutlier] = useState(false);
  const base = [4,7,13,16,21,9,3,18,5,11];
  const nums = outlier ? [...base, 200] : base;
  const mean = nums.reduce((a,b)=>a+b,0)/nums.length;
  const sorted = [...nums].sort((a,b)=>a-b);
  const median = sorted.length%2===0 ? (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2 : sorted[Math.floor(sorted.length/2)];
  const barData = sorted.map((v,i)=>({v,i}));
  const gridStyle = isMobile ? { display: "flex", flexDirection: "column", gap: 14 } : { display: "grid", gridTemplateColumns: "180px 1fr", gap: 16 };
  return (
    <div>
      <SectionTitle>Mean, Median & Outliers</SectionTitle>
      <Para>The <strong style={{ color: C.accent }}>mean</strong> = sum / count. The <strong style={{ color: C.accent2 }}>median</strong> = middle value (sorted). <strong style={{ color: C.red }}>Outliers</strong> distort the mean dramatically but barely affect the median. This is critical for data quality in ML.</Para>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => setOutlier(false)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: !outlier ? C.accent : C.border, color: !outlier ? "#000" : C.subtle, fontWeight: 700, fontSize: 12 }}>Normal data</button>
        <button onClick={() => setOutlier(true)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: outlier ? C.red : C.border, color: outlier ? "#fff" : C.subtle, fontWeight: 700, fontSize: 12 }}>Add outlier (200) ⚠</button>
      </div>
      <div style={gridStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[["Mean", mean.toFixed(2), C.accent], ["Median", median.toFixed(2), C.accent2]].map(([lbl, val, color]) => (
            <div key={lbl} style={{ background: C.card, borderRadius: 10, padding: "14px", border: `1px solid ${color}55`, textAlign: "center" }}>
              <div style={{ color, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{lbl}</div>
              <div style={{ color, fontSize: 30, fontWeight: 900, fontFamily: "monospace" }}>{val}</div>
            </div>
          ))}
          {outlier && <div style={{ background: C.red + "15", border: `1px solid ${C.red}44`, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: C.red }}>⚠ Outlier shifted mean by {(mean - base.reduce((a,b)=>a+b,0)/base.length).toFixed(1)} points!</div>}
        </div>
        <Card style={{ padding: 12 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="i" stroke={C.muted} tick={false} />
              <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, fontSize: 11 }} formatter={v=>[v,"value"]} labelFormatter={l=>`Item ${Number(l)+1}`} />
              <ReferenceLine y={mean} stroke={C.accent} strokeDasharray="4 2" strokeWidth={2} label={{ value: "mean", fill: C.accent, fontSize: 10 }} />
              <ReferenceLine y={median} stroke={C.accent2} strokeDasharray="4 2" strokeWidth={2} label={{ value: "median", fill: C.accent2, fontSize: 10 }} />
              <Bar dataKey="v" radius={[4,4,0,0]}>{barData.map((d,i)=><Cell key={i} fill={d.v>100?C.red:C.accent3}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {!done ? <button onClick={onComplete} style={btnStyle(C.green)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonStdDev({ onComplete, done, isMobile, isTablet }) {
  const [spread, setSpread] = useState(3);
  const mean = 50;
  const data = Array.from({ length: 80 }, (_, i) => {
    const x = 20 + i * 0.75;
    return { x: +x.toFixed(1), y: +((1/(spread*Math.sqrt(2*Math.PI)))*Math.exp(-0.5*((x-mean)/spread)**2)*100).toFixed(4) };
  });
  const gridStyle = isMobile ? { display: "flex", flexDirection: "column", gap: 16 } : { display: "grid", gridTemplateColumns: "190px 1fr", gap: 16, marginTop: 14 };
  return (
    <div>
      <SectionTitle>Standard Deviation</SectionTitle>
      <Para>Standard deviation <strong style={{ color: C.green }}>σ</strong> = average distance from the mean. <code style={{ color: C.green }}>σ = √(Σ(xᵢ−μ)²/n)</code>. Small σ → data clusters tightly. Large σ → data spreads wide. Critical for <strong>feature normalization</strong> in ML.</Para>
      <div style={gridStyle}>
        <Card>
          <SubTitle>Adjust Spread</SubTitle>
          <SliderInput label="σ (std deviation)" min={1} max={10} step={0.5} value={spread} onChange={setSpread} color={C.green} />
          <div style={{ marginTop: 12 }}>
            {[["±1σ", "~68%", C.accent], ["±2σ", "~95%", C.accent2], ["±3σ", "~99.7%", C.accent3]].map(([r,p,c]) => (
              <div key={r} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ fontFamily: "monospace", color: c }}>{r}</span>
                <span style={{ color: C.subtle }}>{p} of data</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "8px 10px", background: "#0d1117", borderRadius: 6, fontFamily: "monospace", fontSize: 12 }}>
            <div style={{ color: C.accent2 }}>μ = {mean}</div>
            <div style={{ color: C.green }}>σ = {spread}</div>
          </div>
        </Card>
        <Card style={{ padding: 12 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 240}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="x" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} />
              <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, fontSize: 11 }} />
              <ReferenceLine x={mean} stroke={C.accent2} strokeDasharray="3 3" label={{ value: "μ", fill: C.accent2, fontSize: 11 }} />
              <ReferenceLine x={mean-spread} stroke={C.accent} strokeDasharray="2 2" label={{ value: "-σ", fill: C.accent, fontSize: 10 }} />
              <ReferenceLine x={mean+spread} stroke={C.accent} strokeDasharray="2 2" label={{ value: "+σ", fill: C.accent, fontSize: 10 }} />
              <Line type="monotone" dataKey="y" stroke={C.green} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Callout emoji="📊" title="Z-score normalization" color={C.green}>ML models train better when features are normalized: <code>z = (x − μ) / σ</code>. This transforms data to have mean=0, std=1 — equalizing scales across features.</Callout>
      {!done ? <button onClick={onComplete} style={btnStyle(C.green)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonHistogram({ onComplete, done, isMobile, isTablet }) {
  const [numBins, setNumBins] = useState(10);
  const rawData = [3,7,7,8,9,10,11,11,12,12,13,14,14,15,15,15,16,16,17,18,18,19,20,20,21,22,23,24,25,27,28,30,32,34,35,38,40,45,50,55];
  const min = Math.min(...rawData), max = Math.max(...rawData);
  const binSize = (max-min)/numBins;
  const bins = Array.from({ length: numBins }, (_, i) => {
    const lo = min+i*binSize, hi = lo+binSize;
    return { range: `${lo.toFixed(0)}–${hi.toFixed(0)}`, count: rawData.filter(v=>v>=lo&&v<hi+(i===numBins-1?1:0)).length };
  });
  return (
    <div>
      <SectionTitle>Reading Histograms</SectionTitle>
      <Para>Histograms show how values are <strong style={{ color: C.green }}>distributed</strong> across ranges (bins). Taller bar = more values there. In ML, histograms reveal skew, outliers, and whether normalization is needed. Try adjusting bin count.</Para>
      <Card>
        <SliderInput label={`Bins: ${numBins}`} min={4} max={20} step={1} value={numBins} onChange={setNumBins} color={C.green} />
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 230}>
          <BarChart data={bins} barCategoryGap="5%">
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="range" stroke={C.muted} tick={{ fill: C.muted, fontSize: 9 }} />
            <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} label={{ value: "Freq", angle: -90, fill: C.muted, fontSize: 10, position: "insideLeft" }} />
            <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, fontSize: 11 }} />
            <Bar dataKey="count" radius={[4,4,0,0]}>
              {bins.map((_,i) => <Cell key={i} fill={`hsl(${140+i*(180/numBins)}, 70%, 55%)`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 10, marginTop: 12 }}>
        {[["Right-skewed ↗", "Long tail right — most values are low"], ["Fewer bins ◫", "Loses detail, hides structure"], ["More bins ▦", "Reveals finer patterns, can be noisy"]].map(([t,d]) => (
          <div key={t} style={{ background: C.card, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}`, fontSize: 12 }}>
            <div style={{ color: C.accent, fontWeight: 700, marginBottom: 4 }}>{t}</div>
            <div style={{ color: C.muted, fontSize: 11 }}>{d}</div>
          </div>
        ))}
      </div>
      {!done ? <button onClick={onComplete} style={btnStyle(C.green)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonDerivatives({ onComplete, done, isMobile, isTablet }) {
  const [x0, setX0] = useState(1.5);
  const fn = x => x*x;
  const slope = deriv(fn, x0);
  const data = Array.from({ length: 60 }, (_, i) => { const x = -3+i*0.1; return { x: +x.toFixed(2), y: +fn(x).toFixed(3), tangent: +(fn(x0)+slope*(x-x0)).toFixed(3) }; });
  const gridStyle = isMobile ? { display: "flex", flexDirection: "column", gap: 16 } : { display: "grid", gridTemplateColumns: "190px 1fr", gap: 16, marginTop: 14 };
  return (
    <div>
      <SectionTitle>Derivatives & Slopes</SectionTitle>
      <Para>The <strong style={{ color: C.accent3 }}>derivative</strong> f'(x) = instantaneous slope at x. Visually: the slope of the tangent line. You don't compute them by hand in ML — but you must understand what they <em>mean</em>: direction and speed of change.</Para>
      <div style={gridStyle}>
        <Card>
          <SubTitle>Move the point on f(x)=x²</SubTitle>
          <SliderInput label="x₀" min={-2.5} max={2.5} value={x0} onChange={setX0} color={C.accent3} />
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <div style={{ color: C.green, fontFamily: "monospace", fontSize: 12 }}>f({x0.toFixed(2)}) = {fn(x0).toFixed(3)}</div>
            <div style={{ color: C.accent3, fontFamily: "monospace", fontSize: 12, marginTop: 4 }}>f'({x0.toFixed(2)}) = {slope.toFixed(3)}</div>
            <div style={{ marginTop: 10, padding: "8px", background: "#0d1117", borderRadius: 6, fontSize: 12, color: slope > 0.1 ? C.red : slope < -0.1 ? C.accent2 : C.green }}>
              {slope > 0.1 ? "⬆ Increasing" : slope < -0.1 ? "⬇ Decreasing" : "➡ Near minimum"}
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
            f'(x) {">"} 0 → increasing<br />f'(x) {"<"} 0 → decreasing<br />f'(x) = 0 → local min/max
          </div>
        </Card>
        <Card style={{ padding: 12 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="x" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} />
              <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} domain={[-1, 9]} />
              <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, fontSize: 11 }} />
              <ReferenceLine x={x0} stroke={C.accent3} strokeDasharray="3 2" />
              <Line type="monotone" dataKey="y" stroke={C.accent} strokeWidth={2.5} dot={false} name="f(x)=x²" />
              <Line type="monotone" dataKey="tangent" stroke={C.accent3} strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="tangent" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent3)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonGradient({ onComplete, done, isMobile, isTablet }) {
  const gridStyle = isMobile ? { display: "flex", flexDirection: "column", gap: 14 } : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14 };
  return (
    <div>
      <SectionTitle>Gradients</SectionTitle>
      <Para>The <strong style={{ color: C.accent3 }}>gradient</strong> generalizes the derivative to multiple variables. It's a vector <code style={{ color: C.green }}>∇f = [∂f/∂x₁, ∂f/∂x₂, ...]</code> that points in the direction of <em>steepest increase</em>.</Para>
      <div style={gridStyle}>
        {[
          { title: "Partial Derivative ∂f/∂x", desc: "Change in f when only x varies (y held constant)", code: "f(x,y) = x² + y²\n∂f/∂x = 2x   ← treat y as constant\n∂f/∂y = 2y   ← treat x as constant", color: C.accent3 },
          { title: "Gradient Vector ∇f", desc: "Combines all partials into one direction vector", code: "∇f(x,y) = [∂f/∂x, ∂f/∂y]\n         = [2x,  2y]\n\nAt point (1, 2):\n∇f = [2, 4]  ← direction uphill", color: C.accent },
        ].map(({ title, desc, code, color }) => (
          <Card key={title}>
            <div style={{ color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{title}</div>
            <div style={{ color: C.subtle, fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>{desc}</div>
            <pre style={{ background: "#0d1117", borderRadius: 7, padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: C.green, lineHeight: 1.8, margin: 0 }}>{code}</pre>
          </Card>
        ))}
      </div>
      <Card style={{ marginTop: 16 }}>
        <SubTitle>Gradient on a loss surface (f = x² + y²)</SubTitle>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 20, justifyContent: "center", flexWrap: "wrap" }}>
          <svg width={isMobile ? 160 : 200} height={isMobile ? 136 : 170} style={{ overflow: "visible" }}>
            {[20,40,60,80].map((r,i) => <ellipse key={r} cx={isMobile ? "80" : "100"} cy={isMobile ? "68" : "85"} rx={r} ry={r*0.65} fill="none" stroke={C.accent3} strokeOpacity={0.15+i*0.1} strokeWidth={1.5} />)}
            {[[1,-1],[2,1],[-1,2],[-2,-1],[0.5,2],[-1.5,-0.5]].map(([dx,dy],i) => {
              const sx=isMobile ? 80+dx*17.6 : 100+dx*22, sy=isMobile ? 68-dy*17.6 : 85-dy*22, gx=dx*2, gy=dy*2, n=Math.sqrt(gx*gx+gy*gy);
              const ex=sx+(gx/n)*(isMobile ? 14.4 : 18), ey=sy-(gy/n)*(isMobile ? 14.4 : 18);
              return <g key={i}><line x1={sx} y1={sy} x2={ex} y2={ey} stroke={C.accent} strokeWidth={1.5}/><circle cx={sx} cy={sy} r={3.5} fill={C.accent2}/></g>;
            })}
            <circle cx={isMobile ? "80" : "100"} cy={isMobile ? "68" : "85"} r="6" fill={C.green}/><text x={isMobile ? "87" : "107"} y={isMobile ? "63" : "80"} fill={C.green} fontSize="10" fontWeight="700">min</text>
          </svg>
          <div style={{ maxWidth: 220 }}>
            <Callout emoji="⬇️" title="Gradient Descent rule" color={C.accent3}>Move <strong>opposite</strong> the gradient to go downhill: <code>θ ← θ − α · ∇L(θ)</code><br/><br/>Arrows show gradient (uphill). We step the <em>other</em> direction.</Callout>
          </div>
        </div>
      </Card>
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent3)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonGradientDescent({ onComplete, done, isMobile, isTablet }) {
  const [lr, setLr] = useState(0.15);
  const [steps, setSteps] = useState([]);
  const fn = x => x*x - 4*x + 6;
  const gradFn = x => 2*x - 4;
  const curveData = Array.from({ length: 100 }, (_, i) => { const x=-2+i*0.1; return { x: +x.toFixed(2), y: +fn(x).toFixed(3) }; });
  const runDescent = useCallback(() => {
    let x=-1.5, hist=[{ x, y: fn(x) }];
    for (let i=0; i<25; i++) { x=x-lr*gradFn(x); hist.push({ x: +x.toFixed(4), y: +fn(x).toFixed(4) }); if(Math.abs(gradFn(x))<0.001) break; }
    setSteps(hist);
  }, [lr]);
  const lrNote = lr>0.35 ? { msg: "⚠ Too large — may overshoot or diverge!", color: C.red } : lr<0.06 ? { msg: "🐢 Very small — slow convergence", color: C.accent } : { msg: "✓ Good learning rate", color: C.green };
  const gridStyle = isMobile ? { display: "flex", flexDirection: "column", gap: 16 } : { display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, marginTop: 14 };
  return (
    <div>
      <SectionTitle>Gradient Descent</SectionTitle>
      <Para><strong style={{ color: C.accent3 }}>Gradient descent</strong> is the optimization algorithm that trains ML models. It iteratively moves parameters in the direction of steepest loss decrease. The <strong>learning rate α</strong> controls how big each step is.</Para>
      <div style={gridStyle}>
        <Card>
          <SubTitle>Controls</SubTitle>
          <SliderInput label="Learning rate α" min={0.02} max={0.5} step={0.01} value={lr} onChange={v=>{setLr(v);setSteps([]);}} color={C.accent3} />
          <button onClick={runDescent} style={btnStyle(C.accent3, "full")}>▶ Run Descent</button>
          <button onClick={()=>setSteps([])} style={{ ...btnStyle(C.border, "full"), marginTop: 6 }}>Reset</button>
          {steps.length>0 && (
            <div style={{ marginTop: 12, fontSize: 12 }}>
              <div style={{ color: C.subtle }}>Steps: <span style={{ color: C.accent }}>{steps.length-1}</span></div>
              <div style={{ color: C.subtle }}>Final x: <span style={{ color: C.green }}>{steps[steps.length-1].x.toFixed(4)}</span></div>
              <div style={{ color: C.subtle }}>Loss: <span style={{ color: C.green }}>{steps[steps.length-1].y.toFixed(4)}</span></div>
              <div style={{ marginTop: 6, color: lrNote.color, fontSize: 11 }}>{lrNote.msg}</div>
            </div>
          )}
        </Card>
        <Card style={{ padding: 12 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 250}>
            <LineChart data={curveData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="x" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} label={{ value: "θ (parameter)", fill: C.muted, fontSize: 10 }} />
              <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} label={{ value: "Loss", angle: -90, fill: C.muted, fontSize: 10, position: "insideLeft" }} />
              <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, fontSize: 11 }} />
              <ReferenceLine x={2} stroke={C.green} strokeDasharray="3 2" label={{ value: "min", fill: C.green, fontSize: 10 }} />
              <Line type="monotone" dataKey="y" stroke={C.accent} strokeWidth={2.5} dot={false} name="loss" />
              {steps.map((s,i) => <ReferenceLine key={i} x={s.x} stroke={C.accent3} strokeOpacity={Math.min(0.3+i*0.035,0.9)} strokeWidth={1.5}/>)}
              {steps.length>0 && <ReferenceLine x={steps[steps.length-1].x} stroke={C.green} strokeWidth={2.5}/>}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent3)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonChainRule({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>Chain Rule</SectionTitle>
      <Para>The <strong style={{ color: C.accent3 }}>chain rule</strong>: if y = f(g(x)), then <code style={{ color: C.green }}>dy/dx = f'(g(x)) · g'(x)</code>. It lets us differentiate composite functions — which is exactly what a multi-layer neural network is!</Para>
      <Card style={{ marginTop: 14 }}>
        <SubTitle>Backpropagation = Chain Rule Applied</SubTitle>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, overflowX: "auto", padding: "10px 0", flexWrap: isMobile ? "wrap" : "nowrap" }}>
          {[{ l: "Input\nx", c: C.accent2 }, { l: "Layer 1\ng(x)", c: C.accent3 }, { l: "Layer 2\nf(g(x))", c: C.accent }, { l: "Loss\nL", c: C.red }].map((n,i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ background: n.c+"22", border: `2px solid ${n.c}`, borderRadius: 10, padding: "10px 15px", textAlign: "center", minWidth: 76 }}>
                <div style={{ color: n.c, fontFamily: "monospace", fontSize: 11, fontWeight: 700, whiteSpace: "pre" }}>{n.l}</div>
              </div>
              {i<3 && <div style={{ width: 44, height: 2, background: C.muted, position: "relative" }}><div style={{ position: "absolute", right: -1, top: -4, fontSize: 9, color: C.muted }}>▶</div></div>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: "14px 18px", background: "#0d1117", borderRadius: 9, fontFamily: "monospace", fontSize: isMobile ? 12 : 13, lineHeight: 2, overflowX: "auto" }}>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>Backpropagation (chain rule):</div>
          <div><span style={{ color: C.green }}>∂L/∂x</span> = <span style={{ color: C.red }}>∂L/∂f</span> × <span style={{ color: C.accent }}>∂f/∂g</span> × <span style={{ color: C.accent3 }}>∂g/∂x</span></div>
        </div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>Each layer multiplies its local gradient. This "propagates" error backwards through the entire network efficiently — letting us update millions of parameters in one pass.</div>
      </Card>
      <Callout emoji="🔁" title="Why it's powerful" color={C.accent3}>Without the chain rule, we couldn't train deep networks. It makes gradient computation O(n) instead of O(n²) — enabling GPT-4 scale models.</Callout>
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent3)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonDataTypes({ onComplete, done, isMobile, isTablet }) {
  const types = [{ t: "int", eg: "42, -7, 0", desc: "Whole numbers. e.g., epoch count, class labels", color: C.accent }, { t: "float", eg: "3.14, -0.001", desc: "Decimals. e.g., weights, learning rates, probabilities", color: C.accent2 }, { t: "str", eg: '"hello", "relu"', desc: 'Text. e.g., model name, file path, activation type', color: C.green }, { t: "bool", eg: "True, False", desc: "Binary. e.g., is_training, use_dropout", color: C.accent3 }];
  return (
    <div>
      <SectionTitle>Data Types & Variables</SectionTitle>
      <Para>Python is <strong style={{ color: "#fb923c" }}>dynamically typed</strong> — you don't declare types, Python infers them. ML code works primarily with floats and ints. Variable names should be descriptive.</Para>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginTop: 14 }}>
        {types.map(({ t, eg, desc, color }) => (
          <div key={t} style={{ background: C.card, borderRadius: 9, padding: "12px 14px", border: `1px solid ${color}33` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <code style={{ color, fontWeight: 700, fontSize: 14 }}>{t}</code>
              <code style={{ color: C.muted, fontSize: 11 }}>{eg}</code>
            </div>
            <div style={{ color: C.muted, fontSize: 11 }}>{desc}</div>
          </div>
        ))}
      </div>
      <CodeBlock code={`# ML variable declarations
learning_rate = 0.001          # float — model hyperparameter
epochs = 100                   # int   — number of training rounds
model_name = "LinearRegressor" # str   — for logging
is_training = True             # bool  — controls dropout

# Type checking and conversion
print(type(learning_rate))     # <class 'float'>
x = int("42")                  # str → int: 42
y = float(epochs)              # int → float: 100.0
label = str(1)                 # int → str: "1"

# Multiple assignment
w1, w2, b = 0.5, -0.3, 0.1`} />
      {!done ? <button onClick={onComplete} style={btnStyle("#fb923c")}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonFunctions({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>Functions</SectionTitle>
      <Para>Functions package reusable logic. In ML, nearly everything is a function. Understand <strong style={{ color: "#fb923c" }}>positional</strong> args (order matters) and <strong style={{ color: C.accent2 }}>keyword</strong> args (name=value, order flexible).</Para>
      <CodeBlock code={`# Define a function
def linear(x, w=1.0, b=0.0):
    """Linear transformation: y = wx + b"""
    return w * x + b

# Positional arguments (order matters)
result = linear(5, 2.0, -1.0)     # x=5, w=2.0, b=-1.0

# Keyword arguments (order doesn't matter)
result = linear(5, b=-1.0, w=2.0) # same result!

# Default values used when not passed
result = linear(5)                 # w=1.0, b=0.0 → 5.0

# Functions returning multiple values
def train_epoch(model, data):
    loss = compute_loss(model, data)
    accuracy = compute_acc(model, data)
    return loss, accuracy           # returns a tuple

loss, acc = train_epoch(model, data)

# Lambda (anonymous) functions
square = lambda x: x ** 2
apply = lambda f, vals: [f(v) for v in vals]
squared = apply(square, [1, 2, 3, 4])  # [1, 4, 9, 16]`} />
      <Callout emoji="🐍" title="Common ML pattern" color="#fb923c">Keras uses keyword args everywhere: <code>model.compile(optimizer='adam', loss='mse', metrics=['accuracy'])</code> — exactly keyword argument syntax!</Callout>
      {!done ? <button onClick={onComplete} style={btnStyle("#fb923c")}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonDataStructures({ onComplete, done, isMobile, isTablet }) {
  const [active, setActive] = useState("list");
  const content = {
    list: `# Lists — ordered, mutable sequences
features = [1.2, 3.4, 5.6, 7.8]

# Access by index
first = features[0]         # 1.2
last  = features[-1]        # 7.8
slice = features[1:3]       # [3.4, 5.6]

# Modify
features.append(9.0)        # add to end
features[0] = 0.5           # update element

# List comprehension (very common in ML!)
squared = [x**2 for x in features]
filtered = [x for x in features if x > 3.0]
# filtered = [3.4, 5.6, 7.8, 9.0]`,
    dict: `# Dicts — key → value mapping
config = {
    "learning_rate": 0.001,
    "epochs": 100,
    "batch_size": 32,
    "optimizer": "adam"
}

# Access
lr = config["learning_rate"]          # 0.001
opt = config.get("optimizer", "sgd")  # "adam"

# Add / update
config["dropout"] = 0.5

# Iterate over key-value pairs
for key, value in config.items():
    print(f"{key}: {value}")

# Dict comprehension
doubled = {k: v*2 for k, v in config.items()
           if isinstance(v, (int, float))}`,
    set: `# Sets — unique values, unordered
categories = {"cat", "dog", "bird", "cat"}
print(categories)  # {"cat", "dog", "bird"} no duplicates!

# Set operations (useful for data splits!)
train_ids = {1, 2, 3, 4, 5}
test_ids  = {4, 5, 6, 7, 8}

overlap    = train_ids & test_ids     # {4, 5} intersection
all_ids    = train_ids | test_ids     # {1,2,3,4,5,6,7,8} union
train_only = train_ids - test_ids     # {1, 2, 3} difference

# Build vocabulary set
words = ["the","cat","sat","the","mat","cat"]
vocab = set(words)  # {"the", "cat", "sat", "mat"}
print(len(vocab))   # 4 unique words`,
  };
  return (
    <div>
      <SectionTitle>Lists, Dicts & Sets</SectionTitle>
      <Para>These three structures are the backbone of Python ML code. Lists hold ordered data, dicts map keys to values, sets store unique items.</Para>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["list","📋 List"],["dict","📖 Dict"],["set","🔗 Set"]].map(([t,l]) => (
          <button key={t} onClick={()=>setActive(t)} style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: active===t ? "#fb923c" : C.border, color: active===t ? "#000" : C.subtle }}>{l}</button>
        ))}
      </div>
      <CodeBlock code={content[active]} />
      {!done ? <button onClick={onComplete} style={btnStyle("#fb923c")}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonControlFlow({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>Loops & Conditionals</SectionTitle>
      <Para>Control flow structures direct program execution. Loops process entire datasets; conditionals branch on conditions. List comprehensions are a Pythonic shortcut heavily used in ML.</Para>
      <CodeBlock code={`# for loop — fundamental in ML training
for epoch in range(100):
    loss = train_one_epoch(model, data)
    print(f"Epoch {epoch}: loss={loss:.4f}")

# enumerate — get index + value
losses = [2.5, 1.8, 1.2, 0.9, 0.7]
for epoch, loss in enumerate(losses):
    print(f"Epoch {epoch}: {loss}")

# Multiple iterator variables (tuple unpacking)
pairs = [("w1", 0.5), ("w2", -0.3), ("b", 0.1)]
for name, value in pairs:
    print(f"  {name} = {value}")

# while — train until convergence
loss = 10.0
while loss > 0.01:
    loss = train_step(model)   # simulate

# if / elif / else
def interpret_loss(loss):
    if loss > 5.0:
        return "Very high — check data/model"
    elif loss > 1.0:
        return "High — still improving"
    elif loss > 0.1:
        return "Good — nearly converged"
    else:
        return "Excellent!"

# Conditional expression (ternary)
prediction = "spam" if score > 0.5 else "ham"

# List comprehension (elegant + fast!)
normalized = [x / 255.0 for x in pixel_values]
valid      = [x for x in data if x is not None]`} />
      {!done ? <button onClick={onComplete} style={btnStyle("#fb923c")}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

// ─── TRIGONOMETRY ──────────────────────────────────────────────────────────

function LessonTanh({ onComplete, done, isMobile, isTablet }) {
  const data = Array.from({ length: 101 }, (_, i) => { const x = -5 + i * 0.1; return { x: +x.toFixed(2), tanh: +Math.tanh(x).toFixed(4), sigmoid: +(1/(1+Math.exp(-x))).toFixed(4), relu: +Math.max(0, x).toFixed(4) }; });
  return (
    <div>
      <SectionTitle>tanh Activation Function</SectionTitle>
      <Para>The <strong style={{ color: C.accent3 }}>hyperbolic tangent (tanh)</strong> is similar to sigmoid but outputs values between -1 and 1: <code style={{ color: C.green }}>tanh(z) = (eᶻ - e⁻ᶻ) / (eᶻ + e⁻ᶻ)</code>. It's often preferred to sigmoid in hidden layers because it's centered at zero, which helps networks train faster.</Para>
      
      <Card style={{ padding: 12, marginTop: 14 }}>
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="x" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} />
            <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} domain={[-1.5, 1.5]} />
            <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, fontSize: 11 }} />
            <ReferenceLine y={0} stroke={C.muted} strokeDasharray="2 2" />
            <ReferenceLine y={1} stroke={C.muted} strokeDasharray="2 2" />
            <ReferenceLine y={-1} stroke={C.muted} strokeDasharray="2 2" />
            <Line type="monotone" dataKey="tanh" stroke={C.accent3} strokeWidth={2.5} dot={false} name="tanh(z)" />
            <Line type="monotone" dataKey="sigmoid" stroke={C.accent} strokeWidth={2} dot={false} name="σ(z)" />
            <Line type="monotone" dataKey="relu" stroke={C.accent2} strokeWidth={2} dot={false} name="ReLU(z)" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, marginTop: 6, justifyContent: "center", fontSize: 11, flexWrap: "wrap" }}>
          {[["tanh(z)", C.accent3], ["σ(z)", C.accent], ["ReLU(z)", C.accent2]].map(([l, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 3, background: c }} /><span style={{ color: C.subtle }}>{l}</span></div>
          ))}
        </div>
      </Card>
      
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 14 }}>
        {[["tanh properties", ["Range: [-1, 1]", "Output: centered at 0", "Better for hidden layers", "Steeper derivatives near 0"]], ["When to use", ["Hidden layers in deep networks", "When you want negative outputs", "When data is symmetric", "RNNs and LSTMs prefer tanh"]]].map(([title, items]) => (
          <div key={title} style={{ background: C.card, borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
            <div style={{ color: C.accent3, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{title}</div>
            {items.map((item, i) => <div key={i} style={{ fontSize: 12, color: C.subtle, marginBottom: i < items.length - 1 ? 6 : 0 }}>• {item}</div>)}
          </div>
        ))}
      </div>
      
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent3)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonPartialDeriv({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>Partial Derivatives</SectionTitle>
      <Para>A <strong style={{ color: C.accent3 }}>partial derivative</strong> is the derivative with respect to one variable, holding all other variables constant. Written as <code style={{ color: C.green }}>∂f/∂x</code> (not d, but ∂). Partial derivatives are the building blocks of gradients.</Para>
      
      <CodeBlock code={`# Example: Loss function with multiple parameters
L(w, b, x) = (predicted - actual)²

where:
  predicted = w·x + b
  actual = y (true label)

Partial derivatives:
  ∂L/∂w = 2(predicted - actual) · x
  ∂L/∂b = 2(predicted - actual)
  ∂L/∂x = 2(predicted - actual) · w

Notice: ∂L/∂w depends on x, ∂L/∂b doesn't depend on w or x`} />
      
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginTop: 14 }}>
        <Card>
          <div style={{ color: C.accent3, fontSize: 16, fontWeight: 900, marginBottom: 10 }}>Interpretation</div>
          <ul style={{ color: C.subtle, fontSize: 12, lineHeight: 2, margin: 0, paddingLeft: 20 }}>
            <li><strong style={{ color: C.accent }}>∂f/∂x</strong> = how much f changes when only x changes</li>
            <li><strong style={{ color: C.accent2 }}>∂f/∂y</strong> = how much f changes when only y changes</li>
            <li>Compute all partials → you have the <strong>gradient</strong></li>
            <li>Gradient points in direction of steepest increase</li>
          </ul>
        </Card>
        <Card>
          <div style={{ color: C.accent2, fontSize: 16, fontWeight: 900, marginBottom: 10 }}>ML Connection</div>
          <ul style={{ color: C.subtle, fontSize: 12, lineHeight: 2, margin: 0, paddingLeft: 20 }}>
            <li>Update rule: <code style={{ color: C.green }}>w ← w − α·∂L/∂w</code></li>
            <li>Each parameter gets its own gradient</li>
            <li><strong>Backprop</strong> computes all partials efficiently via chain rule</li>
            <li>For neural nets: gradient for each weight computed backward</li>
          </ul>
        </Card>
      </div>
      
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent3)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

// ─── ADVANCED PYTHON ──────────────────────────────────────────────────────

function LessonStringFormat({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>String Formatting</SectionTitle>
      <Para>String formatting lets you embed variables in text. In ML, you'll use it for logging metrics, saving filenames, and displaying results. Python has several methods — we show the most common ones.</Para>
      
      <CodeBlock code={`# Method 1: % operator (old-style, but still used)
loss = 0.3456
epoch = 45
print("Epoch %d: loss = %.4f" % (epoch, loss))
# Output: Epoch 45: loss = 0.3456

# Method 2: .format() (more flexible)
model_name = "LinearRegressor"
accuracy = 0.9234
print("Model: {}, Accuracy: {:.2%}".format(model_name, accuracy))
# Output: Model: LinearRegressor, Accuracy: 92.34%

# Method 3: f-strings (Python 3.6+, PREFERRED!)
weight = 0.75
print(f"Weight updated: {weight:.3f}")
# Output: Weight updated: 0.750

# Common format specifiers
value = 3.14159
print(f"Integer: {int(value)}")           # 3
print(f"2 decimals: {value:.2f}")        # 3.14
print(f"4 decimals: {value:.4f}")        # 3.1416
print(f"Scientific: {value:.2e}")        # 3.14e+00
print(f"Percentage: {value/10:.1%}")     # 31.4%

# Practical ML example
metrics = {"loss": 0.245, "accuracy": 0.957, "epoch": 42}
print(f"Epoch {metrics['epoch']}: Loss={metrics['loss']:.4f}, Acc={metrics['accuracy']:.3f}")
# Output: Epoch 42: Loss=0.2450, Acc=0.957`} />
      
      <Callout emoji="💡" title="Pro tip" color={C.accent}>f-strings are the modern standard! They're faster, more readable, and recommended for new code. Old code uses % or .format().</Callout>
      
      {!done ? <button onClick={onComplete} style={btnStyle("#fb923c")}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonListComprehensions({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>List Comprehensions</SectionTitle>
      <Para>List comprehensions are a concise, Pythonic way to create lists. They're faster than loops and widely used in ML for data preprocessing. Syntax: <code style={{ color: C.green }}>[expression for item in iterable if condition]</code></Para>
      
      <CodeBlock code={`# Basic list comprehension
numbers = [1, 2, 3, 4, 5]
doubled = [x * 2 for x in numbers]
print(doubled)  # [2, 4, 6, 8, 10]

# With condition (filter)
evens = [x for x in numbers if x % 2 == 0]
print(evens)    # [2, 4]

# Transform + filter
filtered_squares = [x**2 for x in numbers if x > 2]
print(filtered_squares)  # [9, 16, 25]

# ─── ML EXAMPLES ───────────────────────────────

# Normalize pixel values (0-255) to (0-1)
pixels = [245, 128, 32, 200, 64]
normalized = [p / 255.0 for p in pixels]
# [0.961, 0.502, 0.125, 0.784, 0.251]

# Extract labels from list of tuples
data = [('cat', 0), ('dog', 1), ('cat', 0), ('dog', 1)]
labels = [label for label, _ in data]
# [0, 1, 0, 1]

# Apply function to each element
import math
distances = [2.3, 5.1, 1.8]
log_distances = [math.log(d) for d in distances]

# Nested comprehension (flatten 2D list)
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = [val for row in matrix for val in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Conditional per element
scores = [0.92, 0.45, 0.78, 0.35, 0.88]
pass_fail = ["PASS" if s >= 0.7 else "FAIL" for s in scores]
# ['PASS', 'FAIL', 'PASS', 'FAIL', 'PASS']`} />
      
      <Callout emoji="⚡" title="Performance" color={C.green}>List comprehensions are 2-10x faster than equivalent for loops! Use them for data preprocessing and transformations.</Callout>
      
      {!done ? <button onClick={onComplete} style={btnStyle("#fb923c")}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

// ─── NUMPY ──────────────────────────────────────────────────────────────────

function LessonNumpyArrays({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>NumPy Arrays</SectionTitle>
      <Para><strong style={{ color: C.accent2 }}>NumPy</strong> (Numerical Python) is the foundation of ML in Python. It provides efficient multi-dimensional arrays and fast matrix operations. NumPy arrays are 50-100x faster than Python lists for numerical operations.</Para>
      
      <CodeBlock code={`import numpy as np

# Creating arrays
a = np.array([1, 2, 3, 4, 5])              # 1D array
b = np.array([[1, 2, 3], [4, 5, 6]])      # 2D array (matrix)
c = np.array([[[1, 2], [3, 4]], [[5, 6], [7, 8]]])  # 3D array

# Check shape and type
print(a.shape)        # (5,)
print(b.shape)        # (2, 3)
print(c.shape)        # (2, 2, 2)
print(a.dtype)        # int64

# Creating special arrays
zeros = np.zeros((3, 3))        # 3x3 matrix of zeros
ones = np.ones((2, 4))          # 2x4 matrix of ones
identity = np.eye(3)            # 3x3 identity matrix
randoms = np.random.rand(100)   # 100 random values [0, 1)

# Ranges and sequences
range_arr = np.arange(0, 10, 2)         # [0, 2, 4, 6, 8]
linspace_arr = np.linspace(0, 1, 11)   # 11 evenly spaced from 0 to 1

# Type conversions
int_arr = np.array([1.5, 2.7, 3.2]).astype(int)  # [1, 2, 3]
float_arr = np.array([1, 2, 3]).astype(float)    # [1.0, 2.0, 3.0]`} />
      
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent2)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonNumpyOps({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>Array Operations</SectionTitle>
      <Para>NumPy operations are <strong>vectorized</strong> — they work on entire arrays without explicit loops. This is what makes NumPy fast and essential for ML.</Para>
      
      <CodeBlock code={`import numpy as np

# Element-wise arithmetic
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

print(a + b)      # [5, 7, 9]
print(a * b)      # [4, 10, 18]  (element-wise, NOT matrix mult!)
print(a / b)      # [0.25, 0.4, 0.5]
print(a ** 2)     # [1, 4, 9]

# Broadcasting: operate on different shapes automatically
a = np.array([1, 2, 3])
scalar = 10
print(a + scalar)         # [11, 12, 13]
print(a * 2)              # [2, 4, 6]

# Matrix multiplication (use @ or np.dot)
A = np.array([[1, 2], [3, 4]])       # 2x2
B = np.array([[5, 6], [7, 8]])       # 2x2
result = A @ B                        # Matrix product
# [[19, 22], [43, 50]]

# Common functions
print(np.sum([1, 2, 3, 4]))           # 10
print(np.mean([1, 2, 3, 4]))          # 2.5
print(np.std([1, 2, 3, 4]))           # 1.118...
print(np.max([1, 2, 3, 4]))           # 4
print(np.min([1, 2, 3, 4]))           # 1

# Apply functions element-wise
x = np.array([-1, 0, 1, 2])
print(np.abs(x))                      # [1, 0, 1, 2]
print(np.exp(x))                      # [0.368, 1, 2.718, 7.389]
print(np.log(np.array([1, 2, 10])))  # [0, 0.693, 2.303]

# Axis operations
matrix = np.array([[1, 2, 3], [4, 5, 6]])
print(matrix.sum())           # 21 (sum all)
print(matrix.sum(axis=0))     # [5, 7, 9] (sum columns)
print(matrix.sum(axis=1))     # [6, 15] (sum rows)
print(matrix.mean(axis=1))    # [2, 5] (mean per row)`} />
      
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent2)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonNumpyReshape({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>Reshaping & Broadcasting</SectionTitle>
      <Para><strong style={{ color: C.accent2 }}>Reshaping</strong> changes array dimensions without changing data. <strong style={{ color: C.accent }}>Broadcasting</strong> automatically expands smaller arrays to match larger ones. Both are crucial in ML.</Para>
      
      <CodeBlock code={`import numpy as np

# Reshape: change dimensions (same # of elements)
a = np.array([1, 2, 3, 4, 5, 6])
b = a.reshape(2, 3)       # 1D→2D: (6,) → (2, 3)
# [[1, 2, 3],
#  [4, 5, 6]]

c = a.reshape(3, 2)       # (6,) → (3, 2)
# [[1, 2],
#  [3, 4],
#  [5, 6]]

d = a.reshape(2, 3, 1)    # (6,) → (2, 3, 1) [3D]

# Flatten: convert any shape to 1D
matrix = np.array([[1, 2, 3], [4, 5, 6]])
flat = matrix.flatten()    # [1, 2, 3, 4, 5, 6]

# Transpose: swap dimensions
print(matrix.T)
# [[1, 4],
#  [2, 5],
#  [3, 6]]

# ─── BROADCASTING ───────────────────────────────

# Example: add scalar to every element
a = np.array([1, 2, 3])
print(a + 10)             # [11, 12, 13] ✓

# Example: add column vector to matrix (expand automatically)
matrix = np.array([[1, 2, 3], [4, 5, 6]])  # shape (2, 3)
col = np.array([[10], [20]])                # shape (2, 1)
result = matrix + col
# [[11, 12, 13],
#  [24, 25, 26]]

# Example: ML normalization
data = np.array([1, 2, 3, 4, 5])        # shape (5,)
mean = np.mean(data)                    # scalar
std = np.std(data)                      # scalar
normalized = (data - mean) / std        # broadcasting works!

# Example: batch normalization
X = np.random.rand(32, 10)              # 32 samples, 10 features
mean = np.mean(X, axis=0)               # (10,) - mean per feature
X_normalized = X - mean                 # (32, 10) - (10,) broadcasts!`} />
      
      <Callout emoji="🔄" title="Broadcasting rule" color={C.accent}>Dimensions align from the right. Smaller dimensions expand to match larger ones (if compatible). Master broadcasting to write clean, fast ML code!</Callout>
      
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent2)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

// ─── PANDAS ──────────────────────────────────────────────────────────────

function LessonDataframes({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>DataFrames & Series</SectionTitle>
      <Para><strong style={{ color: C.accent3 }}>Pandas</strong> is built on NumPy and adds labeled data structures. A <strong>DataFrame</strong> is like a table (rows + columns with names). A <strong>Series</strong> is a single column. Pandas is essential for data loading and exploration.</Para>
      
      <CodeBlock code={`import pandas as pd
import numpy as np

# Create a DataFrame from dict (most common)
data = {
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'salary': [50000, 60000, 75000]
}
df = pd.DataFrame(data)
#      name  age  salary
# 0   Alice   25   50000
# 1     Bob   30   60000
# 2  Charlie   35   75000

# Create from numpy array
arr = np.random.rand(3, 4)
df = pd.DataFrame(arr, columns=['A', 'B', 'C', 'D'])

# Create a Series (single column)
s = pd.Series([10, 20, 30], index=['x', 'y', 'z'])
# x    10
# y    20
# z    30

# Access data
print(df['name'])           # Get column by name
print(df.loc[0])            # Get row by label
print(df.iloc[0])           # Get row by position (0-indexed)
print(df['age'].mean())     # Get mean of column
print(df.shape)             # (3, 3) - rows, columns

# Basic info
print(df.info())            # Data types, non-null counts
print(df.describe())        # Summary stats`} />
      
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent3)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonDataAccess({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>Accessing & Filtering Data</SectionTitle>
      <Para>Selecting and filtering data is a core pandas skill. You'll constantly filter datasets for training, validation, and testing.</Para>
      
      <CodeBlock code={`import pandas as pd

# Sample DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'age': [25, 30, 35, 28],
    'department': ['Sales', 'ML', 'Sales', 'ML'],
    'salary': [50000, 70000, 55000, 75000]
})

# ─── SELECTION ───────────────────────────────

print(df['name'])              # Get column
print(df[['name', 'age']])     # Get multiple columns
print(df.iloc[0])              # Row by index position
print(df.loc[0])               # Row by label
print(df.iloc[0:2])            # Rows 0-1

# ─── FILTERING (Boolean indexing) ───────────

# Filter by condition
high_salary = df[df['salary'] > 60000]
# Returns rows where salary > 60000

ml_team = df[df['department'] == 'ML']
# Returns only ML department rows

# Multiple conditions
young_ml = df[(df['age'] < 30) & (df['department'] == 'ML')]
young_or_rich = df[(df['age'] < 30) | (df['salary'] > 60000)]

# Filter with .isin()
df[df['department'].isin(['ML', 'Sales'])]  # Either ML or Sales
df[~df['department'].isin(['HR'])]          # NOT HR (~ means not)

# Sort data
df.sort_values('age')         # Sort by age ascending
df.sort_values('salary', ascending=False)  # Descending
df.sort_values(['department', 'salary'])   # Sort by multiple columns

# Drop rows/columns
df.drop(0)                    # Remove row 0
df.drop(columns=['age'])      # Remove age column
df[df['salary'] > 0]          # Keep only rows where salary > 0`} />
      
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent3)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonDataAgg({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>Aggregation & Grouping</SectionTitle>
      <Para><strong style={{ color: C.accent }}>Aggregation</strong> combines multiple rows into summary statistics. <strong>Grouping</strong> splits data into categories, then aggregates each group. Essential for data exploration.</Para>
      
      <CodeBlock code={`import pandas as pd

df = pd.DataFrame({
    'department': ['Sales', 'ML', 'Sales', 'ML', 'Sales', 'ML'],
    'quarter': ['Q1', 'Q1', 'Q2', 'Q2', 'Q3', 'Q3'],
    'revenue': [100, 150, 120, 180, 110, 200]
})

# ─── AGGREGATION (single summary) ────────────

print(df['revenue'].sum())        # Total: 860
print(df['revenue'].mean())       # Average: 143.33
print(df['revenue'].std())        # Std dev: 38.02
print(df['revenue'].min())        # Minimum: 100
print(df.agg({'revenue': ['sum', 'mean', 'std']}))  # Multiple stats

# ─── GROUPBY (aggregate per group) ──────────

# Group by department, sum revenue
by_dept = df.groupby('department')['revenue'].sum()
# department
# ML        530
# Sales     330

# Group by multiple columns
by_dept_q = df.groupby(['department', 'quarter'])['revenue'].sum()
# department  quarter
# ML          Q1         150
#             Q2         180
#             Q3         200
# Sales       Q1         100
#             Q2         120
#             Q3         110

# Multiple aggregations at once
summary = df.groupby('department')['revenue'].agg(['sum', 'mean', 'count'])
#           sum   mean  count
# department
# ML        530  176.7      3
# Sales     330  110.0      3

# Custom aggregation
def revenue_range(x):
    return x.max() - x.min()

df.groupby('department')['revenue'].agg(revenue_range)
# department
# ML      50  (200-150)
# Sales   20  (120-100)`} />
      
      <Callout emoji="📊" title="Workflow tip" color={C.green}>Explore data: filter → group → aggregate → visualize. This pattern is used in 80% of ML preprocessing!</Callout>
      
      {!done ? <button onClick={onComplete} style={btnStyle(C.accent)}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

// ─── BASH TERMINAL ──────────────────────────────────────────────────────────

function LessonBashIntro({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>Command Line Basics</SectionTitle>
      <Para>The <strong>command line (terminal/shell)</strong> is how ML engineers run training scripts, manage files, and interact with servers. Learning bash is essential for practical ML work.</Para>
      
      <CodeBlock code={`# Basics: print, echo, variables
echo "Hello, World!"            # Print text
echo $USER                      # Print environment variable
echo $HOME                      # Home directory path

# Navigation
pwd                             # Print working directory
ls                              # List files
ls -la                          # List with details (-l) and hidden (-a)
cd /path/to/directory           # Change directory
cd ..                           # Go to parent directory
cd ~                            # Go to home directory
cd -                            # Go to previous directory

# File operations
cat filename.txt                # Display file contents
head filename.txt               # First 10 lines
tail filename.txt               # Last 10 lines
wc -l filename.txt              # Count lines
grep "pattern" filename.txt     # Find lines matching pattern

# Create/copy/move/delete
mkdir mydir                     # Create directory
touch file.txt                  # Create empty file
cp source.txt dest.txt          # Copy file
mv oldname.txt newname.txt      # Move/rename
rm file.txt                     # Delete file
rm -r directory                 # Delete directory recursively

# Pipes and redirection
ls | wc -l                      # Count files (pipe |)
cat file.txt > output.txt       # Write to file (>)
cat file.txt >> output.txt      # Append to file (>>)
grep "error" log.txt | wc -l    # Find errors, count them

# Useful shortcuts
Ctrl+C                          # Stop running command
Ctrl+L                          # Clear screen
↑ arrow                         # Previous command
Tab                             # Auto-complete`} />
      
      {!done ? <button onClick={onComplete} style={btnStyle("#6366f1")}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonBashFiles({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>Files & Directories</SectionTitle>
      <Para>Managing files and folders efficiently is crucial when working with datasets, model checkpoints, and logs. Learn to navigate and organize like a pro.</Para>
      
      <CodeBlock code={`# Directory structure
mkdir -p project/data/raw          # Create nested directories (-p)
tree project                        # Show tree structure
find . -name "*.py"              # Find all Python files
find . -type f -name "*.txt"     # Find text files

# File permissions and info
ls -l filename                      # See size, date, permissions
chmod +x script.sh                 # Make executable
stat filename                       # Detailed file info

# Disk space
du -sh folder                       # Directory size
df -h                              # Disk usage
ls -lhS                            # Files sorted by size

# Working with multiple files
ls *.py                             # List all Python files
cp *.csv backup/                   # Copy all CSVs to backup/
rm *.tmp                            # Delete all temp files
for f in *.txt; do echo $f; done   # Loop through files

# Archives
tar -czf archive.tar.gz folder/    # Compress (tar + gzip)
tar -xzf archive.tar.gz            # Extract
zip -r archive.zip folder/         # Zip format
unzip archive.zip                  # Unzip

# View and search file structure
find . -type d                      # List all directories
find . -name "*model*"             # Find files with "model" in name
locate data.csv                     # Quick search in system database
grep -r "error" .                  # Search recursively`} />
      
      {!done ? <button onClick={onComplete} style={btnStyle("#6366f1")}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}

function LessonBashAdvanced({ onComplete, done, isMobile, isTablet }) {
  return (
    <div>
      <SectionTitle>Advanced Commands</SectionTitle>
      <Para>These commands are used in production ML workflows: running Python scripts, checking system resources, managing processes, and automating tasks.</Para>
      
      <CodeBlock code={`# Running Python scripts
python train.py                     # Run Python script
python train.py --epochs 100       # With arguments
python -m module_name              # Run module

# Environment variables
export MY_VAR="value"              # Set variable
echo $MY_VAR                        # Use variable
env                                 # Show all environment variables
python -c "import torch; print(torch.__version__)"  # Quick Python

# Running long processes in background
python train.py &                   # Run in background
jobs                                # List background jobs
bg %1                               # Continue job 1 in background
fg %1                               # Bring job 1 to foreground
nohup python train.py &             # Run even after closing terminal

# Monitoring processes
ps aux | grep python                # Find running processes
top                                 # Real-time system monitor
nvidia-smi                          # Check GPU usage
free -h                             # Check memory

# Piping and chaining
command1 | command2 | command3      # Pipe output through commands
&&                                  # Run next only if successful
||                                  # Run next only if failed
;                                   # Always run next

# Practical ML examples
python train.py && python eval.py   # Train, then evaluate
grep "accuracy" log.txt | tail -1  # Get last accuracy
ls -lt *.pth | head -1             # Find newest checkpoint
for file in *.csv; do python process.py $file; done  # Batch process

# Permissions for team work
chmod 755 script.sh                 # Executable by all
chmod 644 data.csv                  # Readable by all
chown user:group file               # Change ownership`} />
      
      {!done ? <button onClick={onComplete} style={btnStyle("#6366f1")}>✓ Mark Complete</button> : <div style={{ color: C.green, marginTop: 10, fontWeight: 700, fontSize: 13 }}>✅ Completed!</div>}
    </div>
  );
}



// ─── Lesson map ───────────────────────────────────────────────────────────────
const LESSON_MAP = {
  // Algebra
  variables: LessonVariables, "linear-eq": LessonLinearEq, logarithms: LessonLogarithms, sigmoid: LessonSigmoid,
  // Linear Algebra
  tensors: LessonTensors, matmul: LessonMatMul,
  // Statistics
  "mean-median": LessonMeanMedian, "std-dev": LessonStdDev, histogram: LessonHistogram,
  // Calculus
  derivatives: LessonDerivatives, gradient: LessonGradient, "gradient-descent": LessonGradientDescent, "chain-rule": LessonChainRule, "partial-deriv": LessonPartialDeriv,
  // Python Basics
  "data-types": LessonDataTypes, functions: LessonFunctions, "data-structures": LessonDataStructures, "control-flow": LessonControlFlow,
  // Python Advanced
  "string-format": LessonStringFormat, "list-comp": LessonListComprehensions,
  // Trigonometry
  tanh: LessonTanh,
  // NumPy
  "numpy-arrays": LessonNumpyArrays, "numpy-ops": LessonNumpyOps, "numpy-reshape": LessonNumpyReshape,
  // Pandas
  dataframes: LessonDataframes, "data-access": LessonDataAccess, "data-agg": LessonDataAgg,
  // Bash
  "bash-intro": LessonBashIntro, "bash-files": LessonBashFiles, "bash-advanced": LessonBashAdvanced,
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTopic, setActiveTopic] = useState("variables");
  const [completed, setCompleted] = useState({});
  const [openSection, setOpenSection] = useState("algebra");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile, isTablet } = useResponsive();

  const allTopics = SECTIONS.flatMap(s => s.topics.map(t => ({ ...t, sectionId: s.id })));
  const totalTopics = allTopics.length;
  const completedCount = Object.keys(completed).length;
  const pct = Math.round((completedCount / totalTopics) * 100);

  const currentSection = SECTIONS.find(s => s.topics.some(t => t.id === activeTopic));
  const currentTopic = currentSection?.topics.find(t => t.id === activeTopic);
  const currentIdx = allTopics.findIndex(t => t.id === activeTopic);
  const nextTopic = allTopics[currentIdx + 1];

  const LessonComp = LESSON_MAP[activeTopic];

  const sidebarWidth = isMobile ? "100%" : 255;
  const sidebarPosition = isMobile ? "fixed" : "relative";
  const sidebarZIndex = isMobile ? 1000 : "auto";
  const overlayVisible = isMobile && sidebarOpen;

  return (
    <div style={{ display: "flex", height: isMobile ? "auto" : "100vh", background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: C.text, overflow: isMobile ? "auto" : "hidden", flexDirection: isMobile ? "column" : "row" }}>
      {/* ── Mobile Overlay ──────────────────────────────────────── */}
      {overlayVisible && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div style={{ width: sidebarWidth, background: C.panel, borderRight: isMobile ? "none" : `1px solid ${C.border}`, borderBottom: isMobile ? `1px solid ${C.border}` : "none", display: sidebarOpen || !isMobile ? "flex" : "none", flexDirection: "column", flexShrink: 0, overflow: isMobile ? "auto" : "hidden", position: sidebarPosition, height: isMobile ? "auto" : "100vh", top: 0, left: 0, maxHeight: isMobile ? "70vh" : "100vh", zIndex: sidebarZIndex }}>
        {/* Header */}
        <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Google ML Crash Course</div>
          <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 900, color: C.text, lineHeight: 1.25, marginBottom: 12 }}>Prerequisites<br />Learning Lab</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: C.muted }}>{completedCount}/{totalTopics} complete</span>
            <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>{pct}%</span>
          </div>
          <div style={{ background: C.border, borderRadius: 999, height: 5, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${C.accent2}, ${C.accent})`, height: "100%", borderRadius: 999, transition: "width 0.5s ease" }} />
          </div>
        </div>
        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {SECTIONS.map(section => {
            const sectionDone = section.topics.filter(t => completed[t.id]).length;
            return (
              <div key={section.id}>
                <button onClick={() => setOpenSection(openSection === section.id ? null : section.id)} style={{ width: "100%", padding: "9px 14px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 9, textAlign: "left" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: section.color + "20", border: `1px solid ${section.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: section.color, fontWeight: 700, flexShrink: 0 }}>{section.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{section.label}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{sectionDone}/{section.topics.length} done</div>
                  </div>
                  <span style={{ color: C.muted, fontSize: 9 }}>{openSection === section.id ? "▲" : "▼"}</span>
                </button>
                {openSection === section.id && section.topics.map(topic => {
                  const isActive = activeTopic === topic.id;
                  const isDone = completed[topic.id];
                  return (
                    <button key={topic.id} onClick={() => { setActiveTopic(topic.id); if (isMobile) setSidebarOpen(false); }} style={{ width: "100%", padding: "7px 14px 7px 50px", border: "none", cursor: "pointer", textAlign: "left", background: isActive ? section.color + "16" : "transparent", borderLeft: `3px solid ${isActive ? section.color : "transparent"}`, display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${isDone ? C.green : isActive ? section.color : C.border}`, background: isDone ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isDone && <span style={{ color: "#000", fontSize: 7, fontWeight: 900 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 12, color: isActive ? C.text : C.subtle, fontWeight: isActive ? 600 : 400 }}>{topic.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 16px 24px" : "28px 36px", width: isMobile ? "100%" : "auto" }}>
        {/* Mobile Header with Hamburger */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: C.text, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ☰
            </button>
            <span style={{ color: C.muted, fontSize: 12 }}>Menu</span>
          </div>
        )}

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ background: currentSection?.color + "20", color: currentSection?.color, borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${currentSection?.color}44` }}>{currentSection?.icon} {currentSection?.label}</span>
          <span style={{ color: C.muted, fontSize: 12 }}>›</span>
          <span style={{ color: C.subtle, fontSize: 12 }}>{currentTopic?.label}</span>
        </div>
        {/* Lesson */}
        <div style={{ maxWidth: 820, width: "100%" }}>
          {LessonComp && <LessonComp onComplete={() => setCompleted(prev => ({ ...prev, [activeTopic]: true }))} done={!!completed[activeTopic]} isMobile={isMobile} isTablet={isTablet} />}
        </div>
        {/* Next topic */}
        {nextTopic && completed[activeTopic] && (
          <div style={{ maxWidth: 820, marginTop: 24, padding: "14px 20px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ color: C.muted, fontSize: 12 }}>Up next: <span style={{ color: C.subtle }}>{nextTopic.label}</span></div>
            <button onClick={() => { setActiveTopic(nextTopic.id); setOpenSection(nextTopic.sectionId); }} style={{ padding: "8px 18px", background: C.accent2, border: "none", borderRadius: 8, color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Continue →
            </button>
          </div>
        )}
        {/* Completion */}
        {completedCount === totalTopics && (
          <div style={{ maxWidth: 820, marginTop: 24, padding: "24px", background: `${C.green}12`, borderRadius: 14, border: `2px solid ${C.green}55`, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <div style={{ color: C.green, fontSize: 18, fontWeight: 900 }}>All {totalTopics} prerequisites mastered!</div>
            <div style={{ color: C.subtle, fontSize: 13, marginTop: 6 }}>You're ready to begin Google's ML Crash Course. Go to <span style={{ color: C.accent2 }}>developers.google.com/machine-learning/crash-course</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
