/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InMemoryQueryProvider } from "@noldova/context.query";
import { Expression, type ParameterExpression } from "@noldova/context.query.expressions";

export class Evaluation {
  public static readonly x: ParameterExpression = Expression.parameter("x");

  public static evaluateAsync(body: Expression, input?: unknown): Promise<unknown> {
    return new InMemoryQueryProvider().from([input]).select(Expression.lambda([Evaluation.x], body)).firstAsync();
  }
}
