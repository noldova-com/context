/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonValue } from "../types/json-value.js";

export class JsonConversion {
  public readonly value: JsonValue;
  public readonly height: number;

  public constructor(value: JsonValue, height: number) {
    this.value = value;
    this.height = height;
  }
}
