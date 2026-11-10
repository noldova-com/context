/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";

import { BuiltQuery } from "../built-query.js";
import type { QueryOptions } from "../query-options.js";
import { TypedParameter } from "../typed-parameter.js";
import { Resources } from "../../resources.js";
import { TypeRegistry } from "../type-registry.js";
import { Query } from "./query.js";
import type { QueryHandler } from "../../services/client/query-handler.js";

export class ClientQuery extends Query {
  private static readonly maxParameters: number = 65534;

  private sql: string;
  private readonly args: readonly unknown[];
  private readonly types: TypeRegistry;
  private composed: BuiltQuery | null = null;

  public constructor(source: string, args: readonly unknown[], handler: QueryHandler, options: QueryOptions, types: TypeRegistry) {
    super(new BuiltQuery(source, [], []), handler, options);
    this.sql = source;
    this.args = args;
    this.types = types;
  }

  public load(source: string): void {
    this.sql = source;
  }

  public override build(): BuiltQuery {
    this.composed ??= this.compose();
    return this.composed;
  }

  private compose(): BuiltQuery {
    const options = this.handler.options;
    const values: unknown[] = [];
    const oids: number[] = [];
    for (const arg of this.args) {
      const typed = arg instanceof TypedParameter;
      let value = typed ? arg.value : arg;
      if (Object.isUndefined(value)) {
        value = options.transform.undefinedValue;
        if (Object.isUndefined(value))
          throw new DataException(Resources.undefinedValue);
      }

      values.push(value);
      oids.push(this.types.resolve(typed ? arg.type : options.infer ? TypeRegistry.infer(value) : 0));
    }

    if (values.length >= ClientQuery.maxParameters)
      throw new DataException(Resources.tooManyParameters);

    return new BuiltQuery(this.sql, values, oids);
  }
}
