/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MemberExpression } from "@noldova/context.query.expressions";

import type { CompileScope } from "../../models/compile-scope.js";
import type { Frame } from "../../models/frame.js";
import { MemberService } from "../../services/member.service.js";
import type { Evaluator } from "../../types/evaluator.js";

MemberExpression.prototype.compile = function (this: MemberExpression, scope: CompileScope): Evaluator {
  const target = this.target.compile(scope);
  const name = this.name;
  return (frame: Frame): unknown => MemberService.read(target(frame), name);
};
