/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class TypeScriptReferenceIdentity {
  private static readonly CONFIG_IDENTITY: string = "tsconfig.json";
  private static readonly LIBRARY_IDENTITY_PREFIX: string = "libraries/";
  private static readonly SEPARATOR: string = "/";

  private readonly configPath: string;
  private readonly libraryDirectoryPrefix: string;
  private readonly unitIndexes: ReadonlyMap<string, number>;

  public constructor(configPath: string, libraryDirectory: string, unitPaths: readonly string[]) {
    this.configPath = configPath;
    this.libraryDirectoryPrefix = `${libraryDirectory}${TypeScriptReferenceIdentity.SEPARATOR}`;
    this.unitIndexes = new Map<string, number>(unitPaths.map((t, index) => [t, index]));
  }

  public ofFile(fileName: string): number | string {
    const unitIndex = this.unitIndexes.get(fileName);
    if (unitIndex !== undefined)
      return unitIndex;

    if (fileName === this.configPath)
      return TypeScriptReferenceIdentity.CONFIG_IDENTITY;

    if (fileName.startsWith(this.libraryDirectoryPrefix))
      return `${TypeScriptReferenceIdentity.LIBRARY_IDENTITY_PREFIX}${fileName.slice(this.libraryDirectoryPrefix.length)}`;

    throw new Error(TypeScriptReferenceIdentity.fileUnknown(fileName));
  }

  public ofText(text: string): string {
    return text.replaceAll(this.libraryDirectoryPrefix, TypeScriptReferenceIdentity.LIBRARY_IDENTITY_PREFIX);
  }

  public isLibrary(fileName: string): boolean {
    return fileName.startsWith(this.libraryDirectoryPrefix);
  }

  public isUnit(fileName: string): boolean {
    return this.unitIndexes.has(fileName);
  }

  private static fileUnknown(fileName: string): string {
    return `The reference reported a file "${fileName}" that is neither a unit of the case, the project file, nor a vendored library.`;
  }
}
