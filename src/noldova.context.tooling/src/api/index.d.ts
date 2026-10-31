/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Reports a failure the command that met it explains in its message, such as a
 * release check that found an archive missing. An entry point prints the message
 * and exits with code 1 instead of printing a stack.
 *
 * @example
 * ```ts
 * import { CommandFailedException } from "@noldova/context.tooling";
 *
 * new CommandFailedException("The version is not of the form 0.0.<n>.").message; // "The version is not of the form 0.0.<n>."
 * ```
 */
export declare class CommandFailedException extends Error { }

/**
 * The host operations a release runs through: environment variables, git and
 * npm, HTTP requests, the log, and the clock. The repository's release entry
 * point supplies the process's own; tests supply fakes.
 */
export declare interface IReleaseHost {
  /**
   * The environment variables the release reads, such as `RELEASE_REGISTRY_URL`.
   */
  readonly environment: Readonly<Record<string, string | undefined>>;

  /**
   * Runs git with the arguments in the working directory and returns its exit
   * code and output, whatever the exit code.
   *
   * @param arguments_ The git arguments, without the command.
   */
  readGitAsync(arguments_: readonly string[]): Promise<ProcessResult>;

  /**
   * Runs npm with the arguments in the working directory and returns its exit
   * code and output, whatever the exit code.
   *
   * @param arguments_ The npm arguments, without the command.
   */
  readNPMAsync(arguments_: readonly string[]): Promise<ProcessResult>;

  /**
   * Runs npm with the arguments in the working directory.
   *
   * @param arguments_ The npm arguments, without the command.
   * @throws {CommandFailedException} If npm ends with an exit code other than 0;
   * the message holds its output.
   */
  runNPMAsync(arguments_: readonly string[]): Promise<void>;

  /**
   * Sends an HTTP request, as `fetch` does.
   *
   * @param address The absolute URL.
   * @param init The method, headers and body.
   */
  requestAsync(address: string, init: RequestInit): Promise<Response>;

  /**
   * Writes one line to the release's log.
   *
   * @param message The line, without a line terminator.
   */
  writeLogAsync(message: string): Promise<void>;

  /**
   * Returns the current time in milliseconds, as `Date.now` does.
   */
  now(): number;

  /**
   * Resolves after the given time.
   *
   * @param milliseconds The time to wait.
   */
  delayAsync(milliseconds: number): Promise<void>;
}

/**
 * One package the repository builds: its folder name, its path under `src`,
 * its npm name, and whether the release publishes it.
 *
 * @example
 * ```ts
 * import { PackageInfo } from "@noldova/context.tooling";
 *
 * const packageInfo = new PackageInfo("noldova.context.json", "noldova.context.json", "@noldova/context.json", true);
 * packageInfo.archiveName("0.0.3"); // "noldova-context.json-0.0.3.tgz"
 * ```
 */
export declare class PackageInfo {
  /**
   * The package's folder name, such as `noldova.context.json`.
   */
  public readonly name: string;

  /**
   * The package's path under `src`, such as `parsers/noldova.context.parsers`.
   */
  public readonly path: string;

  /**
   * The package's npm name, such as `@noldova/context.json`.
   */
  public readonly packageName: string;

  /**
   * Whether the release publishes the package. A package that is not published
   * is still built, installed, tested and covered; the release leaves its
   * archive out.
   */
  public readonly isPublished: boolean;

  /**
   * Creates the description of one package.
   *
   * @param name The package's folder name.
   * @param path The package's path under `src`.
   * @param packageName The package's npm name.
   * @param isPublished Whether the release publishes the package.
   */
  public constructor(name: string, path: string, packageName: string, isPublished: boolean);

  /**
   * Returns the file name `npm pack` gives the package's archive at a version.
   *
   * @param version The version, such as `0.0.3`.
   * @returns The npm name without its `@`, with `-` for its `/`, then `-<version>.tgz`.
   */
  public archiveName(version: string): string;
}

/**
 * The exit code and output of a finished process.
 *
 * @example
 * ```ts
 * import { ProcessResult } from "@noldova/context.tooling";
 *
 * new ProcessResult(0, "output", "").isSuccessful; // true
 * new ProcessResult(null, "", "killed").isSuccessful; // false: the process ended by a signal.
 * ```
 */
export declare class ProcessResult {
  /**
   * The exit code, or `null` when the process ended by a signal.
   */
  public readonly exitCode: number | null;

  /**
   * Everything the process wrote to its standard output.
   */
  public readonly output: string;

  /**
   * Everything the process wrote to its standard error.
   */
  public readonly errorOutput: string;

  /**
   * Creates the result of a finished process.
   *
   * @param exitCode The exit code, or `null` when the process ended by a signal.
   * @param output The standard output.
   * @param errorOutput The standard error.
   */
  public constructor(exitCode: number | null, output: string, errorOutput: string);

  /**
   * Whether the process ended with exit code 0.
   */
  public get isSuccessful(): boolean;
}

/**
 * One package's archive in the folder the release publishes from.
 */
