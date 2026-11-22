/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";

import CommandFailedException from "./command-failed.exception.ts";
import PostgreSQLStartFailedException from "./postgresql-start-failed.exception.ts";
import TarArchive from "./tar-archive.ts";

export default class PostgreSQLServer implements AsyncDisposable {
  public static readonly URL_VARIABLE: string = "NOLDOVA_CONTEXT_POSTGRESQL_URL";

  private static readonly VERSION: string = "18.6.1";
  private static readonly RELEASE_URL: string = "https://github.com/theseus-rs/postgresql-binaries/releases/download";
  private static readonly ARCHIVES: ReadonlyMap<string, string> = new Map([
    ["aarch64-apple-darwin", "89e91cc80650a43d22c018b95ca356a0c9e15838a1182fed2880bfb5d7d9c9a6"],
    ["aarch64-pc-windows-msvc", "29669a4e020f252d8ff7a59e5e5c4632901fcff0e5ee7793f8b011a0e2157f68"],
    ["aarch64-unknown-linux-gnu", "1ab47fa2f06ff70454309ad02e5d89c46488300d43977231481fd6b160b9d556"],
    ["x86_64-apple-darwin", "4229812543e19c91864ebdf5d8f78883c5816d51d4cc5d065298260c1f64d37e"],
    ["x86_64-pc-windows-msvc", "0c0c845626ed77c605d716051c9e8df3368d07fbbd9f61ea39a4c5c0536fde7e"],
    ["x86_64-unknown-linux-gnu", "e84b02dd8d0ce5879fb697330a789231c8b8f8d958dae3ad4d90fecc710b1315"]
  ]);
  private static readonly ARCHITECTURES: ReadonlyMap<string, string> = new Map([["arm64", "aarch64"], ["x64", "x86_64"]]);
  private static readonly PLATFORMS: ReadonlyMap<string, string> = new Map([
    ["darwin", "apple-darwin"],
    ["linux", "unknown-linux-gnu"],
    ["win32", "pc-windows-msvc"]
  ]);
  private static readonly CACHE_FOLDER: string = "_build/postgresql";
  private static readonly COMPLETE_MARKER: string = ".complete";
  private static readonly BIN_FOLDER: string = "bin";
  private static readonly WINDOWS_EXECUTABLE_SUFFIX: string = ".exe";
  private static readonly TEMPORARY_PREFIX: string = "context-postgresql-";
  private static readonly REMOVAL_RETRIES: number = 5;
  private static readonly RUNNER_TEMPORARY_VARIABLE: string = "RUNNER_TEMP";
  private static readonly DATA_FOLDER: string = "data";
  private static readonly LOG_FILE: string = "server.log";
  private static readonly CONFIGURATION_FILE: string = "postgresql.conf";
  private static readonly USER: string = "postgres";
  private static readonly HOST: string = "127.0.0.1";
  private static readonly HASH_ALGORITHM: string = "sha256";
  private static readonly HEX_ENCODING: "hex" = "hex";
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";
  private static readonly SETTINGS: readonly string[] = ["listen_addresses = '127.0.0.1'", "unix_socket_directories = ''", "fsync = off"];
  private static readonly PORT_SETTING: string = "port = ";
  private static readonly START_ATTEMPTS: number = 5;
  private static readonly BIND_FAILURE: string = "could not bind";
  private static readonly NEW_LINE: string = "\n";

  private readonly binFolder: string;
  private readonly temporaryFolder: string;
  private started: boolean = false;
  private port: number = 0;

  private constructor(binFolder: string, temporaryFolder: string) {
    this.binFolder = binFolder;
    this.temporaryFolder = temporaryFolder;
  }

  public get url(): string {
    return `postgres://${PostgreSQLServer.USER}@${PostgreSQLServer.HOST}:${this.port}/${PostgreSQLServer.USER}`;
  }

