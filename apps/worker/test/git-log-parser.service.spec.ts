import { parseGitLog, ParseLogInput } from "../src/services/git-log-parser.service";
import { execFile } from "node:child_process";

jest.mock("node:child_process", () => ({
  execFile: jest.fn(),
}));

const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;

function makeGitLogSample(): string {
  return [
    "abc1234||Alice||alice@example.com||2026-06-20 10:30:00 +0800||feat: add login page",
    "1\t1\tsrc/pages/login.tsx",
    "3\t0\tsrc/components/button.tsx",
    "",
    "def4567||Bob||bob@example.com||2026-06-19 14:00:00 +0800||fix: resolve null pointer",
    "0\t2\tsrc/utils/helper.ts",
    "",
    "ghi789a||Alice||alice@example.com||2026-06-18 09:15:00 +0800||chore: update deps",
    "100\t50\tpackage.json",
    "10\t10\tpnpm-lock.yaml",
    "",
  ].join("\n");
}

describe("parseGitLog", () => {
  const defaultInput: ParseLogInput = {
    repoPath: "/tmp/gitinsight-test",
    timeWindow: "90d",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("parses git log output into structured records", async () => {
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      if (cb) {
        cb(null, makeGitLogSample(), "");
      }
      return undefined as never;
    });

    const result = await parseGitLog(defaultInput);

    expect(result.totalCommits).toBe(3);
    expect(result.commits).toHaveLength(3);

    // First commit
    expect(result.commits[0].hash).toBe("abc1234");
    expect(result.commits[0].author).toBe("Alice");
    expect(result.commits[0].authorEmail).toBe("alice@example.com");
    expect(result.commits[0].message).toBe("feat: add login page");
    expect(result.commits[0].files).toEqual([
      "src/pages/login.tsx",
      "src/components/button.tsx",
    ]);
    expect(result.commits[0].additions).toBe(4);
    expect(result.commits[0].deletions).toBe(1);

    // Verify time range
    expect(result.timeRange.since).toBeDefined();
    expect(result.timeRange.until).toBeDefined();
  });

  it("uses correct git log arguments for time window", async () => {
    mockExecFile.mockImplementation((_cmd, args, _opts, cb) => {
      expect(args).toContain("log");
      expect(args).toContain('--since="90 days ago"');
      expect(args).toContain("--numstat");
      if (cb) {
        cb(null, makeGitLogSample(), "");
      }
      return undefined as never;
    });

    await parseGitLog(defaultInput);
  });

  it("handles empty git log (no commits in window)", async () => {
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      if (cb) {
        cb(null, "", "");
      }
      return undefined as never;
    });

    const result = await parseGitLog(defaultInput);
    expect(result.totalCommits).toBe(0);
    expect(result.commits).toHaveLength(0);
  });

  it("handles commits with no file changes", async () => {
    const logWithoutFiles = [
      "abc1234||Alice||alice@example.com||2026-06-20 10:30:00 +0800||merge branch",
      "",
    ].join("\n");

    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      if (cb) {
        cb(null, logWithoutFiles, "");
      }
      return undefined as never;
    });

    const result = await parseGitLog(defaultInput);
    expect(result.commits[0].files).toHaveLength(0);
    expect(result.commits[0].additions).toBe(0);
    expect(result.commits[0].deletions).toBe(0);
  });

  it("maps exec error to INTERNAL_ERROR", async () => {
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      const err = Object.assign(new Error("fatal: not a git repository"), {
        code: 128,
        cmd: "git log",
      });
      if (cb) {
        cb(err, "", "fatal: not a git repository");
      }
      return undefined as never;
    });

    await expect(parseGitLog(defaultInput)).rejects.toMatchObject({
      errorCode: "INTERNAL_ERROR",
    });
  });
});
