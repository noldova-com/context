/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class SchemaQueries {
  public readonly columns: string;
  public readonly key: string;
  public readonly foreignKeys: string;

  public constructor(columns: string, key: string, foreignKeys: string) {
    this.columns = columns;
    this.key = key;
    this.foreignKeys = foreignKeys;
  }
}
