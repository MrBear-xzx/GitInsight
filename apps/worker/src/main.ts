// The worker package is now used as a shared analysis library by the API.
// All analysis work runs inline within the API process — no separate worker process is needed.
// Services (git-clone, git-log-parser, metrics-calculator) are imported directly by apps/api.
console.log("[worker] Analysis services loaded as library (inline mode). No standalone process required.");
