/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConditionalExpression } from "@noldova/context.query.expressions";

import type { CompileScope } from "../../models/compile-scope.js";
import type { Frame } from "../../models/frame.js";
import type { Evaluator } from "../../types/evaluator.js";

ConditionalExpression.prototype.compile = function (this: ConditionalExpression, scope: CompileScope): Evaluator {
  const test = this.test.compile(scope);
  const whenTrue = this.whenTrue.compile(scope);
  const whenFalse = this.whenFalse.compile(scope);
  return (frame: Frame): unknown => test(frame) ? whenTrue(frame) : whenFalse(frame);
};
