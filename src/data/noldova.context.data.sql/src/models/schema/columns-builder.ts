/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";

import type { Column } from "./column.js";
import type { ColumnSelector } from "../../types/column-selector.js";
import { ColumnBuilder } from "./column-builder.js";

export class ColumnsBuilder<TModel> {
  private readonly columns: ColumnBuilder[] = [];

  public addColumn(name: string, type: string): ColumnBuilder;
  public addColumn(selector: ColumnSelector<TModel>, type: string): ColumnBuilder;
  public addColumn(nameOrSelector: string | ColumnSelector<TModel>, type: string): ColumnBuilder {
    const column = new ColumnBuilder(Object.isString(nameOrSelector) ? nameOrSelector : nameof<TModel>(nameOrSelector), type);
    this.columns.push(column);
    return column;
  }

  public toColumns(): readonly Column[] {
    return this.columns.map(t => t.toColumn());
  }
}
