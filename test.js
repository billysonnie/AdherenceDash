const assert = require("assert");
const data = require("./data.js");
const { dayAdherence, missedMinutesByState, analyze, INTERVAL_MINUTES } = require("./app.js");

// metric math
assert.strictEqual(dayAdherence(["Phone", "Break"], ["Phone", "Break"]), 1);
assert.strictEqual(dayAdherence(["Phone", "Break"], ["Phone", "Lunch"]), 0.5);
assert.strictEqual(dayAdherence([], []), null);
assert.deepStrictEqual(missedMinutesByState(["Phone", "Break"], ["Break", "Break"]), { Phone: 30 });
assert.deepStrictEqual(missedMinutesByState(["Phone"], ["Phone"]), {});

// demo data integrity
assert.strictEqual(data.agents.length, 6);
data.agents.forEach((a) => {
  assert.strictEqual(a.days.length, 5);
  a.days.forEach((d) => {
    assert.strictEqual(d.schedule.length, 10);
    assert.strictEqual(d.actual.length, 10);
    d.schedule.forEach((s) => assert(data.states.includes(s)));
    d.actual.forEach((s) => assert(data.states.includes(s)));
  });
});

// analysis shape and sane demo ranges: some misses, but not chaos
const r = analyze(data);
assert.strictEqual(r.agents.length, 6);
assert.strictEqual(r.teamDays.length, 5);
assert(r.teamWeek > 0.75 && r.teamWeek < 1.0, "team week in demo range, got " + r.teamWeek);
const totalMissed = Object.values(r.teamMissed).reduce((a, b) => a + b, 0);
assert(totalMissed > 0, "there are missed minutes to show");
assert(totalMissed % INTERVAL_MINUTES === 0, "missed minutes are whole intervals");
assert(r.agents.some((a) => a.week < 0.9), "at least one agent visibly below target");

console.log("ALL TESTS PASS");
console.log("team week adherence:", (r.teamWeek * 100).toFixed(1) + "%");
console.log("missed minutes by state:", JSON.stringify(r.teamMissed));
console.log("agent weeks:", r.agents.map((a) => a.name + "=" + (a.week * 100).toFixed(0) + "%").join(" "));