  public static async startAsync(): Promise<PostgreSQLServer> {
    const binFolder = await PostgreSQLServer.installAsync();
    const temporaryFolder = await fs.mkdtemp(path.join(process.env[PostgreSQLServer.RUNNER_TEMPORARY_VARIABLE] ?? os.tmpdir(), PostgreSQLServer.TEMPORARY_PREFIX));
    const server = new PostgreSQLServer(binFolder, temporaryFolder);
    try {
      await server.initializeAsync();
      return server;
    }
    catch (error) {
      try {
        await server[Symbol.asyncDispose]();
      }
      catch (stopError) {
        throw new PostgreSQLStartFailedException(PostgreSQLServer.startAndStopFailed(error, stopError), error, stopError);
      }
      throw error;
    }
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    const stopFailures: unknown[] = [];
    try {
      if (this.started)
        await this.runAsync("pg_ctl", ["-D", this.dataFolder, "-m", "fast", "-w", "stop"]);
    }
    catch (error) {
      stopFailures.push(error);
    }

    this.started = false;
    try {
      await fs.rm(this.temporaryFolder, { recursive: true, force: true, maxRetries: PostgreSQLServer.REMOVAL_RETRIES });
    }
    catch (error) {
      const messages = [...stopFailures.map(t => PostgreSQLServer.describe(t)), PostgreSQLServer.folderNotRemoved(this.temporaryFolder, error)];
      throw new CommandFailedException(messages.join(PostgreSQLServer.NEW_LINE));
    }

    if (stopFailures.length > 0)
      throw stopFailures[0];
  }

  private get dataFolder(): string {
    return path.join(this.temporaryFolder, PostgreSQLServer.DATA_FOLDER);
  }

  private async initializeAsync(): Promise<void> {
    await this.runAsync("initdb", ["-D", this.dataFolder, "-U", PostgreSQLServer.USER, "-A", "trust", "-E", "UTF8", "--no-locale"]);
    const settings = PostgreSQLServer.SETTINGS.join(PostgreSQLServer.NEW_LINE);
    await fs.appendFile(path.join(this.dataFolder, PostgreSQLServer.CONFIGURATION_FILE), PostgreSQLServer.NEW_LINE + settings + PostgreSQLServer.NEW_LINE);
    for (let attempt = 1; ; attempt += 1) {
      this.port = await PostgreSQLServer.findFreePortAsync();
      await fs.writeFile(this.logFile, "");
      await fs.appendFile(path.join(this.dataFolder, PostgreSQLServer.CONFIGURATION_FILE), PostgreSQLServer.PORT_SETTING + this.port + PostgreSQLServer.NEW_LINE);
      this.started = true;
      try {
        await this.runAsync("pg_ctl", ["-D", this.dataFolder, "-l", this.logFile, "-w", "-t", "120", "start"]);
        return;
      }
      catch (error) {
        const log = await fs.readFile(this.logFile, PostgreSQLServer.TEXT_ENCODING);
        if (attempt === PostgreSQLServer.START_ATTEMPTS || !log.includes(PostgreSQLServer.BIND_FAILURE))
          throw error;

        this.started = false;
      }
    }
  }

  private get logFile(): string {
    return path.join(this.temporaryFolder, PostgreSQLServer.LOG_FILE);
  }

  private async runAsync(name: string, arguments_: readonly string[]): Promise<void> {
    const command = this.tool(name);
    const code = await new Promise<number | null>((resolve, reject) => {
      const child = spawn(command, arguments_, { cwd: this.temporaryFolder, stdio: ["ignore", "ignore", "inherit"], shell: false, windowsHide: true });
      child.on("exit", t => { resolve(t); });
      child.on("error", reject);
    });
    if (code !== 0) {
      const log = await PostgreSQLServer.existsAsync(this.logFile) ? await fs.readFile(this.logFile, PostgreSQLServer.TEXT_ENCODING) : "";
      throw new CommandFailedException(PostgreSQLServer.commandFailed(command, code, log));
    }
  }

  private tool(name: string): string {
    return path.join(this.binFolder, process.platform === "win32" ? name + PostgreSQLServer.WINDOWS_EXECUTABLE_SUFFIX : name);
  }

