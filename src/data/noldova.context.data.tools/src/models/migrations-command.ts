/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command, type CommandContext } from "@noldova/context";

import { Resources } from "../resources.js";
import { MigrationAdder } from "../services/migration-adder.js";
import { ProjectSources } from "../services/project-sources.js";
import { AddMigrationArguments } from "./migrations/add-migration-arguments.js";

export class MigrationsCommand extends Command {
  public override readonly name: string = Resources.commandName;
  public override readonly description: string = Resources.commandDescription;

  public override async runAsync(context: CommandContext): Promise<number> {
    if (context.arguments.length === 0 || context.arguments.some(t => Resources.helpOptions.includes(t))) {
      for (const line of Resources.usage)
        context.output.writeLine(line);

      return 0;
    }

    const arguments_ = AddMigrationArguments.parse(context.arguments);
    const written = await MigrationAdder.addAsync(await ProjectSources.openAsync(context.projectFilePath), arguments_, new Date());
    if (written.length === 0)
      context.output.writeLine(Resources.noChange);
    else
      for (const path of written)
        context.output.writeLine(Resources.formatWritten(path));

    return 0;
  }
}
