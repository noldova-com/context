/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import "@noldova/context.core";
import { ExceptionOptions } from "@noldova/context.exceptions";
import { JsonException, JsonReader } from "@noldova/context.json";

import { DataToolsException } from "../exceptions/data-tools.exception.js";
import { SourceFile } from "../models/sources/source-file.js";
import { Resources } from "../resources.js";

export class ProjectSources {
  public readonly projectFilePath: string;
  public readonly rootDirectory: string;
  public readonly outputDirectory: string;

  private constructor(projectFilePath: string, rootDirectory: string, outputDirectory: string) {
    this.projectFilePath = projectFilePath;
    this.rootDirectory = rootDirectory;
    this.outputDirectory = outputDirectory;
  }

  public static async openAsync(projectFilePath: string): Promise<ProjectSources> {
    const configurationPath = join(dirname(projectFilePath), Resources.configurationFileName);
    const rootDirectory = await ProjectSources.readFolderAsync(configurationPath, Resources.rootDirectoryField);
    const outputDirectory = await ProjectSources.readFolderAsync(configurationPath, Resources.outputDirectoryField);

    return new ProjectSources(projectFilePath, rootDirectory, outputDirectory);
  }

  public resolve(path: string): string {
    return resolve(dirname(this.projectFilePath), path);
  }

  public join(folder: string, ...names: readonly string[]): string {
    return join(folder, ...names);
  }

  public folderOf(path: string): string {
    return dirname(path);
  }

  public async readSourcesAsync(): Promise<readonly SourceFile[]> {
    const entries = await readdir(this.rootDirectory, { recursive: true, withFileTypes: true });
    const paths = entries.filter(t => t.isFile() && t.name.endsWith(Resources.sourceExtension) && !t.name.endsWith(Resources.declarationExtension))
      .map(t => join(t.parentPath, t.name))
      .filter(t => !relative(this.rootDirectory, t).split(sep).includes(Resources.packagesFolderName))
      .sort();
    const files: SourceFile[] = [];
    for (const path of paths)
      files.push(new SourceFile(path, await readFile(path, Resources.textEncoding)));

    return files;
  }

  public async listAsync(folder: string): Promise<readonly string[]> {
    if (!await this.existsAsync(folder))
      return [];

    return (await readdir(folder)).sort();
  }

  public async existsAsync(path: string): Promise<boolean> {
    try {
      await access(path);

      return true;
    }
    catch {
      return false;
    }
  }

  public readAsync(path: string): Promise<string> {
    return readFile(path, Resources.textEncoding);
  }

  public async writeAsync(path: string, text: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, text, Resources.textEncoding);
  }

  public async importCompiledAsync(sourcePath: string): Promise<Readonly<Record<string, unknown>>> {
    const compiledPath = join(this.outputDirectory, relative(this.rootDirectory, sourcePath)).replace(/\.ts$/, Resources.compiledExtension);
    if (!await this.existsAsync(compiledPath))
      throw new DataToolsException(Resources.formatCompiledMissing(sourcePath, compiledPath));

    try {
      return await import(pathToFileURL(compiledPath).href);
    }
    catch (exception) {
      throw new DataToolsException(Resources.formatCompiledUnloadable(compiledPath, exception), new ExceptionOptions(exception));
    }
  }

  public async importPackageAsync(packageName: string): Promise<Readonly<Record<string, unknown>>> {
    let modulePath: string;
    try {
      modulePath = createRequire(this.projectFilePath).resolve(packageName);
    }
    catch (exception) {
      throw new DataToolsException(Resources.formatPackageMissing(packageName, this.projectFilePath), new ExceptionOptions(exception));
    }

    return import(pathToFileURL(modulePath).href);
  }

  private static async readFolderAsync(configurationPath: string, field: string): Promise<string> {
    let text: string;
    try {
      text = await readFile(configurationPath, Resources.textEncoding);
    }
    catch (exception) {
      throw new DataToolsException(Resources.formatConfigurationMissing(configurationPath), new ExceptionOptions(exception));
    }

    let basePath: string;
    try {
      const reader = JsonReader.parse(text, configurationPath);
      const options = reader.hasField(Resources.compilerOptionsField) ? reader.readNullableObject(Resources.compilerOptionsField) : null;
      if (!Object.isNull(options) && options.hasField(field))
        return resolve(dirname(configurationPath), options.readNonBlankString(field));
      if (!reader.hasField(Resources.extendsField))
        throw new DataToolsException(Resources.formatConfigurationFolderMissing(configurationPath, field));

      basePath = resolve(dirname(configurationPath), reader.readNonBlankString(Resources.extendsField));
    }
    catch (exception) {
      if (!(exception instanceof JsonException))
        throw exception;

      throw new DataToolsException(Resources.formatConfigurationInvalid(configurationPath, exception.message), new ExceptionOptions(exception));
    }

    return ProjectSources.readFolderAsync(basePath, field);
  }
}
