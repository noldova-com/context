/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { BuiltQuery } from "../built-query.js";
import { QueryCost } from "../query-cost.js";
import { QueryStatement } from "../query-statement.js";
import { Resources } from "../../resources.js";

export class StatementCache {
  private static readonly limit: number = 2000;
  private static readonly transactionLength: number = 12;

  private readonly scheduler: boolean;
  private readonly prefix: string = Math.random().toString(36).slice(2, 10);
  private readonly statements: Map<string, QueryStatement> = new Map();
  private readonly texts: Map<string, QueryCost> = new Map();
  private counter: number = 1;
  private clock: number = 0;

  public constructor(scheduler: boolean) {
    this.scheduler = scheduler;
  }

  public readCost(text: string): QueryCost {
    const found = this.texts.get(text);
    if (!Object.isUndefined(found))
      return found;

    const cost = new QueryCost();
    this.texts.set(text, cost);
    if (this.texts.size > StatementCache.limit)
      for (const oldest of this.texts.keys()) {
        this.texts.delete(oldest);
        break;
      }

    return cost;
  }

  public get(built: BuiltQuery, prepare: boolean): QueryStatement {
    if (!prepare)
      return this.createUnnamed(built.text);

    const key = built.oids.join(Resources.arrayDelimiter) + Resources.statementKeySeparator + built.text;
    const found = this.statements.get(key);
    if (Object.isUndefined(found))
      return this.add(key, built.text);

    found.used = this.advanceClock();
    return found;
  }

  public clear(): void {
    for (const statement of this.statements.values())
      statement.live = false;
    this.statements.clear();
  }

  public static isAlone(holder: QueryStatement | QueryCost, text: string): boolean {
    holder.alone ??= StatementCache.isOpening(text);
    return holder.alone;
  }

  public static isOpening(text: string): boolean {
    if (Resources.beginKeyword.test(text))
      return true;

    const starts = new RegExp(Resources.startKeyword);
    for (let match = starts.exec(text); !Object.isNull(match); match = starts.exec(text)) {
      const from = match.index + match[0].length;
      const index = StatementCache.skip(text, from);
      if (index === -1)
        return false;
      if (index > from && Resources.transactionKeyword.test(text.slice(index, index + StatementCache.transactionLength)))
        return true;

      starts.lastIndex = Math.max(starts.lastIndex, index);
    }

    return false;
  }

  private static skip(text: string, from: number): number {
    let index = from;
    for (;;) {
      while (Resources.whitespace.test(text.charAt(index)))
        index += 1;
      if (!text.startsWith(Resources.commentStart, index))
        return index;

      const end = text.indexOf(Resources.commentEnd, index + Resources.commentStart.length);
      if (end === -1)
        return -1;

      index = end + Resources.commentEnd.length;
    }
  }

  private createUnnamed(text: string): QueryStatement {
    const statement = new QueryStatement("", text);
    statement.cost = this.scheduler ? this.readCost(text) : null;
    return statement;
  }

  private add(key: string, text: string): QueryStatement {
    const statement = new QueryStatement(this.prefix + String(this.counter), text);
    this.counter += 1;
    statement.live = true;
    statement.used = this.advanceClock();
    statement.cost = new QueryCost();
    this.statements.set(key, statement);
    if (this.statements.size > StatementCache.limit)
      this.evict();

    return statement;
  }

  private evict(): void {
    const [key, oldest] = [...this.statements].reduce((first, second) => second[1].used < first[1].used ? second : first);
    oldest.live = false;
    this.statements.delete(key);
  }

  private advanceClock(): number {
    const used = this.clock;
    this.clock += 1;
    return used;
  }
}
