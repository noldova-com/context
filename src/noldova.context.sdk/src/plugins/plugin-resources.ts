/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class PluginResources {
  public static readonly base64Digits: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  public static readonly buildFolderName: string = "_build";
  public static readonly compiledExtensionPattern: RegExp = /\.js$/u;
  public static readonly compilerLocationPattern: RegExp = /^(.+?)\((\d+),(\d+)\)(: .*)$/u;
  public static readonly compilerOptionsField: string = "compilerOptions";
  public static readonly declarationExtension: string = ".d.ts";
  public static readonly extendsField: string = "extends";
  public static readonly fileField: string = "file";
  public static readonly generatedFolder: readonly string[] = [PluginResources.buildFolderName, ".generated"];
  public static readonly includeEverything: string = "**/*";
  public static readonly mappingLineSeparator: string = ";";
  public static readonly mappingSegmentSeparator: string = ",";
  public static readonly mappingsField: string = "mappings";
  public static readonly namesField: string = "names";
  public static readonly noCheckOption: string = "--noCheck";
  public static readonly noEmitOption: string = "--noEmit";
  public static readonly outputDirectoryField: string = "outDir";
  public static readonly packageManifestFileName: string = "package.json";
  public static readonly packagesFolderName: string = "node_modules";
  public static readonly relativePrefix: string = ".";
  public static readonly rootDirectoryField: string = "rootDir";
  public static readonly scopePrefix: string = "@";
  public static readonly sourceExtension: string = ".ts";
  public static readonly sourceMapExtension: string = ".map";
  public static readonly sourceRootField: string = "sourceRoot";
  public static readonly sourcesField: string = "sources";
  public static readonly typesField: string = "types";
  public static readonly versionField: string = "version";
  public static readonly vlqContinuationBit: number = 32;
  public static readonly vlqShift: number = 5;
  public static readonly vlqValueMask: number = 31;

  public static formatAddedFilePathInvalid(plugin: string, path: string): string {
    return `The plugin "${plugin}" adds "${path}": an added file is a .ts path relative to the source root, with forward slashes and no "." or ".." segments.`;
  }

  public static formatAddedFileRepeated(plugin: string, path: string): string {
    return `The plugin "${plugin}" adds "${path}", which is already a source or an added file.`;
  }

  public static formatCompilerLocation(path: string, line: number, character: number, rest: string): string {
    return `${path}(${String(line)},${String(character)})${rest}`;
  }

  public static formatConfigurationFolderMissing(configuration: string, field: string): string {
    return `"${configuration}" sets no "compilerOptions.${field}", which a build with plugins needs.`;
  }

  public static formatConfigurationInvalid(configuration: string, error: unknown): string {
    return `"${configuration}" can't be read: ${String(error)}`;
  }

  public static formatConfigurationUnreadable(configuration: string): string {
    return `"${configuration}" can't be read.`;
  }

  public static formatDiagnostic(path: string, line: number, character: number, category: string, code: string, text: string): string {
    return `${path}(${String(line)},${String(character)}): ${category} ${code}: ${text}`;
  }

  public static formatDiagnosticNotInProject(plugin: string, message: string): string {
    return `The plugin "${plugin}" reports "${message}" outside the project's sources: a diagnostic is located in a project source file.`;
  }

  public static formatEditsOverlap(path: string, first: string, second: string): string {
    return `The plugins "${first}" and "${second}" change the same text of "${path}".`;
  }

  public static formatPluginFailed(plugin: string, error: unknown): string {
    return `The plugin "${plugin}" failed: ${String(error)}`;
  }

  public static formatRootOutsideProject(project: string, rootDirectory: string): string {
    return `"${project}" compiles "${rootDirectory}", outside its project folder: its compilerOptions.rootDir must be in the folder of its .ctxp.`;
  }

  public static formatSourceNotInProject(plugin: string, path: string): string {
    return `The plugin "${plugin}" changes "${path}", which isn't one of the project's sources.`;
  }
}
