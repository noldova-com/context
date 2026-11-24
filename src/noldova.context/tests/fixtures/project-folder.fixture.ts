/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export class ProjectFolder {
  private static readonly COMMAND_MODULE: string = import.meta.resolve("@noldova/context");
  private static readonly FOLDER_PREFIX: string = "noldova-context-";
  private static readonly PROJECT_FILE_NAME: string = "app.ctxp";
  private static readonly IDENTITY_PREFIX: string = "noldova.";

  public readonly directory: string;

  private constructor(directory: string) {
    this.directory = directory;
  }

  public static async useAsync(action: (folder: ProjectFolder) => Promise<void>): Promise<void> {
    const folder = new ProjectFolder(await mkdtemp(join(tmpdir(), ProjectFolder.FOLDER_PREFIX)));
    try {
      await action(folder);
    }
    finally {
      await rm(folder.directory, { recursive: true, force: true });
    }
  }

  public static command(className: string, name: string, exitCode: number): string {
    return `export class ${className} extends Command {\n  name = "${name}";\n  description = "Runs ${name}.";\n` +
      `  async runAsync(context) {\n    context.output.writeLine([context.project.name, ...context.arguments].join(" "));\n    return ${exitCode};\n  }\n}\n`;
  }

  public path(relativePath: string): string {
    return join(this.directory, relativePath);
  }

  public async writeAsync(relativePath: string, text: string): Promise<string> {
    const path = this.path(relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, text);

    return path;
  }

  public writeProjectAsync(fields: object, fileName: string = ProjectFolder.PROJECT_FILE_NAME): Promise<string> {
    return this.writeAsync(fileName, JSON.stringify(fields));
  }

  public async writeProviderAsync(identity: string, source: string): Promise<void> {
    const folder = join("node_modules", "@noldova", identity.substring(ProjectFolder.IDENTITY_PREFIX.length));
    await this.writeAsync(join(folder, "package.json"), JSON.stringify({ name: `@noldova/${identity.substring(ProjectFolder.IDENTITY_PREFIX.length)}`, type: "module", main: "index.js" }));
    await this.writeAsync(join(folder, "index.js"), `import { Command } from "${ProjectFolder.COMMAND_MODULE}";\n${source}`);
  }
}
