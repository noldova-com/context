/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "./binary.expression.extensions.js";
import "./call.expression.extensions.js";
import "./conditional.expression.extensions.js";
import "./constant.expression.extensions.js";
import "./lambda.expression.extensions.js";
import "./member.expression.extensions.js";
import "./object.expression.extensions.js";
import "./parameter.expression.extensions.js";
import "./unary.expression.extensions.js";

import { InvalidOperationException } from "@noldova/context.exceptions";
import { Expression } from "@noldova/context.query.expressions";

import type { CompileScope } from "../../models/compile-scope.js";
import { Resources } from "../../resources.js";
import type { Evaluator } from "../../types/evaluator.js";

declare module "@noldova/context.query.expressions" {
  interface Expression {
    compile(scope: CompileScope): Evaluator;
  }
}

Expression.prototype.compile = function (this: Expression): Evaluator {
  throw new InvalidOperationException(Resources.expressionNotEvaluable);
};
