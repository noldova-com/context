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
import type { ProjectConfiguration } from "../models/project-configuration.js";
import { ProjectPluginContext } from "../models/project-plugin-context.js";
import { SourceFile } from "../models/source-file.js";
import { SourceText } from "../models/source-text.js";
import { PluginResources } from "../plugin-resources.js";
import { DeclarationResolver } from "./declaration-resolver.js";
import { PluginHost } from "./plugin-host.js";
import { SourceMapComposer } from "./source-map-composer.js";
import { SourceRewriter } from "./source-rewriter.js";

export class PluginBuilder {
  public static async buildAsync(build: BuildProject, plugins: IReadOnlyList<Plugin>, arguments_: readonly string[], output: CommandOutput): Promise<boolean> {
    const project = build.project;
    await PluginHost.clearAsync(PluginBuilder.generatedRootOf(project.directory));
    const selected = build.packages.selectMany(name => plugins.where(t => t.packageName === name)).toList();
    if (!selected.any())
      return BuildHost.compileAsync(project, arguments_, output);

    const configurationPath = PluginHost.join(project.directory, Resources.configurationFileName);
    const configuration = await PluginHost.readConfigurationAsync(project, configurationPath);
    if (Object.isUndefined(configuration)) {
      if (!await BuildHost.compileAsync(project, [PluginResources.noEmitOption, ...arguments_], output))
        return false;

      throw new SDKException(PluginResources.formatConfigurationFoldersMissing(configurationPath));
    }

    const context = await PluginBuilder.runAsync(build, configuration, selected, output);
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

  private static async runAsync(build: BuildProject, configuration: ProjectConfiguration, plugins: IReadOnlyList<Plugin>, output: CommandOutput): Promise<ProjectPluginContext> {
    const project = build.project;
    if (configuration.rootDirectory !== project.directory && !PluginHost.isInside(project.directory, configuration.rootDirectory))
      throw new SDKException(PluginResources.formatRootOutsideProject(project.name, configuration.rootDirectory));

    const inputs = await PluginHost.listInputsAsync(configuration.rootDirectory,
      new List([PluginHost.join(project.directory, PluginResources.buildFolderName), configuration.outputDirectory]));
    const sources = new List<SourceFile>();
    for (const path of configuration.files.where(t => PluginHost.isInside(configuration.rootDirectory, t) && t.endsWith(PluginResources.sourceExtension)
      && !t.endsWith(PluginResources.declarationExtension))) {
      const text = await BuildHost.readAsync(path);
      sources.add(SourceFile.parse(path, text, TypeScriptSourceKind.Code));
    }

    const context = new ProjectPluginContext(project, configuration, inputs, sources, new DeclarationResolver(project.manifestPath, sources));
    for (const plugin of plugins)
      context.run(plugin);
    for (const line of context.lines)
      output.writeLine(line);

    return context;
  }

  private static async writeAsync(context: ProjectPluginContext): Promise<GeneratedProject> {
    const root = PluginBuilder.generatedRootOf(context.projectDirectory);
    const copyOf = (path: string): string => PluginHost.join(root, PluginHost.relativePath(context.projectDirectory, path));
    const maps = new Dictionary<string, PositionMap>();
    const sources = context.sources.select(t => t.path).toHashSet();
    for (const input of context.inputs) {
      await PluginHost.copyAsync(input, copyOf(input));
      if (!sources.contains(input) && PluginResources.compiledInputExtensions.any(t => input.endsWith(t)))
        maps.set(copyOf(input), PositionMap.identityOf(copyOf(input), SourceText.of(input, await BuildHost.readAsync(input))));
    }

    const written = new List<PositionMap>();
    for (const source of context.sources)
      written.add(SourceRewriter.rewrite(copyOf(source.path), source, context.editsOf(source)));
    for (const file of context.addedFiles) {
      const path = PluginHost.join(copyOf(context.configuration.rootDirectory), file.path);
      written.add(new PositionMap(path, file.text, new PositionSegment(0, file.text.length, file.origin.source, file.origin.span.startOffset, true), new List<PositionSegment>()));
    }
    for (const map of written) {
      maps.set(map.path, map);
      await PluginHost.writeAsync(map.path, map.text);
    }

    const files = context.configuration.files.select(t => PluginHost.isInside(context.configuration.rootDirectory, t) ? copyOf(t) : t)
      .concat(context.addedFiles.select(t => PluginHost.join(copyOf(context.configuration.rootDirectory), t.path)));
    const configurationPath = PluginHost.join(root, Resources.configurationFileName);
    await PluginHost.writeAsync(configurationPath, JSON.stringify({
      extends: PluginHost.relativePath(root, PluginHost.join(context.projectDirectory, Resources.configurationFileName)),
      compilerOptions: {
        rootDir: PluginHost.relativePath(root, copyOf(context.configuration.rootDirectory)),
        outDir: PluginHost.relativePath(root, context.configuration.outputDirectory),
        ...context.configuration.paths.any()
          ? { paths: Object.fromEntries(context.configuration.paths.select((t): readonly [string, readonly string[]] => [t.key, t.value.select(path => PluginBuilder.relativeTo(root,
            PluginHost.isInside(context.configuration.rootDirectory, path) ? copyOf(path) : path)).toArray()])) }
          : {}
      },
      files: files.select(t => PluginHost.relativePath(root, t)).toArray(),
      include: []
    }, undefined, 2));

    return new GeneratedProject(configurationPath, context.configuration.outputDirectory, maps);
  }

  private static relativeTo(folder: string, path: string): string {
    const relative = PluginHost.relativePath(folder, path);

    return relative.startsWith(PluginResources.relativePrefix) ? relative : `${PluginResources.relativeCurrentFolder}${relative}`;
  }

  private static generatedRootOf(projectDirectory: string): string {
    return PluginHost.join(projectDirectory, ...PluginResources.generatedFolder);
  }
}
