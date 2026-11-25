/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { readFile } from "node:fs/promises";

import "@noldova/context.core";
import { JsonReader } from "@noldova/context.json";

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
        return await this.helpAsync(directory);
      if (Resources.versionOptions.includes(commandName)) {
        this.output.writeLine(Resources.formatVersion(await CommandHost.readVersionAsync()));
        return 0;
      }

      const project = await CommandHost.readProjectAsync(directory);
      const command = (await this.readCommandsAsync(project)).get(commandName);
      if (Object.isUndefined(command))
        throw new CommandUnknownException(commandName);

      return await command.runAsync(new CommandContext(project.manifestPath, arguments_.slice(1), this.output));
    }
    catch (exception) {
      if (!(exception instanceof CommandHostException))
        throw exception;

      this.output.writeErrorLine(exception.message);
      return 1;
    }
  }

  private async helpAsync(directory: string): Promise<number> {
    const manifestPath = await ProjectFileService.findAsync(directory);
    this.output.writeLine(Resources.usage);
    if (Object.isUndefined(manifestPath)) {
      this.output.writeLine(Resources.noProjectNote);
      return 0;
    }

    const commands = await this.readCommandsAsync(await ProjectFileService.readAsync(manifestPath, directory));
    this.output.writeLine(Resources.commandsHeading);
    for (const command of [...commands.values()].sort((first, second) => Number(first.name > second.name) - Number(first.name < second.name)))
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

  private static async readVersionAsync(): Promise<string> {
    const text = await readFile(new URL(Resources.hostManifestPath, import.meta.url), Resources.textEncoding);
    return JsonReader.parse(text).readNonBlankString(Resources.versionField);
  }

  private static async readProjectAsync(directory: string): Promise<Project> {
    const manifestPath = await ProjectFileService.findAsync(directory);
    if (Object.isUndefined(manifestPath))
      throw new ProjectFileException(directory, Resources.formatProjectNotFound(directory));

    return ProjectFileService.readAsync(manifestPath, directory);
  }
}
