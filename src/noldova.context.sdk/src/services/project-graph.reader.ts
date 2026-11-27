/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { Project, ProjectKind } from "@noldova/context";
import { Dictionary, HashSet, type IReadOnlyList, List } from "@noldova/context.collections";
import { ExceptionOptions } from "@noldova/context.exceptions";
import { JsonReader } from "@noldova/context.json";

import { SDKException } from "../exceptions/sdk.exception.js";
import { BuildProject } from "../models/build-project.js";
import { ProjectDependencies } from "../models/project-dependencies.js";
import { Resources } from "../resources.js";
import { BuildHost } from "./build-host.js";

export class ProjectGraphReader {
  private readonly order: List<BuildProject> = new List<BuildProject>();
  private readonly visited: HashSet<string> = new HashSet<string>();
  private readonly manifestPaths: Dictionary<string, string> = new Dictionary<string, string>();

  private constructor() {
  }

  public static async readAsync(manifestPath: string): Promise<IReadOnlyList<BuildProject>> {
    const graph = new ProjectGraphReader();
    await graph.visitAsync(manifestPath, new List<Project>());

    return graph.order;
  }

  private async visitAsync(manifestPath: string, dependents: IReadOnlyList<Project>): Promise<void> {
    const text = await BuildHost.readAsync(manifestPath);
    const project = Project.parse(text, manifestPath, BuildHost.folderOf(manifestPath));
    const dependent = dependents.lastOrDefault();
    if (!Object.isUndefined(dependent) && project.kind === ProjectKind.Executable)
      throw new SDKException(Resources.formatDependencyExecutable(dependent.name, project.name));

    this.claimName(project);
    const path = dependents.append(project).toList();
    const named = new HashSet<string>();
    const dependencies = ProjectGraphReader.dependenciesOf(text, project);
    for (const entry of dependencies.projects) {
      const dependencyPath = await ProjectGraphReader.resolveAsync(project, entry, named);
      const cycle = path.skipWhile(t => t.manifestPath !== dependencyPath).select(t => t.name).toList();
      if (cycle.any())
        throw new SDKException(Resources.formatDependencyCycle(cycle.append(cycle.first())));
      if (!this.visited.contains(dependencyPath))
        await this.visitAsync(dependencyPath, path);
    }

    this.visited.add(manifestPath);
    this.order.add(new BuildProject(project, dependencies.packages));
  }

  private claimName(project: Project): void {
    const other = this.manifestPaths.tryGet(project.name);
    if (!Object.isUndefined(other))
      throw new SDKException(Resources.formatProjectNameRepeated(project.name, other, project.manifestPath));

    this.manifestPaths.set(project.name, project.manifestPath);
  }

  private static dependenciesOf(text: string, project: Project): ProjectDependencies {
    try {
      const reader = JsonReader.parse(text);
      if (!reader.hasField(Resources.dependenciesField))
        return new ProjectDependencies(new List<string>(), new List<string>());

      const dependencies = reader.readObject(Resources.dependenciesField);

      return new ProjectDependencies(ProjectGraphReader.namesOf(dependencies, Resources.projectsField), ProjectGraphReader.namesOf(dependencies, Resources.packagesField));
    }
    catch (exception) {
      throw new SDKException(Resources.formatDependenciesInvalid(project.name, exception), new ExceptionOptions(exception));
    }
  }

  private static namesOf(dependencies: JsonReader, field: string): IReadOnlyList<string> {
    return new List(dependencies.hasField(field) ? dependencies.readStringArray(field) : []);
  }

  private static async resolveAsync(project: Project, entry: string, named: HashSet<string>): Promise<string> {
    if (entry.includes(Resources.backslash) || BuildHost.isAbsolute(entry) || !entry.endsWith(Resources.projectExtension))
      throw new SDKException(Resources.formatDependencyNotRelative(project.name, entry));

    const dependencyPath = BuildHost.resolve(project.directory, entry);
    if (named.contains(dependencyPath))
      throw new SDKException(Resources.formatDependencyRepeated(project.name, entry));
    if (!await BuildHost.isFileAtExactPathAsync(project.directory, entry))
      throw new SDKException(Resources.formatDependencyMissing(project.name, entry));

    named.add(dependencyPath);

    return dependencyPath;
  }
}
