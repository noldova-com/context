/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { Exchange } from "./exchange.js";
import type { Query } from "./query.js";

export class SentCancel {
  public readonly query: Query | null;
  public through: Exchange | null = null;

  public constructor(query: Query | null) {
    this.query = query;
  }
}
