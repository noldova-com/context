/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { Project, ProjectKind } from "@noldova/context";
import { ExceptionOptions } from "@noldova/context.exceptions";
import { JsonReader } from "@noldova/context.json";

import { SDKException } from "../exceptions/sdk.exception.js";
import { Resources } from "../resources.js";
import { BuildHost } from "./build-host.js";

export class ProjectGraphReader {
  private readonly order: Project[] = [];
  private readonly visited: Set<string> = new Set<string>();
  private readonly manifestPaths: Map<string, string> = new Map<string, string>();

  private constructor() {
  }

  public static async readAsync(manifestPath: string): Promise<readonly Project[]> {
    const graph = new ProjectGraphReader();
    await graph.visitAsync(manifestPath, []);

    return graph.order;
  }

  private async visitAsync(manifestPath: string, dependents: readonly Project[]): Promise<void> {
    const text = await BuildHost.readAsync(manifestPath);
    const project = Project.parse(text, manifestPath, BuildHost.folderOf(manifestPath));
    const dependent = dependents.at(-1);
    if (!Object.isUndefined(dependent) && project.kind === ProjectKind.Executable)
      throw new SDKException(Resources.formatDependencyExecutable(dependent.name, project.name));

    this.claimName(project);
    const path = [...dependents, project];
    const named = new Set<string>();
    for (const entry of ProjectGraphReader.dependenciesOf(text, project)) {
      const dependencyPath = await ProjectGraphReader.resolveAsync(project, entry, named);
      const cycleStart = path.findIndex(t => t.manifestPath === dependencyPath);
      if (cycleStart >= 0) {
        const cycle = path.slice(cycleStart).map(t => t.name);
        throw new SDKException(Resources.formatDependencyCycle([...cycle, ...cycle.slice(0, 1)]));
      }
      if (!this.visited.has(dependencyPath))
        await this.visitAsync(dependencyPath, path);
    }

    this.visited.add(manifestPath);
    this.order.push(project);
  }

  private claimName(project: Project): void {
    const other = this.manifestPaths.get(project.name);
    if (!Object.isUndefined(other))
      throw new SDKException(Resources.formatProjectNameRepeated(project.name, other, project.manifestPath));

    this.manifestPaths.set(project.name, project.manifestPath);
  }

  private static dependenciesOf(text: string, project: Project): readonly string[] {
    try {
      const reader = JsonReader.parse(text);
      if (!reader.hasField(Resources.dependenciesField))
        return [];

      const dependencies = reader.readObject(Resources.dependenciesField);

      return dependencies.hasField(Resources.projectsField) ? dependencies.readStringArray(Resources.projectsField) : [];
    }
    catch (exception) {
      throw new SDKException(Resources.formatDependenciesInvalid(project.name, exception), new ExceptionOptions(exception));
    }
  }

  private static async resolveAsync(project: Project, entry: string, named: Set<string>): Promise<string> {
    if (entry.includes(Resources.backslash) || BuildHost.isAbsolute(entry) || !entry.endsWith(Resources.projectExtension))
      throw new SDKException(Resources.formatDependencyNotRelative(project.name, entry));

    const dependencyPath = BuildHost.resolve(project.directory, entry);
    if (named.has(dependencyPath))
      throw new SDKException(Resources.formatDependencyRepeated(project.name, entry));
    if (!await BuildHost.isFileAtExactPathAsync(project.directory, entry))
      throw new SDKException(Resources.formatDependencyMissing(project.name, entry));

    named.add(dependencyPath);

    return dependencyPath;
  }
}
