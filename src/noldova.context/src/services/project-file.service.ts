/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import "@noldova/context.core";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { ProjectFileException } from "../exceptions/project-file.exception.js";
import { Project } from "../models/project.js";
import { Resources } from "../resources.js";

export class ProjectFileService {
  public static async findAsync(directory: string): Promise<string | undefined> {
    const entries = await readdir(directory, { withFileTypes: true });
    const fileNames = entries.filter(t => t.isFile() && t.name.endsWith(Resources.manifestExtension)).map(t => t.name).sort();
    if (fileNames.length > 1)
      throw new ProjectFileException(directory, Resources.formatProjectAmbiguous(directory, fileNames));

    const fileName = fileNames.at(0);
    return Object.isUndefined(fileName) ? undefined : join(directory, fileName);
  }

  public static async readAsync(manifestPath: string, directory: string): Promise<Project> {
    const path = resolve(directory, manifestPath);
    let text: string;
    try {
      text = await readFile(path, Resources.textEncoding);
    }
    catch (exception) {
      throw new ProjectFileException(path, Resources.formatProjectUnreadable(path), new ExceptionOptions(exception));
    }

    return Project.parse(text, path, dirname(path));
  }
}
