/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command, CommandHostException, type CommandContext } from "@noldova/context";
import type { ExceptionOptions } from "@noldova/context.exceptions";

/**
 * Raised when the SDK can't do what it was asked, such as when a project has
 * no `tsconfig.json`, no TypeScript compiler installed or a project dependency
 * it refuses; `ctx` writes its message and returns 1.
 */
export declare class SDKException extends CommandHostException {
  /**
   * Initializes the exception.
   *
   * @param message What failed, normally a `Resources` message.
   * @param options Optional options carrying the cause.
   */
  public constructor(message: string, options?: ExceptionOptions);
}

/**
 * `ctx build`: builds the project and the projects it depends on, each with
 * the TypeScript compiler installed for it, `tsc` of the `typescript` package,
 * on the `tsconfig.json` beside its project file.
 *
 * @remarks
 * The projects it depends on are the `.ctxp` paths in `dependencies.projects`,
 * each relative to the project file that names it, with forward slashes. Each
 * builds before the projects that depend on it, in the order they are listed,
 * and the build stops at the first project that fails.
 *
 * Every argument goes to each compiler as given, such as `--noEmit`; `-h` or
 * `--help` shows the command's use instead. The compiler's output and errors
 * are written line by line as they come.
 */
export declare class BuildCommand extends Command {
  /**
   * `build`.
   */
  public override readonly name: string;

  /**
   * The line `ctx --help` shows for the command.
   */
  public override readonly description: string;

  /**
   * Builds the project and the projects it depends on.
   *
   * @param context The project file and the arguments after `build`.
   * @returns 0 when every project builds, 1 when a compiler reports a
   * failure.
   * @throws SDKException When a project has no `tsconfig.json` beside its
   * project file or no TypeScript compiler installed, or, before any build,
   * when a project dependency has no project file at its exact path, isn't a
   * relative `.ctxp` path with forward slashes, is listed twice, or is an
   * executable, when two projects have one name, or when the dependencies
   * form a cycle.
   * @throws ProjectFileException When a project file isn't one `ctx` can
   * read.
   */
  public override runAsync(context: CommandContext): Promise<number>;
}
