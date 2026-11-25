/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, type ExceptionOptions } from "@noldova/context.exceptions";

/**
 * What a project produces, from its `.ctxp` `kind`.
 */
export declare enum ProjectKind {
  /**
   * A package other projects use.
   */
  Library = "library",

  /**
   * An app, which the SDK's `run` builds and starts.
   */
  Executable = "executable"
}

/**
 * Raised when `ctx` can't do what it was asked; every failure of this package extends it, and
 * `CommandHost.runAsync` writes its message and returns 1.
 */
export declare class CommandHostException extends Exception {
  /**
   * Initializes the exception.
   *
   * @param message What failed, normally a `Resources` message.
   * @param options Optional options carrying the cause.
   */
  public constructor(message: string, options?: ExceptionOptions);
}

/**
 * Raised when the project file is missing, ambiguous, unreadable or invalid, or `--project`
 * has no file.
 */
export declare class ProjectFileException extends CommandHostException {
  /**
   * The project file, or the folder searched for one.
   */
  public readonly path: string;

  /**
   * Initializes the exception.
   *
   * @param path The project file, or the folder searched for one.
   * @param message What failed, normally a `Resources` message.
   * @param options Optional options carrying the cause, such as the JSON error.
   */
  public constructor(path: string, message: string, options?: ExceptionOptions);
}

/**
 * Raised when a provider the project names is not installed, fails to load, or offers no
 * command.
 */
export declare class ProviderException extends CommandHostException {
  /**
   * The provider's identity, such as `noldova.context.sdk`.
   */
  public readonly identity: string;

  /**
   * Initializes the exception.
   *
   * @param identity The provider's identity.
   * @param message What failed, normally a `Resources` message.
   * @param options Optional options carrying the cause, such as the load error.
   */
  public constructor(identity: string, message: string, options?: ExceptionOptions);
}

/**
 * Raised when two providers offer a command of the same name.
 */
export declare class CommandCollisionException extends CommandHostException {
  /**
   * The command's name.
   */
  public readonly commandName: string;

  /**
   * The provider that offered it first: the SDK, or a tool earlier in `tools`.
   */
  public readonly firstProvider: string;

  /**
   * The provider that offered it again.
   */
  public readonly secondProvider: string;

  /**
   * Initializes the exception. The message names the command and both providers.
   *
   * @param commandName The command's name.
   * @param firstProvider The provider that offered it first.
   * @param secondProvider The provider that offered it again.
   */
  public constructor(commandName: string, firstProvider: string, secondProvider: string);
}

/**
 * Raised when no provider of the project offers the command asked for.
 */
export declare class CommandUnknownException extends CommandHostException {
  /**
   * The command asked for.
   */
  public readonly commandName: string;

  /**
   * Initializes the exception. The message names the command and points at `ctx --help`.
   *
   * @param commandName The command asked for.
   */
  public constructor(commandName: string);
}

/**
 * Where a command writes what it reports.
 */
export declare abstract class CommandOutput {
  /**
   * Writes one line of normal output.
   *
   * @param text The line, without its line break.
   */
  public abstract writeLine(text: string): void;

  /**
   * Writes one line of error output.
   *
   * @param text The line, without its line break.
   */
  public abstract writeErrorLine(text: string): void;
}

/**
 * The process's standard output and standard error.
 */
export declare class ConsoleOutput extends CommandOutput {
  /**
   * Writes the line to standard output.
   *
   * @param text The line, without its line break.
   */
  public override writeLine(text: string): void;

  /**
   * Writes the line to standard error.
   *
   * @param text The line, without its line break.
   */
  public override writeErrorLine(text: string): void;
}

/**
 * Where an executable starts: the source and class whose static `main` the SDK's `run` calls,
 * from the `.ctxp` `entry`.
 */
export declare class ProjectEntryPoint {
  /**
   * The entry point's source, relative to the project file, such as `main.ts`, the default.
   */
  public readonly source: string;

  /**
   * The class whose static `main` starts the app, or `undefined` when the module's one class
   * with a static `main` is used.
   */
  public readonly className: string | undefined;

  private constructor();
}

/**
 * A project file (`.ctxp`), as `ctx` reads it.
 *
 * @remarks
 * `sdk` names the one SDK, `noldova.context.sdk` when left out, and `tools` the other
 * providers, none when left out. Each is a package identity such as `noldova.context.sdk`,
 * installed for the project as its npm package, such as `@noldova/context.sdk`.
 */
