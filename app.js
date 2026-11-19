// AdherenceDash metric engine + renderer.
// Metric functions are dependency-free and also run under Node for tests.

const INTERVAL_MINUTES = 30;

// Adherence for one day: share of intervals where actual state == scheduled state.
function dayAdherence(schedule, actual) {
  if (schedule.length === 0) return null;
  let match = 0;
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i] === actual[i]) match++;
  }
  return match / schedule.length;
}

// Out-of-adherence minutes attributed to the SCHEDULED state that was missed.
// e.g. 30 min late back from lunch counts 30 missed Phone minutes if Phone
// was scheduled, because that is the coverage that was lost.
function missedMinutesByState(schedule, actual) {
  const missed = {};
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i] !== actual[i]) {
      missed[schedule[i]] = (missed[schedule[i]] || 0) + INTERVAL_MINUTES;
    }
  }
  return missed;
}

function analyze(data) {
  const agents = data.agents.map((agent) => {
    const dayStats = agent.days.map((d) => ({
      day: d.day,
      adherence: dayAdherence(d.schedule, d.actual),
      missed: missedMinutesByState(d.schedule, d.actual),
    }));
    const allSched = [];
    const allAct = [];
    agent.days.forEach((d) => {
      allSched.push(...d.schedule);
      allAct.push(...d.actual);
    });
    return {
      id: agent.id,
      name: agent.name,
      week: dayAdherence(allSched, allAct),
      days: dayStats,
    };
  });

  // Team daily adherence
  const teamDays = data.days.map((label, di) => {
    const s = [];
    const a = [];
    data.agents.forEach((agent) => {
      s.push(...agent.days[di].schedule);
      a.push(...agent.days[di].actual);
    });
    return { day: label, adherence: dayAdherence(s, a) };
  });

  // Team missed minutes by scheduled state
  const teamMissed = {};
  data.agents.forEach((agent) => {
    agent.days.forEach((d) => {
      const m = missedMinutesByState(d.schedule, d.actual);
      for (const k in m) teamMissed[k] = (teamMissed[k] || 0) + m[k];
    });
  });

  const totalSched = [];
  const totalAct = [];
  data.agents.forEach((agent) => {
    agent.days.forEach((d) => {
      totalSched.push(...d.schedule);
      totalAct.push(...d.actual);
    });
  });

  return {
    agents,
    teamDays,
    teamMissed,
    teamWeek: dayAdherence(totalSched, totalAct),
  };
}

function pct(x) {
  if (x === null || x === undefined || !isFinite(x)) return "n/a";
  return (x * 100).toFixed(1) + "%";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { dayAdherence, missedMinutesByState, analyze, INTERVAL_MINUTES };
}

/* ---------- browser rendering below ---------- */
if (typeof document !== "undefined") {
  const NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function adherenceClass(v) {
    if (v === null) return "none";
    if (v >= 0.95) return "great";
    if (v >= 0.85) return "ok";
    return "low";
  }

  function renderHeatmap(result) {
    const table = document.getElementById("heatmap");
    const thead = table.querySelector("thead tr");
    result.agents[0].days.forEach((d) => {
      const th = document.createElement("th");
      th.textContent = d.day;
      thead.appendChild(th);
    });
    const wk = document.createElement("th");
    wk.textContent = "Week";
    thead.appendChild(wk);

    const tbody = table.querySelector("tbody");
    result.agents.forEach((agent) => {
      const tr = document.createElement("tr");
      const name = document.createElement("td");
      name.textContent = agent.name;
      tr.appendChild(name);
      agent.days.forEach((d) => {
        const td = document.createElement("td");
        td.textContent = pct(d.adherence);
        td.className = adherenceClass(d.adherence);
        tr.appendChild(td);
      });
      const w = document.createElement("td");
      w.textContent = pct(agent.week);
      w.className = adherenceClass(agent.week) + " week";
      tr.appendChild(w);
      tbody.appendChild(tr);
    });
  }

  function renderMissed(result) {
    const svg = document.getElementById("missedChart");
    const entries = Object.entries(result.teamMissed).sort((a, b) => b[1] - a[1]);
    const W = 720, H = 200, P = 90;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    const max = Math.max(...entries.map((e) => e[1]), 1);
    const barH = (H - 40) / entries.length;
    entries.forEach(([state, mins], i) => {
      const y = 10 + i * barH;
      const w = (mins / max) * (W - P - 70);
      svg.appendChild(el("text", { x: 4, y: y + barH / 2 + 4, class: "label" }, "Missed " + state));
      svg.appendChild(el("rect", { x: P, y: y + 4, width: w, height: barH - 10, class: "bar" }));
      svg.appendChild(el("text", { x: P + w + 8, y: y + barH / 2 + 4, class: "value" }, mins + " min"));
    });
  }

  function renderTrend(result) {
    const svg = document.getElementById("trendChart");
    const W = 720, H = 200, P = 40;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    const vals = result.teamDays.map((d) => d.adherence);
    const min = Math.min(...vals, 0.7);
    const x = (i) => P + (i / (vals.length - 1)) * (W - 2 * P);
    const y = (v) => H - P - ((v - min) / (1 - min)) * (H - 2 * P);
    [1.0, 0.9, 0.8].forEach((g) => {
      if (g >= min) {
        svg.appendChild(el("line", { x1: P, x2: W - P, y1: y(g), y2: y(g), class: "grid" }));
        svg.appendChild(el("text", { x: 2, y: y(g) + 4, class: "tick" }, Math.round(g * 100) + "%"));
      }
    });
    const d = vals.map((v, i) => (i === 0 ? "M" : "L") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
    svg.appendChild(el("path", { d, class: "trend" }));
    vals.forEach((v, i) => {
      svg.appendChild(el("circle", { cx: x(i), cy: y(v), r: 4, class: "dot" }));
      svg.appendChild(el("text", { x: x(i) - 14, y: H - 8, class: "tick" }, result.teamDays[i].day));
    });
  }

  function render() {
    const result = analyze(ADHERENCE_DATA);
    document.getElementById("teamWeek").textContent = pct(result.teamWeek);
    const worstDay = result.teamDays.reduce((a, b) => (b.adherence < a.adherence ? b : a));
    document.getElementById("worstDay").textContent = worstDay.day + " " + pct(worstDay.adherence);
    const best = result.agents.reduce((a, b) => (b.week > a.week ? b : a));
    const focus = result.agents.reduce((a, b) => (b.week < a.week ? b : a));
    document.getElementById("bestAgent").textContent = best.name.replace("Agent ", "") + " " + pct(best.week);
    document.getElementById("focusAgent").textContent = focus.name.replace("Agent ", "") + " " + pct(focus.week);
    renderHeatmap(result);
    renderMissed(result);
    renderTrend(result);
  }

  render();
      }
