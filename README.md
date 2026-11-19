# AdherenceDash

Workforce management (WFM) schedule adherence tracker. It compares each agent's scheduled activity (Phone, Break, Lunch, Training) against the activity they were actually in, interval by interval, and rolls the misses up into team-level views a real-time analyst or team lead would use.

**Live demo:** https://billysonnie.github.io/AdherenceDash/

## What it does

- **Team scorecards**: weekly adherence, weakest day, most consistent agent, and who needs coaching focus
- **Agent-by-day heatmap**: color-coded adherence (green 95%+, amber 85-95%, red under 85%)
- **Missed minutes by activity**: where the week's coverage was actually lost, counted against the scheduled activity (late back from lunch = missed Phone time)
- **Team trend**: day-by-day adherence line for the week

## Data

**All agents, schedules, and events in this demo are fictional.** They are generated in `data.js` with deterministic seeded randomness (late returns from break, skipped training, worked-through breaks) so the demo looks identical on every visit. Names are role labels like "Agent Rivera", not real people. To use real data, replace `ADHERENCE_DATA` in `data.js` with the same shape: agents, each with days of `schedule` and `actual` activity arrays.

## Run it

Static site, no build step, no dependencies. Open `index.html` in a browser or serve the folder with any static server.

## Tests

Metric math and demo-data integrity are covered by a Node test suite:

```
node test.js
```

## Model limitations

- Adherence here is a binary interval match (in the scheduled activity or not). Real WFM platforms also track *conformance* (total time in the right activity regardless of timing) and grace thresholds around scheduled start times.
- Missed minutes are attributed to the scheduled activity; they do not distinguish unavoidable exceptions (approved schedule changes) from true out-of-adherence behavior.
- A shortened 09:00-14:00 demo day keeps the visualization readable; real schedules span full shifts with more activity types.
- Coaching signals from one week of fictional data are illustrative only - real coaching decisions need context this demo does not model (approved exceptions, tenure, queue conditions).
