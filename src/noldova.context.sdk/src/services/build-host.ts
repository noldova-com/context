/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve, win32 } from "node:path";
import { createInterface } from "node:readline";

import type { CommandOutput, Project } from "@noldova/context";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { SDKException } from "../exceptions/sdk.exception.js";
import { Resources } from "../resources.js";

export class BuildHost {
  public static folderOf(path: string): string {
    return dirname(path);
  }

  public static readAsync(path: string): Promise<string> {
    return readFile(path, Resources.textEncoding);
  }

  public static resolve(folder: string, path: string): string {
    return resolve(folder, path);
  }

  public static isAbsolute(path: string): boolean {
    return win32.isAbsolute(path);
  }

  public static async existsExactlyAsync(folder: string, path: string): Promise<boolean> {
    let current = folder;
    for (const segment of path.split(Resources.pathSeparator)) {
      if (!Resources.relativeSegments.includes(segment) && !(await BuildHost.namesOfAsync(current)).includes(segment))
        return false;

      current = join(current, segment);
    }

    return true;
  }

  public static async compileAsync(project: Project, arguments_: readonly string[], output: CommandOutput): Promise<boolean> {
    const configuration = join(project.directory, Resources.configurationFileName);
    try {
      await access(configuration);
    }
    catch (exception) {
      throw new SDKException(Resources.formatConfigurationMissing(project.name, configuration), new ExceptionOptions(exception));
    }

    const child = spawn(process.execPath, [BuildHost.compilerOf(project), Resources.projectOption, configuration, ...arguments_],
      { cwd: project.directory, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    createInterface({ input: child.stdout }).on(Resources.lineEvent, output.writeLine.bind(output));
    createInterface({ input: child.stderr }).on(Resources.lineEvent, output.writeErrorLine.bind(output));
    const [code]: readonly unknown[] = await once(child, Resources.closeEvent);

    return code === 0;
  }

  private static async namesOfAsync(folder: string): Promise<readonly string[]> {
    try {
      return await readdir(folder);
    }
    catch {
      return [];
    }
  }

  private static compilerOf(project: Project): string {
    try {
      return join(dirname(createRequire(project.manifestPath).resolve(Resources.compilerManifest)), ...Resources.compilerPath);
    }
    catch (exception) {
      throw new SDKException(Resources.formatCompilerMissing(project.name), new ExceptionOptions(exception));
    }
  }
}
