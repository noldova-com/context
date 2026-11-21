/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BinaryExpression } from "@noldova/context.query.expressions";

import type { CompileScope } from "../../models/compile-scope.js";
import type { Frame } from "../../models/frame.js";
import { OperatorService } from "../../services/operator.service.js";
import type { Evaluator } from "../../types/evaluator.js";

BinaryExpression.prototype.compile = function (this: BinaryExpression, scope: CompileScope): Evaluator {
  const operator = this.operator;
  if (OperatorService.isShortCircuit(operator)) {
    const stops = OperatorService.STOPS[operator];
    const operands = OperatorService.operandsOf(this).map(t => t.compile(scope));
    return (frame: Frame): unknown => {
      let value: unknown;
      for (const operand of operands) {
        value = operand(frame);
        if (stops(value))
          return value;
      }

      return value;
    };
  }

  const operate = OperatorService.OPERATIONS[operator];
  const left = this.left.compile(scope);
  const right = this.right.compile(scope);
  return (frame: Frame): unknown => operate(left(frame), right(frame));
};
