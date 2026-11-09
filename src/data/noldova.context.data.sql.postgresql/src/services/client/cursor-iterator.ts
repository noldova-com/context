/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { CursorAction } from "../../enums/cursor-action.js";
import type { Result } from "../../models/result.js";
import { Deferred } from "../../models/client/deferred.js";
import type { Query } from "../../models/client/query.js";

export class CursorIterator implements AsyncIterableIterator<Result, undefined> {
  private readonly query: Query;
  private previous: Deferred<CursorAction> | null = null;

  public constructor(query: Query) {
    this.query = query;
  }

  public [Symbol.asyncIterator](): this {
    return this;
  }

  public next(): Promise<IteratorResult<Result, undefined>> {
    if (this.query.executed && !this.query.active)
      return Promise.resolve({ done: true, value: undefined });

    this.previous?.resolve(CursorAction.Next);
    const step = new Deferred<IteratorResult<Result, undefined>>();
    this.query.cursorFn = (rows: Result): Promise<CursorAction> => {
      step.resolve({ done: false, value: rows });
      const previous = new Deferred<CursorAction>();
      this.previous = previous;
      return previous.promise;
    };
    this.query.redirect(() => {
      this.query.active = false;
      this.query.settled = true;
      step.resolve({ done: true, value: undefined });
    }, error => {
      this.query.active = false;
      this.query.settled = true;
      step.reject(error);
    });
    this.query.execute();
    return step.promise;
  }

  public return(): Promise<IteratorResult<Result, undefined>> {
    this.previous?.resolve(CursorAction.Close);
    return Promise.resolve({ done: true, value: undefined });
  }
}
