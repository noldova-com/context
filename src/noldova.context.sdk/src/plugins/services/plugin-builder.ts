/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { CommandOutput } from "@noldova/context";
import { Dictionary, type IReadOnlyList, List } from "@noldova/context.collections";
import { TypeScriptSourceKind } from "@noldova/context.parsers.typescript";

import { SDKException } from "../../exceptions/sdk.exception.js";
import type { BuildProject } from "../../models/build-project.js";
import { Resources } from "../../resources.js";
import { BuildHost } from "../../services/build-host.js";
import { GeneratedProject } from "../models/generated-project.js";
import { MappedOutput } from "../models/mapped-output.js";
import type { Plugin } from "../models/plugin.js";
import { PositionMap } from "../models/position-map.js";
import { PositionSegment } from "../models/position-segment.js";
import { ProjectPluginContext } from "../models/project-plugin-context.js";
import { SourceFile } from "../models/source-file.js";
import { PluginResources } from "../plugin-resources.js";
import { DeclarationResolver } from "./declaration-resolver.js";
import { PluginHost } from "./plugin-host.js";
import { SourceMapComposer } from "./source-map-composer.js";
import { SourceRewriter } from "./source-rewriter.js";

export class PluginBuilder {
  public static async buildAsync(build: BuildProject, plugins: IReadOnlyList<Plugin>, arguments_: readonly string[], output: CommandOutput): Promise<boolean> {
    const project = build.project;
    const selected = plugins.where(t => build.packages.contains(t.packageName)).toList();
    if (!selected.any())
      return BuildHost.compileAsync(project, arguments_, output);

    const context = await PluginBuilder.runAsync(build, selected, output);
    if (context.hasErrors)
      return false;
    if (!context.isChanged)
      return BuildHost.compileAsync(project, arguments_, output);
    if (!await BuildHost.compileAsync(project, [PluginResources.noEmitOption, ...arguments_], output))
      return false;

    const generated = await PluginBuilder.writeAsync(context);
    if (!await BuildHost.compileWithAsync(project, generated.configurationPath, [PluginResources.noCheckOption, ...arguments_],
      new MappedOutput(output, project.directory, generated.maps)))
      return false;

    await SourceMapComposer.composeAsync(generated.outputDirectory, generated.maps);

    return true;
  }

  private static async runAsync(build: BuildProject, plugins: IReadOnlyList<Plugin>, output: CommandOutput): Promise<ProjectPluginContext> {
    const project = build.project;
    const configuration = PluginHost.join(project.directory, Resources.configurationFileName);
    const rootDirectory = await PluginHost.readConfigurationFolderAsync(configuration, PluginResources.rootDirectoryField);
    const outputDirectory = await PluginHost.readConfigurationFolderAsync(configuration, PluginResources.outputDirectoryField);
    if (rootDirectory !== project.directory && !PluginHost.isInside(project.directory, rootDirectory))
      throw new SDKException(PluginResources.formatRootOutsideProject(project.name, rootDirectory));

    const paths = await PluginHost.listSourcesAsync(rootDirectory, new List([PluginHost.join(project.directory, PluginResources.buildFolderName), outputDirectory]));
    const sources = new List<SourceFile>();
    for (const path of paths) {
      const text = await BuildHost.readAsync(path);
      sources.add(SourceFile.parse(path, text, TypeScriptSourceKind.Code));
    }

    const context = new ProjectPluginContext(project, rootDirectory, outputDirectory, sources, new DeclarationResolver(project.manifestPath, sources));
    for (const plugin of plugins)
      context.run(plugin);
    for (const line of context.lines)
      output.writeLine(line);

    return context;
  }

  private static async writeAsync(context: ProjectPluginContext): Promise<GeneratedProject> {
    const root = PluginHost.join(context.projectDirectory, ...PluginResources.generatedFolder);
    await PluginHost.clearAsync(root);
    const maps = new Dictionary<string, PositionMap>();
    for (const source of context.sources) {
      const path = PluginHost.join(root, PluginHost.relativePath(context.projectDirectory, source.path));
      maps.set(path, SourceRewriter.rewrite(path, source, context.editsOf(source)));
    }
    for (const file of context.addedFiles) {
      const path = PluginHost.join(root, PluginHost.relativePath(context.projectDirectory, context.rootDirectory), file.path);
      maps.set(path, new PositionMap(path, file.text, new PositionSegment(0, file.text.length, file.origin.source, file.origin.span.startOffset, true), new List<PositionSegment>()));
    }
    for (const map of maps.values())
      await PluginHost.writeAsync(map.path, map.text);

    const configurationPath = PluginHost.join(root, Resources.configurationFileName);
    await PluginHost.writeAsync(configurationPath, JSON.stringify({
      extends: PluginHost.relativePath(root, PluginHost.join(context.projectDirectory, Resources.configurationFileName)),
      compilerOptions: {
        rootDir: PluginHost.relativePath(root, PluginHost.join(root, PluginHost.relativePath(context.projectDirectory, context.rootDirectory))),
        outDir: PluginHost.relativePath(root, context.outputDirectory)
      },
      include: [PluginResources.includeEverything]
    }, undefined, 2));

    return new GeneratedProject(configurationPath, context.outputDirectory, maps);
  }
}
