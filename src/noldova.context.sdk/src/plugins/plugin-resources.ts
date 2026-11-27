/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

export class PluginResources {
  public static readonly base64Digits: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  public static readonly base64Encoding: BufferEncoding = "base64";
  public static readonly buildFolderName: string = "_build";
  public static readonly compiledExtensionPattern: RegExp = /\.js$/u;
  public static readonly compilerLocationPattern: RegExp = /^(.+?)\((\d+),(\d+)\)(: .*)$/u;
  public static readonly compilerOptionsField: string = "compilerOptions";
  public static readonly dataEvent: string = "data";
  public static readonly declarationExtension: string = ".d.ts";
  public static readonly fileField: string = "file";
  public static readonly filesField: string = "files";
  public static readonly generatedFolder: readonly string[] = [PluginResources.buildFolderName, ".generated"];
  public static readonly inlineSourceMapPattern: RegExp = /\/\/# sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)\s*$/u;
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
  public static readonly scriptExtensions: IReadOnlyList<string> = new List([".js", ".mjs", ".cjs"]);
  public static readonly showConfigOption: string = "--showConfig";
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

  public static formatConfigurationFoldersMissing(configuration: string): string {
    return `"${configuration}" doesn't set both "compilerOptions.rootDir" and "compilerOptions.outDir", which a build with plugins needs.`;
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

  public static formatInlineSourceMap(encoded: string): string {
    return `//# sourceMappingURL=data:application/json;base64,${encoded}`;
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
