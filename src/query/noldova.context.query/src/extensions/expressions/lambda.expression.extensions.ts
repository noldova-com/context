/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LambdaExpression } from "@noldova/context.query.expressions";

import { CompileScope } from "../../models/compile-scope.js";
import { Frame } from "../../models/frame.js";
import type { Evaluator } from "../../types/evaluator.js";

LambdaExpression.prototype.compile = function (this: LambdaExpression, scope: CompileScope): Evaluator {
  const body = this.body.compile(new CompileScope(this.parameters, scope));
  return (frame: Frame): (...values: unknown[]) => unknown => (...values: unknown[]): unknown => body(new Frame(values, frame));
};
