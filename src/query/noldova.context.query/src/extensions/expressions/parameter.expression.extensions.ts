/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ParameterExpression } from "@noldova/context.query.expressions";

import type { CompileScope } from "../../models/compile-scope.js";
import type { Frame } from "../../models/frame.js";
import type { Evaluator } from "../../types/evaluator.js";

ParameterExpression.prototype.compile = function (this: ParameterExpression, scope: CompileScope): Evaluator {
  const slot = scope.resolve(this);
  const depth = slot.depth;
  const index = slot.index;
  return depth === 0
    ? (frame: Frame): unknown => frame.values[index]
    : (frame: Frame): unknown => frame.ancestor(depth).values[index];
};
