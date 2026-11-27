/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

import "@noldova/context.core";

export class ToolProject implements AsyncDisposable {
  private static readonly sourceFolder: string = resolve(import.meta.dirname, "../../../../src/data/noldova.context.data.tools/tests/fixtures/projects/notes");
  private static readonly compiledFolder: string = resolve(import.meta.dirname, "projects/notes");
  private static readonly folderPrefix: string = "../../data-tools-";
  private static readonly versionFiles: readonly string[] = ["entities", "notes-context"];

  public readonly directory: string;

  private constructor(directory: string) {
    this.directory = directory;
  }

  public get projectFilePath(): string {
    return this.path("notes.ctxp");
  }

  public static async createAsync(): Promise<ToolProject> {
    const project = new ToolProject(await mkdtemp(resolve(import.meta.dirname, ToolProject.folderPrefix)));
    await project.writeAsync("notes.ctxp", JSON.stringify({ name: "notes", kind: "executable" }));
    await project.writeAsync("tsconfig.json", JSON.stringify({ compilerOptions: { rootDir: "src", outDir: "build" } }));

    return project;
  }

  public static expectedAsync(version: string, provider: string, name: string): Promise<string> {
    return readFile(join(ToolProject.sourceFolder, version, "migrations", provider, name), "utf8");
  }

  public path(relativePath: string): string {
    return join(this.directory, relativePath);
  }

  public relative(path: string): string {
    return relative(this.directory, path).split(sep).join("/");
  }

  public async writeAsync(relativePath: string, text: string): Promise<void> {
    await mkdir(dirname(this.path(relativePath)), { recursive: true });
    await writeFile(this.path(relativePath), text);
  }

  public readAsync(relativePath: string): Promise<string> {
    return readFile(this.path(relativePath), "utf8");
  }

  public async listAsync(relativePath: string): Promise<readonly string[]> {
    return (await readdir(this.path(relativePath))).sort();
  }

  public async copyVersionAsync(version: string, migrationsVersion: string | null, provider: string): Promise<void> {
    for (const name of ToolProject.versionFiles) {
      await cp(join(ToolProject.sourceFolder, version, `${name}.ts`), this.path(`src/${name}.ts`));
      await cp(join(ToolProject.compiledFolder, version, `${name}.js`), this.path(`build/${name}.js`));
    }
    if (Object.isNull(migrationsVersion))
      return;

    await cp(join(ToolProject.sourceFolder, migrationsVersion, "migrations", provider), this.path(`src/migrations/${provider}`), { recursive: true });
    await cp(join(ToolProject.compiledFolder, migrationsVersion, "migrations", provider), this.path(`build/migrations/${provider}`), { recursive: true });
  }

  public [Symbol.asyncDispose](): Promise<void> {
    return rm(this.directory, { recursive: true, force: true });
  }
}
