/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CallExpression } from "@noldova/context.query.expressions";

import type { CompileScope } from "../../models/compile-scope.js";
import type { Frame } from "../../models/frame.js";
import { MemberService } from "../../services/member.service.js";
import type { Evaluator } from "../../types/evaluator.js";

CallExpression.prototype.compile = function (this: CallExpression, scope: CompileScope): Evaluator {
  const target = this.target.compile(scope);
  const name = this.name;
  const values = this.arguments.map(t => t.compile(scope));
  return (frame: Frame): unknown => {
    const value = target(frame);
    const method = MemberService.read(value, name);
    return MemberService.call(value, method, values.map(t => t(frame)));
  };
};
