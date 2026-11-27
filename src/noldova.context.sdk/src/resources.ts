/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";

export class Resources {
  public static readonly backslash: string = "\\";
  public static readonly closeEvent: string = "close";
  public static readonly commandDescription: string = "Builds the project and the projects it depends on with their TypeScript compiler.";
  public static readonly commandName: string = "build";
  public static readonly compilerManifest: string = "typescript/package.json";
  public static readonly compilerPath: readonly string[] = ["bin", "tsc"];
  public static readonly configurationFileName: string = "tsconfig.json";
  public static readonly cycleSeparator: string = " -> ";
  public static readonly dependenciesField: string = "dependencies";
  public static readonly helpOptions: IReadOnlyList<string> = new List(["-h", "--help"]);
  public static readonly lineEvent: string = "line";
  public static readonly packagesField: string = "packages";
  public static readonly pathSeparator: string = "/";
  public static readonly projectExtension: string = ".ctxp";
  public static readonly projectOption: string = "--project";
  public static readonly projectsField: string = "projects";
  public static readonly relativeSegments: IReadOnlyList<string> = new List([".", ".."]);
  public static readonly textEncoding: BufferEncoding = "utf8";
  public static readonly usage: IReadOnlyList<string> = new List([
    "Usage: ctx build [<tsc options>]",
    "",
    "Builds the project and the projects it depends on, each with the TypeScript compiler installed for it,",
    "on the tsconfig.json beside its project file. Every argument goes to each compiler as given.",
    "",
    "  -h, --help  Shows this help."
  ]);

  public static formatBuildFailed(project: string): string {
    return `"${project}" didn't build.`;
  }

  public static formatBuilding(project: string): string {
    return `Building "${project}"...`;
  }

  public static formatBuilt(project: string): string {
    return `Built "${project}".`;
  }

  public static formatCompilerMissing(project: string): string {
    return `No TypeScript compiler is installed for "${project}": install the typescript package for it.`;
  }

  public static formatConfigurationMissing(project: string, configuration: string): string {
    return `"${project}" has no "${configuration}" beside its project file.`;
  }

  public static formatDependenciesInvalid(project: string, error: unknown): string {
    return `The project dependencies of "${project}" can't be read: ${String(error)}`;
  }

  public static formatDependencyCycle(projects: Enumerable<string>): string {
    return `The project dependencies form a cycle: ${projects.toArray().join(Resources.cycleSeparator)}.`;
  }

  public static formatDependencyExecutable(project: string, dependency: string): string {
    return `"${project}" depends on "${dependency}", an executable: only a library can be a project dependency.`;
  }

  public static formatDependencyMissing(project: string, dependency: string): string {
    return `"${project}" depends on "${dependency}", but no project file has that exact path.`;
  }

  public static formatDependencyNotRelative(project: string, dependency: string): string {
    return `"${project}" depends on "${dependency}": a project dependency is a relative path to a .ctxp file, with forward slashes.`;
  }

  public static formatDependencyRepeated(project: string, dependency: string): string {
    return `"${project}" names "${dependency}" more than once in its project dependencies.`;
  }

  public static formatProjectNameRepeated(project: string, first: string, second: string): string {
    return `"${first}" and "${second}" are both named "${project}".`;
  }
}
