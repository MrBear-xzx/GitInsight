import { cloneRepo, GitCloneInput } from "../src/services/git-clone.service";
import { execFile } from "node:child_process";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

jest.mock("node:child_process", () => ({
  execFile: jest.fn(),
}));

jest.mock("node:fs", () => ({
  ...jest.requireActual("node:fs"),
  mkdtempSync: jest.fn(),
  existsSync: jest.fn(),
  rmSync: jest.fn(),
}));

const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;
const mockMkdtempSync = mkdtempSync as jest.MockedFunction<typeof mkdtempSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockRmSync = rmSync as jest.MockedFunction<typeof rmSync>;

function makeExecError(
  message: string,
  code: number,
  stderr: string
): Error & { code: number; cmd: string } {
  return Object.assign(new Error(message), {
    code,
    cmd: "git clone ...",
  });
}

describe("cloneRepo", () => {
  const fakeTmpDir = join(tmpdir(), "gitinsight-test");
  const defaultInput: GitCloneInput = {
    repoUrl: "https://github.com/org/repo",
    timeWindow: "90d",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMkdtempSync.mockReturnValue(fakeTmpDir);
    mockExistsSync.mockReturnValue(false);
  });

  it("clones a public repo successfully", async () => {
    let callCount = 0;
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      callCount++;
      if (callCount === 1) {
        mockExistsSync.mockReturnValue(true);
        if (cb) {
          cb(null, "", "");
        }
        return undefined as never;
      }
      if (callCount === 2) {
        if (cb) {
          cb(null, "main\n", "");
        }
        return undefined as never;
      }
      if (cb) {
        cb(null, "42\n", "");
      }
      return undefined as never;
    });

    const result = await cloneRepo(defaultInput);

    expect(result.repoPath).toBe(fakeTmpDir);
    expect(result.commitCount).toBe(42);
    expect(result.branch).toBe("main");
    expect(mockMkdtempSync).toHaveBeenCalledWith(join(tmpdir(), "gitinsight-"));
    expect(mockExecFile).toHaveBeenCalledTimes(3);
  });

  it("embeds PAT in URL for private repos", async () => {
    const input: GitCloneInput = {
      ...defaultInput,
      pat: "ghp_abc123secret",
    };

    let callCount = 0;
    mockExecFile.mockImplementation((_cmd, args, _opts, cb) => {
      callCount++;
      if (callCount === 1) {
        expect(
          (args ?? []).some((a: string) =>
            a.includes("x-access-token:ghp_abc123secret")
          )
        ).toBe(true);
        mockExistsSync.mockReturnValue(true);
        if (cb) {
          cb(null, "", "");
        }
        return undefined as never;
      }
      if (callCount === 2) {
        if (cb) {
          cb(null, "main\n", "");
        }
        return undefined as never;
      }
      if (cb) {
        cb(null, "15\n", "");
      }
      return undefined as never;
    });

    const result = await cloneRepo(input);
    expect(result.repoPath).toBe(fakeTmpDir);
  });

  it("maps REPO_NOT_FOUND on not found error", async () => {
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      if (cb) {
        cb(
          makeExecError(
            "fatal: repository not found",
            128,
            "repository not found"
          ),
          "",
          "repository not found"
        );
      }
      return undefined as never;
    });

    await expect(cloneRepo(defaultInput)).rejects.toMatchObject({
      errorCode: "REPO_NOT_FOUND",
    });
  });

  it("maps CLONE_FAILED on generic git error", async () => {
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      if (cb) {
        cb(
          makeExecError("fatal: some other error", 128, "some other error"),
          "",
          "some other error"
        );
      }
      return undefined as never;
    });

    await expect(cloneRepo(defaultInput)).rejects.toMatchObject({
      errorCode: "CLONE_FAILED",
    });
  });

  it("maps AUTH_INVALID_PAT on authentication failure", async () => {
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      if (cb) {
        cb(
          makeExecError("Authentication failed", 128, "Authentication failed"),
          "",
          "Authentication failed"
        );
      }
      return undefined as never;
    });

    await expect(
      cloneRepo({ ...defaultInput, pat: "ghp_bad" })
    ).rejects.toMatchObject({
      errorCode: "AUTH_INVALID_PAT",
    });
  });

  it("maps GITHUB_RATE_LIMITED on rate limit", async () => {
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      if (cb) {
        cb(
          Object.assign(new Error("rate limit exceeded"), {stderr: "rate limit exceeded"}),
          "",
          "rate limit exceeded"
        );
      }
      return undefined as never;
    });

    await expect(cloneRepo(defaultInput)).rejects.toMatchObject({
      errorCode: "GITHUB_RATE_LIMITED",
    });
  });

  it("cleans up temp dir on clone failure", async () => {
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      if (cb) {
        cb(
          makeExecError(
            "fatal: repository not found",
            128,
            "repository not found"
          ),
          "",
          "repository not found"
        );
      }
      return undefined as never;
    });

    mockExistsSync.mockReturnValue(true);

    await expect(cloneRepo(defaultInput)).rejects.toMatchObject({
      errorCode: "REPO_NOT_FOUND",
    });
    expect(mockRmSync).toHaveBeenCalledWith(fakeTmpDir, {
      recursive: true,
      force: true,
    });
  });

  it("applies depth=1000 for 30d window", async () => {
    let callCount = 0;
    mockExecFile.mockImplementation((_cmd, args, _opts, cb) => {
      callCount++;
      if (callCount === 1) {
        expect(args).toContain("--depth");
        expect(args).toContain("1000");
        mockExistsSync.mockReturnValue(true);
        if (cb) {
          cb(null, "", "");
        }
        return undefined as never;
      }
      if (callCount === 2) {
        if (cb) {
          cb(null, "main\n", "");
        }
        return undefined as never;
      }
      if (cb) {
        cb(null, "10\n", "");
      }
      return undefined as never;
    });

    await cloneRepo({ ...defaultInput, timeWindow: "30d" });
  });
});
