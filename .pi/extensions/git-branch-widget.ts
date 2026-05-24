import { execFile } from "node:child_process";
import { watch } from "node:fs";
import type { FSWatcher } from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const execFileAsync = promisify(execFile);

const widgetKey = "git-branch-widget";
const pinkBackground = "\x1b[48;2;255;105;180m";
const blackForeground = "\x1b[38;2;0;0;0m";
const reset = "\x1b[0m";

export default function (pi: ExtensionAPI) {
	let branchName = "unknown";
	let watcher: FSWatcher | undefined;
	let refreshTimer: ReturnType<typeof setTimeout> | undefined;
	let requestRender: (() => void) | undefined;

	async function git(args: string[], cwd: string): Promise<string> {
		const { stdout } = await execFileAsync("git", ["-C", cwd, ...args], { windowsHide: true });
		return String(stdout).trim();
	}

	async function readBranch(cwd: string): Promise<string> {
		try {
			const branch = await git(["branch", "--show-current"], cwd);
			if (branch) {
				return branch;
			}

			const shortSha = await git(["rev-parse", "--short", "HEAD"], cwd);
			return shortSha ? `detached:${shortSha}` : "detached";
		} catch {
			return "not a git repo";
		}
	}

	async function readHeadPath(cwd: string): Promise<string | undefined> {
		try {
			const gitDir = await git(["rev-parse", "--git-dir"], cwd);
			return path.join(path.isAbsolute(gitDir) ? gitDir : path.resolve(cwd, gitDir), "HEAD");
		} catch {
			return undefined;
		}
	}

	function truncatePlain(value: string, width: number): string {
		const chars = Array.from(value);
		return chars.length > width ? chars.slice(0, width).join("") : value;
	}

	function renderLine(width: number): string[] {
		if (width <= 0) {
			return [""];
		}

		const text = ` Git branch [${branchName}] `;
		const clipped = truncatePlain(text, width);
		const padded = clipped + " ".repeat(Math.max(0, width - Array.from(clipped).length));
		return [`${pinkBackground}${blackForeground}${padded}${reset}`];
	}

	function scheduleRefresh(cwd: string): void {
		if (refreshTimer) {
			clearTimeout(refreshTimer);
		}

		refreshTimer = setTimeout(() => {
			refreshTimer = undefined;
			void readBranch(cwd).then((nextBranch) => {
				if (nextBranch === branchName) {
					return;
				}

				branchName = nextBranch;
				requestRender?.();
			});
		}, 50);
	}

	function stopWatcher(): void {
		if (refreshTimer) {
			clearTimeout(refreshTimer);
			refreshTimer = undefined;
		}

		watcher?.close();
		watcher = undefined;
	}

	pi.on("session_start", async (_event, ctx) => {
		stopWatcher();
		branchName = await readBranch(ctx.cwd);

		if (ctx.hasUI) {
			ctx.ui.setWidget(
				widgetKey,
				(tui) => {
					requestRender = () => tui.requestRender();
					return {
						render: renderLine,
						invalidate() {},
						dispose() {
							requestRender = undefined;
						},
					};
				},
				{ placement: "aboveEditor" },
			);
		}

		const headPath = await readHeadPath(ctx.cwd);
		if (!headPath) {
			return;
		}

		try {
			watcher = watch(headPath, { persistent: false }, () => scheduleRefresh(ctx.cwd));
		} catch {
			// Ignore watcher failures; the widget still shows the initial branch.
		}
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		stopWatcher();
		if (ctx.hasUI) {
			ctx.ui.setWidget(widgetKey, undefined);
		}
	});
}
