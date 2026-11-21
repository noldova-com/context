/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectExpression } from "@noldova/context.query.expressions";

import type { CompileScope } from "../../models/compile-scope.js";
import { CompiledProperty } from "../../models/compiled-property.js";
import type { Frame } from "../../models/frame.js";
import type { Evaluator } from "../../types/evaluator.js";

ObjectExpression.prototype.compile = function (this: ObjectExpression, scope: CompileScope): Evaluator {
  const properties = this.properties.map(t => new CompiledProperty(t.name, t.value.compile(scope)));
  return (frame: Frame): object => {
    const result = {};
    for (const property of properties)
      Object.defineProperty(result, property.name, { value: property.value(frame), writable: true, enumerable: true, configurable: true });

    return result;
  };
};
