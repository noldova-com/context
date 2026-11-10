/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { BuiltQuery } from "./built-query.js";
import type { QueryStatement } from "./query-statement.js";

export class QueryWire {
  public readonly statement: QueryStatement;
  public readonly built: BuiltQuery;

  public constructor(statement: QueryStatement, built: BuiltQuery) {
    this.statement = statement;
    this.built = built;
  }
}
