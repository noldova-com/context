/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Evaluator } from "../types/evaluator.js";

export class CompiledProperty {
  public readonly name: string;
  public readonly value: Evaluator;

  public constructor(name: string, value: Evaluator) {
    this.name = name;
    this.value = value;
  }
}
