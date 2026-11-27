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
import { readFileSync } from "node:fs";
import { access, copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep, win32 } from "node:path";

import { Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";
import type { Project } from "@noldova/context";
import { JsonReader } from "@noldova/context.json";
import { StringBuilder } from "@noldova/context.text";

import { Resources } from "../../resources.js";
import { BuildHost } from "../../services/build-host.js";
import { ProjectConfiguration } from "../models/project-configuration.js";
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

  public static async copyAsync(from: string, to: string): Promise<void> {
    await mkdir(dirname(to), { recursive: true });
    await copyFile(from, to);
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

  public static decodeBase64(text: string): string {
    return Buffer.from(text, PluginResources.base64Encoding).toString(Resources.textEncoding);
  }

  public static encodeBase64(text: string): string {
    return Buffer.from(text, Resources.textEncoding).toString(PluginResources.base64Encoding);
  }

  public static async listFilesAsync(folder: string): Promise<IReadOnlyList<string>> {
    if (!await PluginHost.existsAsync(folder))
      return new List<string>();

    const entries = await readdir(folder, { recursive: true, withFileTypes: true });

    return Enumerable.from(entries).where(t => t.isFile()).select(t => join(t.parentPath, t.name)).orderBy(t => t).toList();
  }

  public static async listInputsAsync(rootDirectory: string, excluded: IReadOnlyList<string>): Promise<IReadOnlyList<string>> {
    return (await PluginHost.listFilesAsync(rootDirectory))
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

  public static async readConfigurationAsync(project: Project, configurationPath: string): Promise<ProjectConfiguration | undefined> {
    const child = spawn(process.execPath, [BuildHost.compilerOf(project), PluginResources.showConfigOption, Resources.projectOption, configurationPath],
      { cwd: project.directory, stdio: ["ignore", "pipe", "ignore"], windowsHide: true });
    const output = new StringBuilder();
    child.stdout.setEncoding(Resources.textEncoding).on(PluginResources.dataEvent, (chunk: string) => output.append(chunk));
    const [code]: readonly unknown[] = await once(child, Resources.closeEvent);
    if (code !== 0)
      return undefined;

    const reader = JsonReader.parse(output.toString(), configurationPath);
    const options = reader.readObject(PluginResources.compilerOptionsField);
    if (!options.hasField(PluginResources.rootDirectoryField) || !options.hasField(PluginResources.outputDirectoryField))
      return undefined;

    const folder = dirname(configurationPath);
    const paths = options.hasField(PluginResources.pathsField) ? options.readObject(PluginResources.pathsField) : JsonReader.fromValue({});

    return new ProjectConfiguration(resolve(folder, options.readString(PluginResources.rootDirectoryField)), resolve(folder, options.readString(PluginResources.outputDirectoryField)),
      Enumerable.from(reader.hasField(PluginResources.filesField) ? reader.readStringArray(PluginResources.filesField) : []).select(t => resolve(folder, t)).toList(),
      Enumerable.from(Object.keys(paths.toJson())).toDictionary(t => t, t => Enumerable.from(paths.readStringArray(t)).select(path => resolve(folder, path)).toList()));
  }
}
