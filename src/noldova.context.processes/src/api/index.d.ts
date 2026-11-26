/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";
import { Exception, type ExceptionOptions } from "@noldova/context.exceptions";

/**
 * Raised when processes can't be listed or ended: on a system other than Linux, macOS or
 * Windows, when the process lister ends before it answers, or when it answers a line that is not
 * a process.
 */
export declare class ProcessesException extends Exception {
  /**
   * Initializes the exception.
   *
   * @param message What failed, normally a `Resources` message.
   * @param options Optional options carrying the cause.
   */
  public constructor(message: string, options?: ExceptionOptions);
}

/**
 * Raised when a process tree still has processes when its limit passes.
 */
export declare class ProcessTreeEndException extends ProcessesException {
  /**
   * The processes still listed when the limit passed, each ended once more just before the
   * exception.
   */
  public readonly survivors: IReadOnlyList<ProcessIdentity>;

  /**
   * Initializes the exception. The message counts and names the survivors and gives the limit.
   *
   * @param survivors The processes still listed when the limit passed.
   * @param limitMilliseconds The limit that passed.
   */
  public constructor(survivors: IReadOnlyList<ProcessIdentity>, limitMilliseconds: number);
}

/**
 * A process, told apart from any later process with the same id by the time it started.
 *
 * @remarks
 * An operating system reuses a process id once its process has ended, so an id alone can name
 * another process later. Read an identity with `readAsync` while you own the process, such as
 * right after starting it, and pass it to `ProcessTree.endAsync`.
 * The start time is in milliseconds since the epoch: to the millisecond on Windows, and to the
 * second on Linux and macOS, as `ps` reports it.
 */
export declare class ProcessIdentity {
  /**
   * The process id.
   */
  public readonly processId: number;

  /**
   * When the process started, in milliseconds since the epoch.
   */
  public readonly startTime: number;

  /**
   * Initializes the identity.
   *
   * @param processId The process id, a positive integer.
   * @param startTime When the process started, in milliseconds since the epoch, as `readAsync`
   * reads it.
   * @throws ArgumentOutOfRangeException When the id is not a positive integer or the start time is
   * not an integer from 0.
   */
  public constructor(processId: number, startTime: number);

  /**
   * Reads the identity of a running process.
   *
   * @param processId The process id, a positive integer.
   * @returns The identity, or `undefined` when no process has the id or it has ended and waits
   * for its parent to collect it.
   * @throws ArgumentOutOfRangeException When the id is not a positive integer.
   * @throws ProcessesException When processes can't be listed on this system, or the process lister
   * answers a line that is not a process.
   * @example
   * ```ts
   * import { spawn } from "node:child_process";
   *
   * import { ProcessIdentity } from "@noldova/context.processes";
   *
   * const child = spawn(process.execPath, ["server.js"], { detached: true });
   * const identity = await ProcessIdentity.readAsync(child.pid ?? 0);
   * ```
   */
  public static readAsync(processId: number): Promise<ProcessIdentity | undefined>;
}

/**
 * A process as `Processes.listAsync` lists it.
 *
 * @remarks
 * The start time is in the units of `ProcessIdentity.startTime`, so `identity` can be passed to
 * `ProcessTree.endAsync`. Construct an entry to stand in for a listed process, such as in a test.
 */
export declare class ProcessEntry {
  /**
   * The process id.
   */
  public readonly processId: number;

  /**
   * The id of the process's parent, or 0 when it has none.
   */
  public readonly parentId: number;

  /**
   * The id of the process's group on Linux and macOS, or `null` on Windows, which has no groups.
   */
  public readonly groupId: number | null;

  /**
   * Whether the process has ended and waits for its parent to collect it.
   */
  public readonly isZombie: boolean;

  /**
   * When the process started, in milliseconds since the epoch.
   */
  public readonly startTime: number;

  /**
   * Initializes the entry.
   *
   * @param processId The process id, an integer from 0.
   * @param parentId The parent's id, an integer from 0.
   * @param groupId The group's id, an integer from 0, or `null` on Windows.
   * @param isZombie Whether the process has ended and waits for its parent to collect it.
   * @param startTime When the process started, in milliseconds since the epoch, an integer from 0.
   * @throws ArgumentOutOfRangeException When an id or the start time is not an integer from 0.
   */
  public constructor(processId: number, parentId: number, groupId: number | null, isZombie: boolean, startTime: number);

  /**
   * The process's identity, for `ProcessTree.endAsync`.
   *
   * @throws ArgumentOutOfRangeException When the process id is 0, which no listed process has.
   */
  public get identity(): ProcessIdentity;
}

/**
 * How `ProcessTree.endAsync` and `ProcessTree.endDescendantsAsync` end a tree.
 */
export declare class ProcessTreeEndOptions {
  /**
   * How long the tree's processes may take to end after a polite request, in milliseconds;
   * `0`, the default, ends them at once.
   */
  public readonly graceMilliseconds: number;

  /**
   * How long the end may take once the process lister is ready, in milliseconds; `10000` by
   * default. The first end in a process first waits up to 60 seconds for its lister to start.
   */
  public readonly limitMilliseconds: number;

  /**
   * Initializes the options.
   *
   * @param graceMilliseconds How long the processes may take to end after a polite request; `0`
   * by default.
   * @param limitMilliseconds How long the end may take once the process lister is ready; `10000`
   * by default.
   * @throws ArgumentOutOfRangeException When either is not an integer from 0.
   */
  public constructor(graceMilliseconds?: number, limitMilliseconds?: number);
}