  private static async installAsync(): Promise<string> {
    const target = PostgreSQLServer.target();
    const hash = PostgreSQLServer.ARCHIVES.get(target);
    if (hash === undefined)
      throw new CommandFailedException(PostgreSQLServer.unsupportedTarget(target));

    const folder = path.resolve(PostgreSQLServer.CACHE_FOLDER, PostgreSQLServer.VERSION, target);
    if (!await PostgreSQLServer.existsAsync(path.join(folder, PostgreSQLServer.COMPLETE_MARKER))) {
      await fs.rm(folder, { recursive: true, force: true });
      await fs.mkdir(folder, { recursive: true });
      await TarArchive.extractAsync(await PostgreSQLServer.downloadAsync(target, hash), folder);
      await fs.writeFile(path.join(folder, PostgreSQLServer.COMPLETE_MARKER), PostgreSQLServer.VERSION);
    }

    return PostgreSQLServer.findBinFolderAsync(folder);
  }

  private static target(): string {
    return `${PostgreSQLServer.ARCHITECTURES.get(process.arch) ?? process.arch}-${PostgreSQLServer.PLATFORMS.get(process.platform) ?? process.platform}`;
  }

  private static async downloadAsync(target: string, hash: string): Promise<Buffer> {
    const name = `postgresql-${PostgreSQLServer.VERSION}-${target}.tar.gz`;
    const response = await fetch(`${PostgreSQLServer.RELEASE_URL}/${PostgreSQLServer.VERSION}/${name}`);
    if (!response.ok)
      throw new CommandFailedException(PostgreSQLServer.downloadFailed(name, response.status));

    const archive = Buffer.from(await response.arrayBuffer());
    const actual = createHash(PostgreSQLServer.HASH_ALGORITHM).update(archive).digest(PostgreSQLServer.HEX_ENCODING);
    if (actual !== hash)
      throw new CommandFailedException(PostgreSQLServer.hashMismatch(name, hash, actual));

    return archive;
  }

  private static async findBinFolderAsync(folder: string): Promise<string> {
    if (await PostgreSQLServer.existsAsync(path.join(folder, PostgreSQLServer.BIN_FOLDER)))
      return path.join(folder, PostgreSQLServer.BIN_FOLDER);

    for (const entry of await fs.readdir(folder, { withFileTypes: true }))
      if (entry.isDirectory() && await PostgreSQLServer.existsAsync(path.join(folder, entry.name, PostgreSQLServer.BIN_FOLDER)))
        return path.join(folder, entry.name, PostgreSQLServer.BIN_FOLDER);

    throw new CommandFailedException(PostgreSQLServer.binFolderMissing(folder));
  }

  private static async findFreePortAsync(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = createServer();
      server.once("error", reject);
      server.listen(0, PostgreSQLServer.HOST, () => {
        const address = server.address();
        const port = typeof address === "object" && address !== null ? address.port : 0;
        server.close(() => { resolve(port); });
      });
    });
  }

  private static async existsAsync(target: string): Promise<boolean> {
    try {
      await fs.access(target);
      return true;
    }
    catch {
      return false;
    }
  }

  private static unsupportedTarget(target: string): string {
    return `No pinned PostgreSQL ${PostgreSQLServer.VERSION} build exists for ${target}.`;
  }

  private static downloadFailed(name: string, status: number): string {
    return `Downloading ${name} failed with HTTP status ${status}.`;
  }

  private static hashMismatch(name: string, expected: string, actual: string): string {
    return `${name} has SHA-256 ${actual}, not the pinned ${expected}.`;
  }

  private static binFolderMissing(folder: string): string {
    return `The PostgreSQL archive extracted to ${folder} has no bin folder.`;
  }

  private static startAndStopFailed(start: unknown, stop: unknown): string {
    return `The PostgreSQL server did not start: ${PostgreSQLServer.describe(start)}${PostgreSQLServer.NEW_LINE}Stopping it failed too: ${PostgreSQLServer.describe(stop)}`;
  }

  private static folderNotRemoved(folder: string, error: unknown): string {
    return `The test PostgreSQL server's folder ${folder} could not be removed: ${PostgreSQLServer.describe(error)}`;
  }

  private static describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private static commandFailed(command: string, code: number | null, log: string): string {
    return `${command} exited with code ${code ?? "none"}.${PostgreSQLServer.NEW_LINE}${log}`;
  }
}
