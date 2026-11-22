/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DataRecord } from "@noldova/context.data";

import type { Column } from "./column.js";
import type { Result } from "./result.js";
import { ValueConverter } from "../services/value-converter.js";

export class DescribedResult {
  public readonly result: Result;
  public readonly columns: readonly Column[];

  public constructor(result: Result, columns: readonly Column[]) {
    this.result = result;
    this.columns = columns;
  }

  public toRecords(): readonly DataRecord[] {
    return this.result.map(row => ValueConverter.readRecord(this.columns, row));
  }
}
