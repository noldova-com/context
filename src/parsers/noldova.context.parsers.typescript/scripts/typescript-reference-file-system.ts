/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { FileSystem, FileSystemEntries } from "typescript/unstable/fs";

export default class TypeScriptReferenceFileSystem implements FileSystem {
  private static readonly SEPARATOR: string = "/";

  private readonly files: Map<string, string> = new Map<string, string>();

  public readonly readFile = (t: string): string | null => this.files.get(t) ?? null;

  public readonly fileExists = (t: string): boolean => this.files.has(t);

  public readonly directoryExists = (t: string): boolean => {
    const prefix = TypeScriptReferenceFileSystem.directoryPrefix(t);

    return prefix === TypeScriptReferenceFileSystem.SEPARATOR || this.files.keys().some(t => t.startsWith(prefix));
  };

  public readonly getAccessibleEntries = (t: string): FileSystemEntries => {
    const prefix = TypeScriptReferenceFileSystem.directoryPrefix(t);
    const files = new Set<string>();
    const directories = new Set<string>();

    for (const path of this.files.keys()) {
      if (!path.startsWith(prefix))
        continue;

      const rest = path.slice(prefix.length);
      const separatorIndex = rest.indexOf(TypeScriptReferenceFileSystem.SEPARATOR);
      if (separatorIndex === -1)
        files.add(rest);
      else
        directories.add(rest.slice(0, separatorIndex));
    }

    return { files: [...files], directories: [...directories] };
  };

  public readonly realpath = (t: string): string => t;

  public write(path: string, content: string): void {
    this.files.set(path, content);
  }

  public remove(path: string): void {
    this.files.delete(path);
  }

  private static directoryPrefix(directoryName: string): string {
    return directoryName.endsWith(TypeScriptReferenceFileSystem.SEPARATOR) ? directoryName : `${directoryName}${TypeScriptReferenceFileSystem.SEPARATOR}`;
  }
}
