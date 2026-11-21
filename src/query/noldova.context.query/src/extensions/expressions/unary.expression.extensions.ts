/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { UnaryExpression } from "@noldova/context.query.expressions";

import type { CompileScope } from "../../models/compile-scope.js";
import type { Frame } from "../../models/frame.js";
import type { Evaluator } from "../../types/evaluator.js";

UnaryExpression.prototype.compile = function (this: UnaryExpression, scope: CompileScope): Evaluator {
  const operand = this.operand.compile(scope);
  return (frame: Frame): boolean => !operand(frame);
};
