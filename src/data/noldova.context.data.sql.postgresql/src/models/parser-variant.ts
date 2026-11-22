/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ValueParser } from "../types/value-parser.js";
import type { Column } from "./column.js";

export class ParserVariant {
  public readonly parsers: readonly (ValueParser | null)[];
  public readonly columns: readonly Column[];

  public constructor(parsers: readonly (ValueParser | null)[], columns: readonly Column[]) {
    this.parsers = parsers;
    this.columns = columns;
  }
}
