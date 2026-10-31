/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CommandFailedException, type PackageInfo, ProcessResult } from "../src/noldova.context.tooling/src/api/index.ts";
import Config from "./config.ts";

export default abstract class Script {
  private static readonly API_DIRECTORY_NAME: string = "api";
  private static readonly DECLARATION_FILE_NAME: string = "index.d.ts";
  private static readonly NPM_EXECUTABLE_PATH_VARIABLE: string = "npm_execpath";
  private static readonly NPM_EXECUTABLE_PATH_UNAVAILABLE: string = "npm_execpath is unavailable. Run the bootstrap through npm.";
  private static readonly PACKAGE_MANIFEST_PATH: string = "typescript/package.json";
  private static readonly README_FILE_NAME: string = "README.md";
  private static readonly SOURCE_TSCONFIG_PATH: string = "src/tsconfig.json";
  private static readonly STEP_DONE: string = " Done.";
  private static readonly STEP_FAILED: string = " Failed.";
  private static readonly TYPESCRIPT_COMPILER_DIRECTORY_NAME: string = "bin";
  private static readonly TYPESCRIPT_COMPILER_FILE_NAME: string = "tsc";
  private static readonly TYPESCRIPT_PRETTY_OPTION: string = "--pretty";
  protected static readonly TYPESCRIPT_PROJECT_OPTION: string = "--project";
  protected static readonly SOURCE_DIRECTORY_NAME: string = "src";
  protected static readonly TEXT_ENCODING: BufferEncoding = "utf8";

  public abstract runAsync(packageInfo?: PackageInfo): Promise<void>;

  public async runAsEntryPointAsync(): Promise<void> {
    try {
      await this.runAsync();
    }
    catch (error) {
      if (!(error instanceof CommandFailedException))
        throw error;

      console.error(error.message);
      process.exitCode = 1;
    }
  }