/**
 * Ends a process and every process it started, or only the processes it started, and returns
 * only once they are gone.
 *
 * @remarks
 * The tree is the root, every process whose parent is in the tree and that started no earlier
 * than its parent, and, on Linux and macOS, every process in the process group the root leads
 * that started no earlier than the root. A process that left the group with `setsid` is still
 * found through its parent while its parent lives, and a process whose parent ended is still
 * found through the group while it stays in it; start the root with `detached: true` so it leads
 * a group of its own. A process that both left the group and lost its parent before the call
 * can't be found. A process is a member's child only when no process listed took the member's id
 * between the two starts, so a member's id passed to another process doesn't bring in that
 * process's children.
 *
 * The processes are listed through one lister process, started on the first call and kept for
 * the rest of the process's life; it may take up to 60 seconds to start, and the call's limit
 * starts once it is ready.
 *
 * On Linux and macOS each process is stopped with `SIGSTOP` before it is ended, and the tree is
 * listed again until no new process appears, at most ten times, so no process starts or leaves
 * between the listing and the end. With a grace, the processes get `SIGTERM` and `SIGCONT` and
 * the grace to end; whatever is left gets `SIGKILL`. Windows can't stop a process and has no
 * polite request, so there the tree is listed once more before the end, the grace is only waited
 * out, and each process is ended with `TerminateProcess`.
 * A process is signalled only when the round's listing shows it with its identity; on Linux and
 * macOS it is stopped by then, so its id can't pass to another process before the signal.
 *
 * After ending, the tree is listed every 50 ms until none of its processes is listed; a process
 * that has ended and waits for its parent to collect it counts as gone. Each round ends again
 * whatever is still listed.
 */
export declare class ProcessTree {
  private constructor();

  /**
   * Ends a process tree and waits until it is gone.
   *
   * @param root The identity of the tree's root, read while the caller owned the process.
   * @param options How to end the tree; no grace and a 10-second limit by default.
   * @returns The tree's processes, all gone; empty when another process now has the root's id,
   * so nothing was ended.
   * @throws ProcessTreeEndException When processes of the tree are still listed when the limit
   * passes.
   * @throws ProcessesException When processes can't be listed on this system, the process lister
   * is not ready within 60 seconds, ends before it answers, which it does when it takes 5 seconds
   * past the limit, or answers a line that is not a process.
   * @example
   * ```ts
   * import { spawn } from "node:child_process";
   *
   * import "@noldova/context.core";
   * import { ProcessIdentity, ProcessTree, ProcessTreeEndOptions } from "@noldova/context.processes";
   *
   * const child = spawn(process.execPath, ["server.js"], { detached: true });
   * const identity = await ProcessIdentity.readAsync(child.pid ?? 0);
   * if (!Object.isUndefined(identity))
   *   await ProcessTree.endAsync(identity, new ProcessTreeEndOptions(2000));
   * ```
   */
  public static endAsync(root: ProcessIdentity, options?: ProcessTreeEndOptions): Promise<IReadOnlyList<ProcessIdentity>>;

  /**
   * Ends every process a process started, and waits until they are gone, leaving the process
   * itself running; a process ends the processes it left this way with its own identity.
   *
   * @param root The identity of the tree's root, which is never signalled.
   * @param options How to end the root's descendants; no grace and a 10-second limit by default.
   * @returns The root's descendants, all gone; empty when the root has none, or when another
   * process now has the root's id, so nothing was ended.
   * @throws ProcessTreeEndException When descendants of the root are still listed when the limit
   * passes.
   * @throws ProcessesException When processes can't be listed on this system, the process lister
   * is not ready within 60 seconds, ends before it answers, which it does when it takes 5 seconds
   * past the limit, or answers a line that is not a process.
   * @example
   * ```ts
   * import "@noldova/context.core";
   * import { ProcessIdentity, ProcessTree } from "@noldova/context.processes";
   *
   * const identity = await ProcessIdentity.readAsync(process.pid);
   * if (!Object.isUndefined(identity))
   *   await ProcessTree.endDescendantsAsync(identity);
   * ```
   */
  public static endDescendantsAsync(root: ProcessIdentity, options?: ProcessTreeEndOptions): Promise<IReadOnlyList<ProcessIdentity>>;
}

/**
 * Lists the machine's processes.
 *
 * @remarks
 * The listing goes through the same kept lister process as `ProcessTree`, so a call after the
 * first is cheap and can be repeated to poll. It is read within 10 seconds once the lister is
 * ready. Id 0, which Windows and macOS give to the system's idle or kernel task, isn't listed.
 */
export declare class Processes {
  /**
   * Lists every process on the machine, other than the lister itself.
   *
   * @returns The processes, in the order the system reports them.
   * @throws ProcessesException When processes can't be listed on this system, the process lister
   * is not ready within its limit, ends before it answers, or answers a line that is not a
   * process.
   * @example
   * ```ts
   * import { Processes, ProcessTree } from "@noldova/context.processes";
   *
   * const processes = await Processes.listAsync();
   * const children = processes.where(t => t.parentId === process.pid && !t.isZombie);
   * for (const child of children)
   *   await ProcessTree.endAsync(child.identity);
   * ```
   */
  public static listAsync(): Promise<IReadOnlyList<ProcessEntry>>;
}
