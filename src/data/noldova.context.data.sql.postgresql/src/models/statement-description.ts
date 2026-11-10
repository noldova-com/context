/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Column } from "./column.js";

export class StatementDescription {
  public readonly name: string;
  public readonly text: string;
  public readonly types: readonly number[];
  public readonly columns: readonly Column[];

  public constructor(name: string, text: string, types: readonly number[], columns: readonly Column[]) {
    this.name = name;
    this.text = text;
    this.types = types;
    this.columns = columns;
  }
}
