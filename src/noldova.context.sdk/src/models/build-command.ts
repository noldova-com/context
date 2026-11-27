/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command, type CommandContext } from "@noldova/context";
import { Enumerable } from "@noldova/context.collections";

import { Resources } from "../resources.js";
import { PluginCatalog } from "../plugins/plugin-catalog.js";
import { PluginBuilder } from "../plugins/services/plugin-builder.js";
import { ProjectGraphReader } from "../services/project-graph.reader.js";

export class BuildCommand extends Command {
  public override readonly name: string = Resources.commandName;
  public override readonly description: string = Resources.commandDescription;

  public override async runAsync(context: CommandContext): Promise<number> {
    if (Enumerable.from(context.arguments).any(t => Resources.helpOptions.contains(t))) {
      for (const line of Resources.usage)
        context.output.writeLine(line);

      return 0;
    }

    for (const build of await ProjectGraphReader.readAsync(context.projectFilePath)) {
      context.output.writeLine(Resources.formatBuilding(build.project.name));
      if (!await PluginBuilder.buildAsync(build, PluginCatalog.all, context.arguments, context.output)) {
        context.output.writeErrorLine(Resources.formatBuildFailed(build.project.name));

        return 1;
      }

      context.output.writeLine(Resources.formatBuilt(build.project.name));
    }

    return 0;
  }
}
