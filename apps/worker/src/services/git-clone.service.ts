import { execFile } from "node:child_process";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

export type GitCloneInput = {
  repoUrl: string;
  pat?: string;
  timeWindow: string;
};

export type GitCloneResult = {
  repoPath: string;
  commitCount: number;
  branch: string;
};

export type GitCloneError = {
  errorCode:
    | "CLONE_FAILED"
    | "REPO_NOT_FOUND"
    | "AUTH_INVALID_PAT"
    | "GITHUB_RATE_LIMITED"
    | "INTERNAL_ERROR";
  errorMessage: string;
};

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const WINDOW_DEPTH_MAP: Record<string, number> = {
  "30d": 1000,
  "90d": 3000,
  "180d": 6000,
};

function resolveDepth(timeWindow: string): number {
  return WINDOW_DEPTH_MAP[timeWindow] ?? 3000;
}

function buildCloneUrl(repoUrl: string, pat?: string): string {
  if (!pat) return repoUrl;
  // Support both https:// and git@ formats
  if (repoUrl.startsWith("https://")) {
    const url = new URL(repoUrl);
    url.username = `x-access-token`;
    url.password = pat;
    return url.toString();
  }
  return repoUrl;
}

/**
 * Clone a Git repository to a temporary directory.
 * Supports public repos and private repos via PAT.
 * Cleans up temp dir on failure.
 */
export async function cloneRepo(input: GitCloneInput): Promise<GitCloneResult> {
  const tmpDir = mkdtempSync(join(tmpdir(), "gitinsight-"));
  const depth = resolveDepth(input.timeWindow);
  const cloneUrl = buildCloneUrl(input.repoUrl, input.pat);

  try {
    await runGitClone(cloneUrl, tmpDir, depth);

    // Determine default branch
    const branch = await getDefaultBranch(tmpDir);

    // Count commits
    const commitCount = await countCommits(tmpDir);

    return { repoPath: tmpDir, commitCount, branch };
  } catch (err) {
    // Clean up on failure
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
    throw mapCloneError(err, input);
  }
}

function runGitClone(url: string, dir: string, depth: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "git",
      ["clone", url, dir, "--depth", String(depth)],
      {
        timeout: TIMEOUT_MS,
        killSignal: "SIGKILL",
        maxBuffer: 10 * 1024 * 1024,
      },
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );

    child.on("error", (err) => reject(err));

    const KILL_GRACE_MS = TIMEOUT_MS + 5000;
    const forcedKill = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch {}
      reject(new Error("Git clone timed out after " + (TIMEOUT_MS / 1000) + "s"));
    }, KILL_GRACE_MS);

    child.on("exit", () => clearTimeout(forcedKill));
  });
}

function getDefaultBranch(repoPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      ["-C", repoPath, "rev-parse", "--abbrev-ref", "HEAD"],
      { timeout: 10000 },
      (err, stdout) => {
        if (err) {
          reject(err);
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
}

function countCommits(repoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      ["-C", repoPath, "rev-list", "--count", "HEAD"],
      { timeout: 10000 },
      (err, stdout) => {
        if (err) {
          reject(err);
        } else {
          resolve(Number.parseInt(stdout.trim(), 10) || 0);
        }
      }
    );
  });
}

function mapCloneError(err: unknown, input: GitCloneInput): GitCloneError {
  const stderr =
    typeof err === "object" && err !== null && "stderr" in err
      ? String((err as { stderr: string }).stderr).toLowerCase()
      : err instanceof Error
        ? err.message.toLowerCase()
        : "";

  if (
    (err as { code?: number }).code === 128 ||
    stderr.includes("could not read from remote repository") ||
    stderr.includes("repository not found")
  ) {
    // Differentiate auth vs not-found
    if (
      stderr.includes("authentication") ||
      stderr.includes("403") ||
      stderr.includes("not authorized")
    ) {
      return {
        errorCode: "AUTH_INVALID_PAT",
        errorMessage: input.pat
          ? "PAT is invalid or expired"
          : "Authentication required but no PAT provided",
      };
    }

    if (stderr.includes("not found") || stderr.includes("could not read")) {
      return {
        errorCode: "REPO_NOT_FOUND",
        errorMessage: `Repository not found or no access: ${input.repoUrl}`,
      };
    }
  }

  if (
    stderr.includes("rate limit") ||
    stderr.includes("403") ||
    stderr.includes("api rate limit")
  ) {
    return {
      errorCode: "GITHUB_RATE_LIMITED",
      errorMessage: "GitHub API rate limit exceeded",
    };
  }

  if (stderr.includes("authentication") || stderr.includes("auth")) {
    return {
      errorCode: "AUTH_INVALID_PAT",
      errorMessage: input.pat
        ? "PAT is invalid or expired"
        : "Authentication required but no PAT provided",
    };
  }

  return {
    errorCode: "CLONE_FAILED",
    errorMessage:
      err instanceof Error ? err.message : "Unknown clone failure",
  };
}
