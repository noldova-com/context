/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command, type CommandContext } from "@noldova/context";

import { Resources } from "../resources.js";
import { BuildHost } from "../services/build-host.js";
import { ProjectGraphReader } from "../services/project-graph.reader.js";

export class BuildCommand extends Command {
  public override readonly name: string = Resources.commandName;
  public override readonly description: string = Resources.commandDescription;

  public override async runAsync(context: CommandContext): Promise<number> {
    if (context.arguments.some(t => Resources.helpOptions.includes(t))) {
      for (const line of Resources.usage)
        context.output.writeLine(line);

      return 0;
    }

    for (const project of await ProjectGraphReader.readAsync(context.projectFilePath)) {
      context.output.writeLine(Resources.formatBuilding(project.name));
      if (!await BuildHost.compileAsync(project, context.arguments, context.output)) {
        context.output.writeErrorLine(Resources.formatBuildFailed(project.name));

        return 1;
      }

      context.output.writeLine(Resources.formatBuilt(project.name));
    }

    return 0;
  }
}
