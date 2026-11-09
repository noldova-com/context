/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { QueryCost } from "./query-cost.js";

export class QueryStatement {
  public name: string;
  public readonly text: string;
  public ends: boolean | null = null;
  public shape: string | null = null;
  public version: number = 0;
  public live: boolean = false;
  public used: number = 0;
  public cost: QueryCost | null = null;
  public alone: boolean | null = null;

  public constructor(name: string, text: string) {
    this.name = name;
    this.text = text;
  }
}
