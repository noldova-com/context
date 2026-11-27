/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";
import { Column } from "./column.js";

export class ColumnBuilder {
  private isNullable: boolean = false;
  private defaultValueSql: string | null = null;

  public readonly name: string;
  public readonly type: string;

  public constructor(name: string, type: string) {
    this.name = name;
    this.type = type;
  }

  public makeNullable(): this {
    this.isNullable = true;
    return this;
  }

  public hasDefaultValue(value: string | number): this {
    this.defaultValueSql = Object.isString(value)
      ? Resources.stringQuote + value.replaceAll(Resources.stringQuote, Resources.escapedStringQuote) + Resources.stringQuote
      : String(value);

    return this;
  }

  public hasDefaultValueSql(sql: string): this {
    ArgumentException.throwIfNullOrWhitespace(sql, Resources.sqlParameterName);

    this.defaultValueSql = sql;

    return this;
  }

  public toColumn(): Column {
    return new Column(this.name, this.type, this.isNullable, this.defaultValueSql);
  }
}
