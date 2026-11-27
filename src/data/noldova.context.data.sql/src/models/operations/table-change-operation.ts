/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Table } from "../schema/table.js";
import { SchemaOperation } from "./schema-operation.js";

export abstract class TableChangeOperation extends SchemaOperation {
  public readonly table: string;

  protected constructor(table: string) {
    super();

    this.table = table;
  }

  public abstract applyTo(table: Table): Table;
}
