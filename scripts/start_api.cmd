@echo off
set ANALYSIS_JOB_STORE=memory
set ANALYSIS_JOB_DISPATCH_MODE=queue
set ANALYSIS_JOB_QUEUE_EXECUTION_MODE=inprocess
node node_modules\.pnpm\tsx@4.22.4\node_modules\tsx\dist\cli.mjs --tsconfig apps/api/tsconfig.json apps/api/src/main.ts
