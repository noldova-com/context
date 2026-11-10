/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";
import { SchemaOperation } from "./schema-operation.js";

export class SqlStatementOperation extends SchemaOperation {
  public readonly statement: string;

  public constructor(statement: string) {
    super();
    ArgumentException.throwIfNullOrWhitespace(statement, Resources.statementParameterName);

    this.statement = statement;
  }

  public override render(): string {
    return this.statement;
  }
}
