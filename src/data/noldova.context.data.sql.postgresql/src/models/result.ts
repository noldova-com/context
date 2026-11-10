/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { Exchange } from "./client/exchange.js";
import type { BackendKey } from "./backend-key.js";
import type { Column } from "./column.js";
import { StatementDescription } from "./statement-description.js";

export class Result extends Array<unknown> {
  public count: number | null = null;
  public state: BackendKey | null = null;
  public command: string | null = null;
  public columns: readonly Column[] | null = null;
  private source: Exchange | StatementDescription | null = null;

  public constructor() {
    super();
  }

  public static override get [Symbol.species](): ArrayConstructor {
    return Array;
  }

  public get statement(): StatementDescription | null {
    if (this.source instanceof StatementDescription || Object.isNull(this.source))
      return this.source;

    this.source = this.source.describe();
    return this.source;
  }

  public set statement(source: Exchange | StatementDescription | null) {
    this.source = source;
  }
}