export declare class Project {
  /**
   * The project's identity, from `name`.
   */
  public readonly name: string;

  /**
   * What the project produces, from `kind`.
   */
  public readonly kind: ProjectKind;

  /**
   * The SDK's identity.
   */
  public readonly sdk: string;

  /**
   * The other providers' identities, in their `.ctxp` order.
   */
  public readonly tools: readonly string[];

  /**
   * The executable's entry point, the default one when `entry` is left out; `undefined` for a
   * library.
   */
  public readonly entryPoint: ProjectEntryPoint | undefined;

  /**
   * The project file's full path.
   */
  public readonly manifestPath: string;

  /**
   * The folder that holds the project file.
   */
  public readonly directory: string;

  /**
   * The SDK, then the tools: every provider whose commands the project uses.
   */
  public get providers(): readonly string[];

  private constructor();

  /**
   * Reads a project file's text.
   *
   * @param text The file's JSON text.
   * @param manifestPath The file's full path, which failures name.
   * @param directory The folder that holds the file.
   * @returns The project.
   * @throws ProjectFileException when the text is not JSON, a field is missing or of the wrong
   * type, `kind` is not `library` or `executable`, `sdk` or a tool is not a package identity, a
   * tool is repeated or names the SDK, or `entry.source` is not a `.ts` source.
   * @example
   *   const project = Project.parse('{ "name": "noldova.context.app", "kind": "executable" }', "/app/app.ctxp", "/app");
   *   project.sdk; // "noldova.context.sdk"
   */
  public static parse(text: string, manifestPath: string, directory: string): Project;
}

/**
 * What a command is given when it runs.
 */
export declare class CommandContext {
  /**
   * The project the command runs for.
   */
  public readonly project: Project;

  /**
   * The arguments after the command's name, without `--project` and its file.
   */
  public readonly arguments: readonly string[];

  /**
   * Where the command writes what it reports.
   */
  public readonly output: CommandOutput;

  /**
   * Initializes the context.
   *
   * @param project The project the command runs for.
   * @param arguments_ The arguments after the command's name.
   * @param output Where the command writes what it reports.
   */
  public constructor(project: Project, arguments_: readonly string[], output: CommandOutput);
}

/**
 * A command `ctx` runs, such as the SDK's `build` or `run`.
 *
 * @remarks
 * A provider is a package whose public API exports classes that extend `Command`, each with a
 * constructor that takes no arguments; `ctx` makes one of each when it loads the provider.
 * @example
 *   export class HelloCommand extends Command {
 *     public override readonly name = "hello";
 *     public override readonly description = "Says hello.";
 *
 *     public override async runAsync(context: CommandContext): Promise<number> {
 *       context.output.writeLine(`Hello from ${context.project.name}.`);
 *       return 0;
 *     }
 *   }
 */
export declare abstract class Command {
  /**
   * The name it is run by, such as `build`.
   */
  public abstract readonly name: string;

  /**
   * One line that `ctx --help` shows beside the name.
   */
  public abstract readonly description: string;

  /**
   * Runs the command.
   *
   * @param context The project, the arguments and the output.
   * @returns The exit code, 0 when it succeeded.
   */
  public abstract runAsync(context: CommandContext): Promise<number>;
}

/**
 * The `ctx` command host: it reads the project file, loads the providers it names and runs the
 * command asked for.
 *
 * @remarks
 * The host has no command of its own: every command, and `ctx --help` in a project's folder,
 * loads the SDK and the tools, and two of them offering the same command is an error. The
 * project file is the one `--project` names, or the one `.ctxp` in the folder; none or several
 * is an error; with none, `ctx --help` lists no command.
 */
export declare class CommandHost {
  /**
   * Initializes the host.
   *
   * @param output Where the host and its commands write.
   */
  public constructor(output: CommandOutput);

  /**
   * Runs `ctx` with its arguments.
   *
   * @param arguments_ The arguments after `ctx`, such as `["run", "--", "--port", "80"]`; none,
   * `-h` or `--help` list the project's commands.
   * @param directory The folder `ctx` runs in, where the project file is looked for.
   * @returns The command's exit code; 1 when a `CommandHostException` was raised, whose message
   * goes to the error output.
   * @throws Whatever a command throws other than a `CommandHostException`.
   * @example
   *   const exitCode = await new CommandHost(new ConsoleOutput()).runAsync(["--help"], "/app");
   */
  public runAsync(arguments_: readonly string[], directory: string): Promise<number>;
}
