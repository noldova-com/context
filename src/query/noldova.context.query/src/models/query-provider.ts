/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Expression } from "@noldova/context.query.expressions";

export abstract class QueryProvider {
  public abstract executeAsync<TResult>(expression: Expression): Promise<TResult>;

  public abstract iterate<T>(expression: Expression): AsyncIterable<T>;
}
