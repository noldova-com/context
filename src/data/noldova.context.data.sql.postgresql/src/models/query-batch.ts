/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Query } from "./client/query.js";
import type { QueryOutcome } from "../types/query-outcome.js";

export class QueryBatch {
  public readonly query: Query;
  public readonly parts: readonly Query[];
  public readonly results: QueryOutcome[];
  public readonly settled: boolean[];
  public left: number;
  public error: Error | null = null;
  public index: number = -1;
  public aborted: Error | null = null;

  public constructor(query: Query, parts: readonly Query[]) {
    this.query = query;
    this.parts = parts;
    this.results = parts.map(() => null);
    this.settled = parts.map(() => false);
    this.left = parts.length;
  }
}
