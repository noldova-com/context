/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";

import { QueryOptions } from "../../models/query-options.js";
import { TypedParameter } from "../../models/typed-parameter.js";
import { Resources } from "../../resources.js";
import type { QueryOutcome } from "../../types/query-outcome.js";
import type { QuerySettings } from "../../types/query-settings.js";
import type { TypeRegistry } from "../../models/type-registry.js";
import { ClientQuery } from "../../models/client/client-query.js";
import { FileQueryHandler } from "./file-query-handler.js";
import type { Query } from "../../models/client/query.js";
import type { QueryHandler } from "./query-handler.js";

export abstract class SqlRunner {
  private static readonly jsonOid: number = 3802;

  protected readonly types: TypeRegistry;

  protected constructor(types: TypeRegistry) {
    this.types = types;
  }

  protected abstract get handler(): QueryHandler;

  public formatIdentifier(...parts: string[]): string {
    if (parts.length === 0)
      throw new ArgumentException(Resources.identifierPartsMissing, Resources.partsParameterName);

    return parts.map(part => SqlRunner.quote(part)).join(Resources.identifierSeparator);
  }

  public createTypedParameter(value: unknown, type: number | string): TypedParameter {
    return new TypedParameter(value, type);
  }

  public createJsonParameter(value: unknown): TypedParameter {
    return new TypedParameter(value, SqlRunner.jsonOid);
  }

  public static quote(name: string): string {
    return Resources.identifierQuote + name.replaceAll(Resources.identifierQuote, Resources.identifierQuote + Resources.identifierQuote) + Resources.identifierQuote;
  }

  public query(text: string, values: readonly unknown[] = [], settings: QuerySettings = {}): ClientQuery {
    return new ClientQuery(text, values, this.handler, new QueryOptions(settings.simple ?? false, settings.prepare ?? null), this.types);
  }

  public runUnsafe(text: string, values: readonly unknown[] = [], settings: QuerySettings = {}): ClientQuery {
    return new ClientQuery(text, values, this.handler, new QueryOptions(settings.simple ?? values.length === 0, settings.prepare ?? false), this.types);
  }

  public runFile(path: string, values: readonly unknown[] = [], settings: QuerySettings = {}): ClientQuery {
    const handler = new FileQueryHandler(path, this.handler);
    return new ClientQuery(String.empty, values, handler, new QueryOptions(settings.simple ?? values.length === 0, settings.prepare ?? null), this.types);
  }

  public batch(queries: readonly Query[]): ClientQuery {
    for (const [index, query] of queries.entries()) {
      if (query.executed)
        throw new ArgumentException(Resources.formatBatchItemExecuted(index), Resources.queriesParameterName);
      if (!Object.isNull(query.cursorFn) || query.cursorRows > 0 || query.streaming || !Object.isNull(query.forEachFn) || query.onlyDescribe)
        throw new ArgumentException(Resources.formatBatchItemUnsupported(index), Resources.queriesParameterName);
    }

    const batch = new ClientQuery(String.empty, [], this.handler, new QueryOptions(), this.types);
    batch.parts = queries;
    for (const query of queries) {
      query.executed = true;
      query.owner = batch;
    }

    return batch;
  }

  public async notifyAsync(channel: string, payload: unknown): Promise<QueryOutcome> {
    return await this.query(Resources.notifyQuery, [channel, String(payload)]);
  }
}
