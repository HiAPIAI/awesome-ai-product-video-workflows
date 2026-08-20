import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeSignalStats,
  buildReviewChecklist,
  createBlockingSvg,
  parseSignalStats,
  validateSignalStats,
} from "../scripts/lib/review.mjs";

const compiled = {
  id: "review-shot",
  title: "Review <Shot>",
  timeline: { frameStart: 1, frameEnd: 3, fps: 24 },
  world: { groundSize: [12, 8] },
  objects: [{
    id: "lead-subject",
    color: [0.8, 0.2, 0.1],
    keyframes: [
      { location: [-2, 0, 1] },
      { location: [2, 1, 1] },
    ],
  }],
  camera: {
    keyframes: [
      { location: [-4, -3, 2], target: [-2, 0, 1] },
      { location: [0, -3, 2], target: [2, 1, 1] },
    ],
  },
};

test("signalstats metadata is parsed and blank or sudden frames are flagged", () => {
  const metadata = [
    "frame:0 pts:0 pts_time:0",
    "lavfi.signalstats.YMIN=20",
    "lavfi.signalstats.YMAX=120",
    "lavfi.signalstats.YAVG=60",
    "lavfi.signalstats.YDIF=0",
    "frame:1 pts:1 pts_time:0.0416667",
    "lavfi.signalstats.YMIN=30",
    "lavfi.signalstats.YMAX=32",
    "lavfi.signalstats.YAVG=31",
    "lavfi.signalstats.YDIF=2",
    "frame:2 pts:2 pts_time:0.0833333",
    "lavfi.signalstats.YMIN=10",
    "lavfi.signalstats.YMAX=240",
    "lavfi.signalstats.YAVG=110",
    "lavfi.signalstats.YDIF=55.25",
  ].join("\n");
  const records = parseSignalStats(metadata);
  assert.equal(validateSignalStats(records, 3), records);
  assert.equal(records.length, 3);
  assert.equal(records[2].YDIF, 55.25);
  const checks = analyzeSignalStats(records, 1);
  assert.equal(checks.status, "attention");
  assert.deepEqual(checks.blankFrames.map((item) => item.frame), [2]);
  assert.deepEqual(checks.suddenChanges, [{ frame: 3, lumaDifference: 55.25 }]);
});

test("frame analysis rejects missing metrics and non-contiguous indexes", () => {
  assert.throws(() => validateSignalStats([
    { index: 0, YMIN: 10, YMAX: 200, YAVG: 80, YDIF: 0 },
    { index: 2, YMIN: 11, YMAX: 201, YAVG: 82, YDIF: 3.5 },
  ], 2), /unexpected index 2/);
  assert.throws(() => validateSignalStats([
    { index: 0, YMIN: 10, YMAX: 200, YAVG: 80 },
  ], 1), /missing finite YDIF/);
});

test("clean motion metadata passes automatic review", () => {
  const records = [
    { index: 0, YMIN: 10, YMAX: 200, YAVG: 80, YDIF: 0 },
    { index: 1, YMIN: 11, YMAX: 201, YAVG: 82, YDIF: 3.5 },
  ];
  assert.deepEqual(analyzeSignalStats(records).blankFrames, []);
  assert.equal(analyzeSignalStats(records).status, "pass");
});

test("blocking SVG shows object and camera paths with escaped metadata", () => {
  const svg = createBlockingSvg(compiled);
  assert.match(svg, /^<svg/);
  assert.match(svg, /Review &lt;Shot&gt;/);
  assert.match(svg, /lead-subject/);
  assert.match(svg, /<polyline/);
  assert.match(svg, /stroke="#63d6a2"/);
  assert.doesNotMatch(svg, /Review <Shot>/);
});

test("review checklist leaves human approval explicitly incomplete", () => {
  const checklist = buildReviewChecklist(compiled, {
    automaticChecks: { status: "pass", blankFrames: [], suddenChanges: [] },
  });
  assert.match(checklist, /Automated frame scan: \*\*pass\*\*/);
  assert.match(checklist, /- \[ \] Watch `previs\.mp4`/);
  assert.match(checklist, /humanReviewComplete/);
});
