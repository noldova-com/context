/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Column } from "./column.js";

export class TransformOptions {
  public readonly undefinedValue: unknown;
  public readonly json: boolean | null;
  public readonly columnFrom: ((name: string) => string) | null;
  public readonly columnTo: ((name: string) => string) | null;
  public readonly valueFrom: ((value: unknown, column: Column) => unknown) | null;
  public readonly valueTo: ((value: unknown) => unknown) | null;
  public readonly rowFrom: ((row: unknown) => unknown) | null;
  public readonly rowTo: ((row: unknown) => unknown) | null;

  public constructor(values: Partial<TransformOptions> = {}) {
    this.undefinedValue = values.undefinedValue;
    this.json = values.json ?? null;
    this.columnFrom = values.columnFrom ?? null;
    this.columnTo = values.columnTo ?? null;
    this.valueFrom = values.valueFrom ?? null;
    this.valueTo = values.valueTo ?? null;
    this.rowFrom = values.rowFrom ?? null;
    this.rowTo = values.rowTo ?? null;
  }
}
