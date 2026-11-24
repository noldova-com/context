/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { CommandCollisionException } from "../exceptions/command-collision.exception.js";
import { CommandHostException } from "../exceptions/command-host.exception.js";
import { CommandUnknownException } from "../exceptions/command-unknown.exception.js";
import { ProjectFileException } from "../exceptions/project-file.exception.js";
import { CommandContext } from "../models/command-context.js";
import type { CommandOutput } from "../models/command-output.js";
import type { Command } from "../models/command.js";
import type { Project } from "../models/project.js";
import { Resources } from "../resources.js";
import { ProjectFileService } from "./project-file.service.js";
import { ProviderLoaderService } from "./provider-loader.service.js";

export class CommandHost {
  private readonly output: CommandOutput;

  public constructor(output: CommandOutput) {
    this.output = output;
  }

  public async runAsync(arguments_: readonly string[], directory: string): Promise<number> {
    try {
      const commandName = arguments_.at(0);
      if (Object.isUndefined(commandName) || Resources.helpOptions.includes(commandName))
        return await this.helpAsync(arguments_.slice(1), directory);

      const rest = arguments_.slice(1);
      const project = await CommandHost.readProjectAsync(rest, directory);
      const command = (await this.readCommandsAsync(project)).get(commandName);
      if (Object.isUndefined(command))
        throw new CommandUnknownException(commandName);

      return await command.runAsync(new CommandContext(project, CommandHost.removeProjectOption(rest), this.output));
    }
    catch (exception) {
      if (!(exception instanceof CommandHostException))
        throw exception;

      this.output.writeErrorLine(exception.message);
      return 1;
    }
  }

  private async helpAsync(arguments_: readonly string[], directory: string): Promise<number> {
    const manifestPath = CommandHost.readProjectOption(arguments_) ?? await ProjectFileService.findAsync(directory);
    this.output.writeLine(Resources.usage);
    if (Object.isUndefined(manifestPath)) {
      this.output.writeLine(Resources.noProjectNote);
      return 0;
    }

    const commands = await this.readCommandsAsync(await ProjectFileService.readAsync(manifestPath, directory));
    this.output.writeLine(Resources.commandsHeading);
    for (const command of [...commands.values()].sort((first, second) => first.name < second.name ? -1 : 1))
      this.output.writeLine(Resources.formatCommandLine(command.name, command.description));

    return 0;
  }

  private async readCommandsAsync(project: Project): Promise<ReadonlyMap<string, Command>> {
    const commands = new Map<string, Command>();
    const owners = new Map<string, string>();

    for (const identity of project.providers)
      for (const command of await ProviderLoaderService.loadAsync(project, identity)) {
        const owner = owners.get(command.name);
        if (!Object.isUndefined(owner))
          throw new CommandCollisionException(command.name, owner, identity);

        commands.set(command.name, command);
        owners.set(command.name, identity);
      }

    return commands;
  }

  private static async readProjectAsync(arguments_: readonly string[], directory: string): Promise<Project> {
    const manifestPath = CommandHost.readProjectOption(arguments_) ?? await ProjectFileService.findAsync(directory);
    if (Object.isUndefined(manifestPath))
      throw new ProjectFileException(directory, Resources.formatProjectNotFound(directory));

    return ProjectFileService.readAsync(manifestPath, directory);
  }

  private static readProjectOption(arguments_: readonly string[]): string | undefined {
    const index = CommandHost.indexOfProjectOption(arguments_);
    if (index === -1)
      return undefined;

    const value = arguments_.at(index + 1);
    if (Object.isUndefined(value) || value === Resources.argumentsSeparator)
      throw new ProjectFileException(Resources.projectOption, Resources.projectOptionValueMissing);

    return value;
  }

  private static removeProjectOption(arguments_: readonly string[]): readonly string[] {
    const index = CommandHost.indexOfProjectOption(arguments_);
    return index === -1 ? arguments_ : [...arguments_.slice(0, index), ...arguments_.slice(index + 2)];
  }

  private static indexOfProjectOption(arguments_: readonly string[]): number {
    const separator = arguments_.indexOf(Resources.argumentsSeparator);
    const options = separator === -1 ? arguments_ : arguments_.slice(0, separator);
    return options.indexOf(Resources.projectOption);
  }
}
