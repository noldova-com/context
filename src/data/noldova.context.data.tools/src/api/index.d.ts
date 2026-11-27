/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command, CommandHostException, type CommandContext } from "@noldova/context";
import type { ExceptionOptions } from "@noldova/context.exceptions";

/**
 * Raised when a data tool can't do what it was asked, such as when the
 * project's sources don't parse or a mapped entity has no source class; its
 * message says why.
 */
export declare class DataToolsException extends CommandHostException {
  /**
   * Initializes the exception with its message.
   */
  public constructor(message: string, options?: ExceptionOptions);
}

/**
 * Raised when a mapped entity's property has a type the tool can't map to a
 * column or a navigation: a string, a number, either with `| null`, a mapped
 * entity class with `| null`, or an array of one.
 */
export declare class EntityPropertyTypeException extends DataToolsException {
  /**
   * The entity class's name.
   */
  public readonly entity: string;

  /**
   * The property's name.
   */
  public readonly property: string;

  /**
   * Initializes the exception, its message naming the entity and the property.
   */
  public constructor(entity: string, property: string);
}

/**
 * `ctx migrations add <Name> --provider <identity> [--context <Class>]
 * [--output <folder>]`: writes the next migration of the project's data
 * context, its model snapshot and the list of its migrations, from the
 * built project. The README describes the use.
 */
export declare class MigrationsCommand extends Command {
  /**
   * `migrations`.
   */
  public override readonly name: string;

  /**
   * One line that `ctx --help` shows.
   */
  public override readonly description: string;

  /**
   * Shows the use with no arguments, `-h` or `--help`, and returns 0.
   * Otherwise adds the migration, or says that the model matches the last
   * migration's snapshot and writes nothing, and returns 0. A wrong argument
   * or a project the command can't read throws `DataToolsException`, which
   * `ctx` reports, returning 1; nothing is written then.
   */
  public override runAsync(context: CommandContext): Promise<number>;
}
