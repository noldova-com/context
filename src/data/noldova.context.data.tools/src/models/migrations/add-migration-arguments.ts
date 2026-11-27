/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { DataToolsException } from "../../exceptions/data-tools.exception.js";
import { Resources } from "../../resources.js";

export class AddMigrationArguments {
  public readonly name: string;
  public readonly provider: string;
  public readonly context: string | null;
  public readonly output: string | null;

  public constructor(name: string, provider: string, context: string | null, output: string | null) {
    this.name = name;
    this.provider = provider;
    this.context = context;
    this.output = output;
  }

  public get providerName(): string {
    return this.provider.substring(this.provider.lastIndexOf(".") + 1);
  }

  public static parse(arguments_: readonly string[]): AddMigrationArguments {
    if (arguments_[0] !== Resources.addSubcommand)
      throw new DataToolsException(Resources.formatSubcommandUnknown(arguments_[0] ?? String.empty));

    const names: string[] = [];
    const options = new Map<string, string>();
    const queue = arguments_.slice(1);
    for (let argument = queue.shift(); !Object.isUndefined(argument); argument = queue.shift()) {
      if (!argument.startsWith(Resources.optionPrefix)) {
        names.push(argument);
        continue;
      }
      if (!Resources.options.includes(argument))
        throw new DataToolsException(Resources.formatOptionUnknown(argument));
      if (options.has(argument))
        throw new DataToolsException(Resources.formatOptionRepeated(argument));

      const value = queue.shift();
      if (Object.isUndefined(value) || value.startsWith(Resources.optionPrefix))
        throw new DataToolsException(Resources.formatOptionValueMissing(argument));

      options.set(argument, value);
    }

    return AddMigrationArguments.create(names, options);
  }

  private static create(names: readonly string[], options: ReadonlyMap<string, string>): AddMigrationArguments {
    const name = names.length === 1 ? names[0] : undefined;
    if (Object.isUndefined(name))
      throw new DataToolsException(Resources.formatMigrationNameCount(names.length));
    if (!Resources.migrationNamePattern.test(name))
      throw new DataToolsException(Resources.formatMigrationNameInvalid(name));

    const provider = options.get(Resources.providerOption);
    if (Object.isUndefined(provider))
      throw new DataToolsException(Resources.providerMissing);
    if (!Resources.providerPattern.test(provider))
      throw new DataToolsException(Resources.formatProviderInvalid(provider));

    return new AddMigrationArguments(name, provider, options.get(Resources.contextOption) ?? null, options.get(Resources.outputOption) ?? null);
  }
}
