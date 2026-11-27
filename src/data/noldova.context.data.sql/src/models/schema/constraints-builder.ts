/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";

import { ForeignKey } from "./foreign-key.js";
import { PrimaryKey } from "./primary-key.js";
import type { ColumnSelector } from "../../types/column-selector.js";

export class ConstraintsBuilder<TModel> {
  private key: PrimaryKey | null = null;
  private readonly foreignKeys: ForeignKey[] = [];

  public addPrimaryKey(...columns: readonly (string | ColumnSelector<TModel>)[]): this {
    this.key = new PrimaryKey(columns.map(t => ConstraintsBuilder.nameOf(t)));
    return this;
  }

  public addForeignKey<TPrincipal>(column: string | ColumnSelector<TModel>, principalTable: string, principalColumn: string | ColumnSelector<TPrincipal>): this {
    this.foreignKeys.push(new ForeignKey(ConstraintsBuilder.nameOf(column), principalTable, ConstraintsBuilder.nameOf(principalColumn)));
    return this;
  }

  public toPrimaryKey(): PrimaryKey | null {
    return this.key;
  }

  public toForeignKeys(): readonly ForeignKey[] {
    return [...this.foreignKeys];
  }

  private static nameOf<T>(column: string | ColumnSelector<T>): string {
    return Object.isString(column) ? column : nameof<T>(column);
  }
}
