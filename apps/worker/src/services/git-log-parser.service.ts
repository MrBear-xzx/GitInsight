import { execFile } from "node:child_process";

export type CommitRecord = {
  hash: string;
  author: string;
  authorEmail: string;
  timestamp: string;
  message: string;
  files: string[];
  additions: number;
  deletions: number;
};

export type ParseLogInput = {
  repoPath: string;
  timeWindow: string;
};

export type ParseLogResult = {
  commits: CommitRecord[];
  totalCommits: number;
  timeRange: { since: string; until: string };
};

const WINDOW_SINCE_MAP: Record<string, string> = {
  "30d": "30 days ago",
  "90d": "90 days ago",
  "180d": "180 days ago",
};

const GIT_LOG_TIMEOUT_MS = 60_000;
const GIT_LOG_MAX_BUFFER = 50 * 1024 * 1024; // 50MB

/**
 * Parse git log output from a cloned repository into structured commit records.
 * Uses --format for metadata and --numstat for file change stats.
 */
export async function parseGitLog(input: ParseLogInput): Promise<ParseLogResult> {
  const since = WINDOW_SINCE_MAP[input.timeWindow] ?? "90 days ago";
  const until = new Date().toISOString();

  const stdout = await runGitLog(input.repoPath, since);

  const commits = parseLogOutput(stdout);

  // Calculate overall time range
  let timeSince = until;
  let timeUntil = "";
  for (const c of commits) {
    if (c.timestamp < timeSince) timeSince = c.timestamp;
    if (c.timestamp > timeUntil) timeUntil = c.timestamp;
  }

  return {
    commits,
    totalCommits: commits.length,
    timeRange: {
      since: timeSince === until ? new Date(Date.now() - 90 * 86400000).toISOString() : timeSince,
      until: timeUntil || until,
    },
  };
}

function runGitLog(repoPath: string, since: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      [
        "-C",
        repoPath,
        "log",
        `--since="${since}"`,
        "--format=%H||%an||%ae||%ai||%s",
        "--numstat",
      ],
      {
        timeout: GIT_LOG_TIMEOUT_MS,
        maxBuffer: GIT_LOG_MAX_BUFFER,
      },
      (err, stdout) => {
        if (err) {
          reject(
            Object.assign(
              new Error(`git log failed: ${err.message}`),
              { errorCode: "INTERNAL_ERROR" as const }
            )
          );
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

function parseLogOutput(stdout: string): CommitRecord[] {
  if (!stdout.trim()) return [];

  const lines = stdout.split("\n");
  const commits: CommitRecord[] = [];
  let currentCommit: CommitRecord | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) {
      // Empty line separates commits
      if (currentCommit) {
        commits.push(currentCommit);
        currentCommit = null;
      }
      continue;
    }

    // Check if this is a format line (contains || and does not start with a digit/tab)
    // git --format output: <hash>||<author>||<email>||<date>||<message>
    if (line.includes("||") && !/^\d/.test(line) && !line.startsWith("-")) {
      if (currentCommit) {
        commits.push(currentCommit);
      }
      const parts = line.split("||");
      currentCommit = {
        hash: parts[0],
        author: parts[1] || "",
        authorEmail: parts[2] || "",
        timestamp: parts[3] || "",
        message: parts.slice(4).join("||") || "",
        files: [],
        additions: 0,
        deletions: 0,
      };
      continue;
    }

    // Check if this is a numstat line: "additions\tdeletions\tfilepath"
    const numstatMatch = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (numstatMatch && currentCommit) {
      const additions = numstatMatch[1] === "-" ? 0 : Number.parseInt(numstatMatch[1], 10);
      const deletions = numstatMatch[2] === "-" ? 0 : Number.parseInt(numstatMatch[2], 10);
      currentCommit.files.push(numstatMatch[3]);
      currentCommit.additions += additions;
      currentCommit.deletions += deletions;
    }
  }

  // Push last commit if any
  if (currentCommit) {
    commits.push(currentCommit);
  }

  return commits;
}
