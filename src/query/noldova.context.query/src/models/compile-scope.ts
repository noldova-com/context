/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InvalidOperationException } from "@noldova/context.exceptions";
import type { ParameterExpression } from "@noldova/context.query.expressions";

import { Resources } from "../resources.js";
import { ParameterSlot } from "./parameter-slot.js";

export class CompileScope {
  public static readonly ROOT: CompileScope = new CompileScope([]);

  public readonly parameters: readonly ParameterExpression[];
  public readonly parent: CompileScope | undefined;

  public constructor(parameters: readonly ParameterExpression[], parent?: CompileScope) {
    this.parameters = parameters;
    this.parent = parent;
  }

  public resolve(parameter: ParameterExpression): ParameterSlot {
    let depth = 0;
    for (let scope: CompileScope | undefined = this; !Object.isUndefined(scope); scope = scope.parent) {
      const index = scope.parameters.indexOf(parameter);
      if (index >= 0)
        return new ParameterSlot(depth, index);

      depth++;
    }

    throw new InvalidOperationException(Resources.parameterUnbound);
  }
}
