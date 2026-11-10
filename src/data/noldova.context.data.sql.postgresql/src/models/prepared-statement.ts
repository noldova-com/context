/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PreparedState } from "../enums/prepared-state.js";
import type { Exchange } from "./client/exchange.js";
import type { ValueSerializer } from "../types/value-serializer.js";
import type { BinaryColumns } from "./binary-columns.js";
import type { Column } from "./column.js";

export class PreparedStatement {
  public readonly name: string;
  public owner: Exchange | null;
  public oids: readonly number[] | null;
  public columns: readonly Column[] | null = null;
  public serializers: readonly ValueSerializer[] | null = null;
  public binary: BinaryColumns | null = null;
  public binaryOf: readonly Column[] | null = null;
  public state: PreparedState = PreparedState.Parsing;
  public version: number = -1;

  public constructor(name: string, owner: Exchange, oids: readonly number[] | null) {
    this.name = name;
    this.owner = owner;
    this.oids = oids;
  }
}