  protected async executeProcessAsync(command: string, arguments_: readonly string[], workingDirectory: string, silent: boolean = false, environment?: Record<string, string>,): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, arguments_, { cwd: workingDirectory, stdio: silent ? "pipe" : "inherit", shell: false, env: environment === undefined ? process.env : { ...process.env, ...environment }, });
      const output: string[] = [];
      child.stdout?.on("data", (t: Buffer) => output.push(t.toString()));
      child.stderr?.on("data", (t: Buffer) => output.push(t.toString()));

      child.on("close", t => {
        if (t === 0)
          resolve();
        else
          reject(new CommandFailedException(Script.commandFailed(command, t, output.join(""))));
      });

      child.on("error", t => { reject(t); });
    });
  }

  protected async readProcessAsync(command: string, arguments_: readonly string[], workingDirectory: string): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, arguments_, { cwd: workingDirectory, stdio: "pipe", shell: false, env: process.env });
      const output: string[] = [];
      const errorOutput: string[] = [];
      child.stdout.on("data", (t: Buffer) => output.push(t.toString()));
      child.stderr.on("data", (t: Buffer) => errorOutput.push(t.toString()));

      child.on("close", t => { resolve(new ProcessResult(t, output.join(""), errorOutput.join(""))); });

      child.on("error", t => { reject(t); });
    });
  }

  protected async executeNPMCommandAsync(arguments_: readonly string[], workingDirectory: string, silent: boolean = false,): Promise<void> {
    await this.executeProcessAsync(process.execPath, [Script.readNPMPath(), ...arguments_], workingDirectory, silent,);
  }

  protected async readNPMCommandAsync(arguments_: readonly string[], workingDirectory: string): Promise<ProcessResult> {
    return await this.readProcessAsync(process.execPath, [Script.readNPMPath(), ...arguments_], workingDirectory);
  }

  protected async executeTypeScriptCompilerAsync(arguments_: readonly string[]): Promise<void> {
    const packagePath: string = fileURLToPath(import.meta.resolve(Script.PACKAGE_MANIFEST_PATH));
    const compilerPath: string = path.join(path.dirname(packagePath), Script.TYPESCRIPT_COMPILER_DIRECTORY_NAME, Script.TYPESCRIPT_COMPILER_FILE_NAME);

    await this.executeProcessAsync(process.execPath, [compilerPath, Script.TYPESCRIPT_PRETTY_OPTION, ...arguments_], process.cwd(), true);
  }

  protected async readTypeScriptVersionAsync(): Promise<string> {
    const manifest: { version: string } = JSON.parse(await this.readFileAsync(fileURLToPath(import.meta.resolve(Script.PACKAGE_MANIFEST_PATH))));

    return manifest.version;
  }

  protected async writeLogAsync(message: string): Promise<void> {
    console.log(message);
  }

  protected async runStepAsync(message: string, step: () => Promise<void>): Promise<void> {
    process.stdout.write(message);
    try {
      await step();
    }
    catch (error) {
      console.log(Script.STEP_FAILED);
      throw error;
    }
    console.log(Script.STEP_DONE);
  }

  protected async getPackagesInfoAsync(): Promise<PackageInfo[]> {
    const packageNames = process.argv.slice(2);

    if (packageNames.length > 0) {
      const selectedPackageNames = new Set<string>();
      for (const packageName of packageNames) {
        if (selectedPackageNames.has(packageName))
          throw new CommandFailedException(Script.packageDuplicated(packageName));

        if (!Config.PACKAGES_INFO.some(t => t.name === packageName))
          throw new CommandFailedException(Script.packageNotFound(packageName));

        selectedPackageNames.add(packageName);
      }

      return Config.PACKAGES_INFO.filter(t => selectedPackageNames.has(t.name));
    }

    return [...Config.PACKAGES_INFO];
  }

  protected async createDirectoryAsync(directoryName: string): Promise<void> {
    await fs.mkdir(directoryName, { recursive: true });
  }

  protected async removeDirectoryAsync(directoryName: string): Promise<void> {
    await fs.rm(directoryName, { recursive: true, force: true });
  }

  protected async pathExistsAsync(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    }
    catch {
      return false;
    }
  }

  protected async copyFileAsync(source: string, destination: string): Promise<void> {
    await fs.copyFile(source, destination);
  }

  protected async readFileAsync(filePath: string): Promise<string> {
    return await fs.readFile(filePath, Script.TEXT_ENCODING);
  }

  protected async writeFileAsync(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content);
  }

  protected async copyDeclarationsFileAsync(packageInfo: PackageInfo): Promise<void> {
    await this.createDirectoryAsync(`${Config.BUILD_FOLDER}/${packageInfo.name}/${Script.API_DIRECTORY_NAME}`);
    await this.copyFileAsync(
      `${Script.SOURCE_DIRECTORY_NAME}/${packageInfo.path}/${Script.SOURCE_DIRECTORY_NAME}/${Script.API_DIRECTORY_NAME}/${Script.DECLARATION_FILE_NAME}`,
      `${Config.BUILD_FOLDER}/${packageInfo.name}/${Script.API_DIRECTORY_NAME}/${Script.DECLARATION_FILE_NAME}`);
  }

  protected async compilePackageAsync(packageInfo: PackageInfo): Promise<void> {
    await this.copyDeclarationsFileAsync(packageInfo);
    await this.copyReadmeFileAsync(packageInfo);
    await this.executeTypeScriptCompilerAsync(
      [Script.TYPESCRIPT_PROJECT_OPTION, `${Script.SOURCE_DIRECTORY_NAME}/${packageInfo.path}/${Script.SOURCE_TSCONFIG_PATH}`]);
  }

  protected async copyReadmeFileAsync(packageInfo: PackageInfo): Promise<void> {
    const sourceFilePath = `${Script.SOURCE_DIRECTORY_NAME}/${packageInfo.path}/${Script.README_FILE_NAME}`;
    if (!await this.pathExistsAsync(sourceFilePath))
      throw new CommandFailedException(Script.readmeMissing(packageInfo.packageName, sourceFilePath));

    await this.copyFileAsync(sourceFilePath, `${Config.BUILD_FOLDER}/${packageInfo.name}/${Script.README_FILE_NAME}`);
  }

  protected async executeActionAsync(packagesInfo: readonly PackageInfo[], action: (packageInfo: PackageInfo) => Promise<void>,): Promise<void> {
    for (const packageInfo of packagesInfo)
      await action(packageInfo);
  }

  private static readNPMPath(): string {
    const npmPath: string | undefined = process.env[Script.NPM_EXECUTABLE_PATH_VARIABLE];
    if (npmPath === undefined || npmPath.length === 0)
      throw new CommandFailedException(Script.NPM_EXECUTABLE_PATH_UNAVAILABLE);

    return npmPath;
  }

  private static commandFailed(command: string, exitCode: number | null, output: string): string {
    return output.trim().length === 0 ? `Command "${command}" failed with exit code ${exitCode}.` : output.trimEnd();
  }

  private static packageNotFound(packageName: string): string {
    return `Package ${packageName} not found in configuration.`;
  }

  private static packageDuplicated(packageName: string): string {
    return `Package ${packageName} was selected more than once.`;
  }

  private static readmeMissing(packageName: string, readmeFilePath: string): string {
    return `Package ${packageName} has no ${Script.README_FILE_NAME} at "${readmeFilePath}"; every package ships one.`;
  }
}
