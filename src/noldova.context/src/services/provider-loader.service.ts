/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import "@noldova/context.core";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { ProviderException } from "../exceptions/provider.exception.js";
import { Command } from "../models/command.js";
import type { Project } from "../models/project.js";
import { Resources } from "../resources.js";
import type { CommandClass } from "../types/command-class.js";

export class ProviderLoaderService {
  public static async loadAsync(project: Project, identity: string): Promise<readonly Command[]> {
    let modulePath: string;
    try {
      modulePath = createRequire(project.manifestPath).resolve(Resources.formatPackageName(identity));
    }
    catch (exception) {
      throw new ProviderException(identity, Resources.formatProviderMissing(identity, project.manifestPath), new ExceptionOptions(exception));
    }

    let loaded: object;
    try {
      loaded = await import(pathToFileURL(modulePath).href);
    }
    catch (exception) {
      throw new ProviderException(identity, Resources.formatProviderUnloadable(identity), new ExceptionOptions(exception));
    }

    const commands = ProviderLoaderService.readCommandClasses(loaded).map(t => new t());
    if (commands.length === 0)
      throw new ProviderException(identity, Resources.formatProviderEmpty(identity));

    return commands;
  }

  private static readCommandClasses(loaded: object): readonly CommandClass[] {
    const classes: CommandClass[] = [];
    for (const name of Object.keys(loaded).sort()) {
      const value: unknown = Reflect.get(loaded, name);
      if (ProviderLoaderService.isCommandClass(value))
        classes.push(value);
    }

    return classes;
  }

  private static isCommandClass(value: unknown): value is CommandClass {
    return Object.isFunction(value) && Command.isPrototypeOf(value);
  }
}
