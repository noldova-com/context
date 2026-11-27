/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";
import type { EntityTypeDefinition } from "./entity-type-definition.js";

export class PropertyBuilder {
  private readonly definition: EntityTypeDefinition;
  private readonly name: string;

  public constructor(definition: EntityTypeDefinition, name: string) {
    this.definition = definition;
    this.name = name;
  }

  public hasColumnName(name: string): this {
    ArgumentException.throwIfNullOrWhitespace(name, Resources.nameParameterName);
    this.definition.columnNames.set(this.name, name);

    return this;
  }
}
