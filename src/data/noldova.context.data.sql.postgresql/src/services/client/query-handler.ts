/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ClientOptions } from "../../models/client-options.js";
import type { Query } from "../../models/client/query.js";

export abstract class QueryHandler {
  public abstract get options(): ClientOptions;

  public abstract handle(query: Query): void;

  public abstract cancelAsync(query: Query): Promise<void>;
}
