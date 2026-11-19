// AdherenceDash demo data.
// ALL agents and schedules below are FICTIONAL, generated for demonstration
// only. They do not represent any real person, team, or employer.
// Model: one work week (Mon-Fri), 10 half-hour intervals per day
// (09:00-14:00 shortened demo day), each interval has a scheduled state
// and the state the agent was actually in.

const STATES = ["Phone", "Break", "Lunch", "Training"];

const AGENTS = [
  { id: "a1", name: "Agent Rivera", seed: 11, reliability: 0.97 },
  { id: "a2", name: "Agent Okafor", seed: 23, reliability: 0.93 },
  { id: "a3", name: "Agent Chen", seed: 37, reliability: 0.88 },
  { id: "a4", name: "Agent Patel", seed: 41, reliability: 0.78 },
  { id: "a5", name: "Agent Brooks", seed: 53, reliability: 0.85 },
  { id: "a6", name: "Agent Nguyen", seed: 67, reliability: 0.91 },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const INTERVALS = [];
for (let h = 9; h < 14; h++) {
  INTERVALS.push(String(h).padStart(2, "0") + ":00");
  INTERVALS.push(String(h).padStart(2, "0") + ":30");
}

function seeded(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Base template: phone work with a mid-morning break, lunch, an afternoon
// break, and one training slot on Wednesdays.
function buildSchedule(dayIndex) {
  const sched = [];
  for (let i = 0; i < INTERVALS.length; i++) {
    let state = "Phone";
    if (i === 3) state = "Break";
    if (i === 5 || i === 6) state = "Lunch";
    if (i === 8) state = "Break";
    if (dayIndex === 2 && i === 9) state = "Training"; // Wed coaching
    sched.push(state);
  }
  return sched;
}

// Actuals copy the schedule, then apply realistic deviations:
// late back from break/lunch, missed training, early logoff.
function buildActual(schedule, rand, reliability) {
  const actual = schedule.slice();
  for (let i = 0; i < actual.length; i++) {
    const prev = i > 0 ? schedule[i - 1] : null;
    const cur = schedule[i];
    // staying in a non-phone state one interval too long
    if ((prev === "Break" || prev === "Lunch") && cur === "Phone" && rand() > reliability) {
      actual[i] = prev;
    }
    // skipping training
    if (cur === "Training" && rand() > reliability) {
      actual[i] = "Phone";
    }
    // unscheduled break during phone time
    if (cur === "Phone" && rand() > reliability + 0.02) {
      actual[i] = "Break";
    }
    // working through a scheduled break or lunch
    if ((cur === "Break" || cur === "Lunch") && rand() > reliability + 0.04) {
      actual[i] = "Phone";
    }
  }
  return actual;
}

function buildWeek() {
  return AGENTS.map((agent) => {
    const rand = seeded(agent.seed);
    return {
      id: agent.id,
      name: agent.name,
      days: DAYS.map((label, dayIndex) => {
        const schedule = buildSchedule(dayIndex);
        return {
          day: label,
          intervals: INTERVALS,
          schedule,
          actual: buildActual(schedule, rand, agent.reliability),
        };
      }),
    };
  });
}

const ADHERENCE_DATA = {
  generatedFor: "AdherenceDash demo - fictional agents and schedules, not real people",
  states: STATES,
  days: DAYS,
  agents: buildWeek(),
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ADHERENCE_DATA;
        }
