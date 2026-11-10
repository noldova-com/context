/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DataValue } from "@noldova/context.data";
import { ArgumentException } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class SqlQuery {
  public readonly text: string;
  public readonly parameters: readonly DataValue[];

  public constructor(text: string, parameters: readonly DataValue[] = []) {
    ArgumentException.throwIfNullOrWhitespace(text, Resources.textParameterName);

    this.text = text;
    this.parameters = [...parameters];
  }

  public toString(): string {
    return this.text;
  }
}
