/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import type { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
import { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";

export class FailingQuery extends Query {
  public override build(): BuiltQuery {
    throw new DataException("The query cannot be built.");
  }
}
