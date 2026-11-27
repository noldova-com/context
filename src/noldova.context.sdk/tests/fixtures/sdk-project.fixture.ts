/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

export class SDKProject {
  public static readonly validSource: string = "export const value: number = 1;";

  private static readonly folderPrefix: string = "../../sdk-";
  private static readonly configuration: object = {
    compilerOptions: { rootDir: "src", outDir: "build", module: "nodenext", target: "es2022", strict: true, declaration: true, types: [] },
    include: ["src"]
  };

  public readonly directory: string;

  private constructor(directory: string) {
    this.directory = directory;
  }

  public get projectFilePath(): string {
    return this.path("notes.ctxp");
  }

  public static async createAsync(source: string): Promise<SDKProject> {
    return SDKProject.writeAsync(await mkdtemp(resolve(import.meta.dirname, SDKProject.folderPrefix)), source);
  }

  public static async createOutsideTheRepositoryAsync(): Promise<SDKProject> {
    return SDKProject.writeAsync(await mkdtemp(join(tmpdir(), "sdk-")), SDKProject.validSource);
  }

  public path(relativePath: string): string {
    return join(this.directory, relativePath);
  }

  public async existsAsync(relativePath: string): Promise<boolean> {
    try {
      await access(this.path(relativePath));

      return true;
    }
    catch {
      return false;
    }
  }

  public async writeAsync(relativePath: string, text: string): Promise<void> {
    await mkdir(dirname(this.path(relativePath)), { recursive: true });
    await writeFile(this.path(relativePath), text);
  }

  public writeManifestAsync(manifest: object): Promise<void> {
    return this.writeAsync("notes.ctxp", JSON.stringify(manifest));
  }

  public async writeProjectAsync(folder: string, manifest: object, source: string = SDKProject.validSource): Promise<void> {
    await this.writeAsync(`${folder}/${folder}.ctxp`, JSON.stringify(manifest));
    await this.writeAsync(`${folder}/tsconfig.json`, JSON.stringify(SDKProject.configuration));
    await this.writeAsync(`${folder}/src/index.ts`, source);
  }

  public removeAsync(relativePath: string): Promise<void> {
    return rm(this.path(relativePath));
  }

  public [Symbol.asyncDispose](): Promise<void> {
    return rm(this.directory, { recursive: true, force: true });
  }

  private static async writeAsync(directory: string, source: string): Promise<SDKProject> {
    const project = new SDKProject(directory);
    await project.writeManifestAsync({ name: "notes", kind: "library" });
    await project.writeAsync("tsconfig.json", JSON.stringify(SDKProject.configuration));
    await project.writeAsync("src/index.ts", source);

    return project;
  }
}
