/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConstantExpression } from "@noldova/context.query.expressions";

import type { Evaluator } from "../../types/evaluator.js";

ConstantExpression.prototype.compile = function (this: ConstantExpression): Evaluator {
  const value = this.value;
  return (): unknown => value;
};
