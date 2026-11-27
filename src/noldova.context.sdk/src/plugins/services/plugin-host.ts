/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { readFileSync } from "node:fs";
import { access, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep, win32 } from "node:path";

import { Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";
import { ExceptionOptions } from "@noldova/context.exceptions";
import { JsonReader } from "@noldova/context.json";

import { SDKException } from "../../exceptions/sdk.exception.js";
import { Resources } from "../../resources.js";
import { PluginResources } from "../plugin-resources.js";

export class PluginHost {
  public static readSync(path: string): string {
    return readFileSync(path, Resources.textEncoding);
  }

  public static readOptionalSync(path: string): string | undefined {
    try {
      return readFileSync(path, Resources.textEncoding);
    }
    catch {
      return undefined;
    }
  }

  public static async writeAsync(path: string, text: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, text, Resources.textEncoding);
  }

  public static clearAsync(folder: string): Promise<void> {
    return rm(folder, { recursive: true, force: true });
  }

  public static async existsAsync(path: string): Promise<boolean> {
    try {
      await access(path);

      return true;
    }
    catch {
      return false;
    }
  }

  public static join(folder: string, ...names: readonly string[]): string {
    return join(folder, ...names);
  }

  public static relativePath(from: string, to: string): string {
    return relative(from, to).split(sep).join(Resources.pathSeparator);
  }

  public static isInside(folder: string, path: string): boolean {
    const relativePath = relative(folder, path);

    return relativePath !== "" && !relativePath.startsWith("..") && !win32.isAbsolute(relativePath);
  }

  public static async listFilesAsync(folder: string, extension: string): Promise<IReadOnlyList<string>> {
    if (!await PluginHost.existsAsync(folder))
      return new List<string>();

    const entries = await readdir(folder, { recursive: true, withFileTypes: true });

    return Enumerable.from(entries).where(t => t.isFile() && t.name.endsWith(extension)).select(t => join(t.parentPath, t.name)).orderBy(t => t).toList();
  }

  public static async listSourcesAsync(rootDirectory: string, excluded: IReadOnlyList<string>): Promise<IReadOnlyList<string>> {
    return (await PluginHost.listFilesAsync(rootDirectory, PluginResources.sourceExtension))
      .where(t => !t.endsWith(PluginResources.declarationExtension))
      .where(t => !relative(rootDirectory, t).split(sep).includes(PluginResources.packagesFolderName))
      .where(t => !excluded.any(e => PluginHost.isInside(e, t)))
      .toList();
  }

  public static packageRootOf(manifestPath: string, packageName: string): string | undefined {
    try {
      return dirname(createRequire(manifestPath).resolve(`${packageName}/${PluginResources.packageManifestFileName}`));
    }
    catch {
      return undefined;
    }
  }

  public static async readConfigurationFolderAsync(configurationPath: string, field: string): Promise<string> {
    let text: string;
    try {
      text = await readFile(configurationPath, Resources.textEncoding);
    }
    catch (exception) {
      throw new SDKException(PluginResources.formatConfigurationUnreadable(configurationPath), new ExceptionOptions(exception));
    }

    let basePath: string;
    try {
      const reader = JsonReader.parse(text, configurationPath);
      const options = reader.hasField(PluginResources.compilerOptionsField) ? reader.readObject(PluginResources.compilerOptionsField) : undefined;
      if (!Object.isUndefined(options) && options.hasField(field))
        return resolve(dirname(configurationPath), options.readNonBlankString(field));
      if (!reader.hasField(PluginResources.extendsField))
        throw new SDKException(PluginResources.formatConfigurationFolderMissing(configurationPath, field));

      basePath = resolve(dirname(configurationPath), reader.readNonBlankString(PluginResources.extendsField));
    }
    catch (exception) {
      if (exception instanceof SDKException)
        throw exception;

      throw new SDKException(PluginResources.formatConfigurationInvalid(configurationPath, exception), new ExceptionOptions(exception));
    }

    return PluginHost.readConfigurationFolderAsync(basePath, field);
  }
}