export declare class ReleaseArchive {
  /**
   * The package the archive holds.
   */
  public readonly packageInfo: PackageInfo;

  /**
   * The archive's absolute path.
   */
  public readonly filePath: string;

  /**
   * Pairs a package with its archive.
   *
   * @param packageInfo The package.
   * @param filePath The archive's absolute path.
   */
  public constructor(packageInfo: PackageInfo, filePath: string);
}

/**
 * Reads one file from a gzipped tar archive, such as the one `npm pack` writes,
 * without unpacking it. It reads names from the header, its prefix field, or a
 * preceding extended header's `path` record.
 *
 * @example
 * ```ts
 * import { ArchiveReader } from "@noldova/context.tooling";
 *
 * const manifest = await new ArchiveReader().readFileAsync("noldova-context.json-0.0.3.tgz", "package/package.json");
 * manifest?.toString("utf8"); // The packed package.json, or undefined when the archive has none.
 * ```
 */
export declare class ArchiveReader {
  /**
   * Returns the content of the first regular file whose name matches.
   *
   * @param archivePath The gzipped tar archive's path.
   * @param entryName The file's full name in the archive, such as `package/package.json`.
   * @returns A copy of the file's content, or `undefined` when no regular file has that name.
   * @throws {CommandFailedException} If the file is not gzip data, or an entry's
   * size is unreadable or runs past the end of the archive.
   */
  public readFileAsync(archivePath: string, entryName: string): Promise<Buffer | undefined>;
}

/**
 * Sends requests to GitHub's REST API through a release host, with the API's
 * media type, version and the token as a bearer.
 *
 * @example
 * ```ts
 * import { GitHubAPI, type IReleaseHost } from "@noldova/context.tooling";
 *
 * export async function readTagAsync(host: IReleaseHost, token: string): Promise<Response> {
 *   return await new GitHubAPI(host, "https://api.github.com", token).requestAsync("GET", "repos/owner/name/git/ref/tags/v0.0.3");
 * }
 * ```
 */
export declare class GitHubAPI {
  /**
   * Creates a client for one API address and token.
   *
   * @param host The host that sends the requests.
   * @param address The API's base address, without a trailing slash.
   * @param token The token sent as a bearer.
   */
  public constructor(host: IReleaseHost, address: string, token: string);

  /**
   * Sends one request and returns the response, whatever its status.
   *
   * @param method The HTTP method, such as `GET` or `POST`.
   * @param resource The resource path after the address, without a leading slash.
   * @param body The fields sent as a JSON body, or `undefined` for none.
   * @throws {CommandFailedException} If the request could not be sent; the
   * original error is its `cause`.
   */
  public requestAsync(method: string, resource: string, body?: Readonly<Record<string, string>>): Promise<Response>;
}

/**
 * Runs the steps of the organization's shared npm release workflow for the
 * repository's packages. Each step checks before it acts, and a failure throws a
 * {@link CommandFailedException} that says what is wrong.
 *
 * - `source <version> <commit>` checks that the commit is on main and that
 *   `scripts/config.ts` holds the version there.
 * - `check <folder> <version> <commit>` checks that the folder holds exactly the
 *   published packages' archives at the version, built from the commit; an
 *   unpublished package's archive may be there and is left out.
 * - `publish <folder> <version> <commit>` publishes the archives the registry
 *   doesn't hold yet, then waits until the registry serves each one with its
 *   archive's integrity, for up to {@link ReleaseService.publishedWaitMilliseconds}
 *   after the last publish. When a publish fails, the archives published before it
 *   are still confirmed, so a rerun skips them.
 * - `tag <version> <commit>` tags the commit as `v<version>` through GitHub's API.
 *
 * @example
 * ```ts
 * import { type IReleaseHost, PackageInfo, ReleaseService } from "@noldova/context.tooling";
 *
 * export async function publishAsync(host: IReleaseHost, commit: string): Promise<void> {
 *   const packagesInfo = [new PackageInfo("noldova.context.json", "noldova.context.json", "@noldova/context.json", true)];
 *   await new ReleaseService(host, packagesInfo).runAsync(["publish", "_packages", "0.0.3", commit]);
 * }
 * ```
 */
export declare class ReleaseService {
  /**
   * How long after the last publish the release waits for the registry to serve
   * every published version: 600,000 milliseconds.
   */
  public static readonly publishedWaitMilliseconds: number;

  /**
   * How long the release waits between two reads of a version the registry
   * doesn't serve yet: 10,000 milliseconds.
   */
  public static readonly publishedRetryMilliseconds: number;

  /**
   * Creates the release for a host and the repository's packages.
   *
   * @param host The host the release runs through.
   * @param packagesInfo Every package the repository builds, published or not.
   */
  public constructor(host: IReleaseHost, packagesInfo: readonly PackageInfo[]);

  /**
   * Runs one step.
   *
   * @param arguments_ The step's name and its values, as the entry point received them.
   * @throws {CommandFailedException} If the arguments name no step, or the step finds something wrong.
   */
  public runAsync(arguments_: readonly string[]): Promise<void>;
}
