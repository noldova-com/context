/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonReader } from "@noldova/context.json";

export default class TypeScriptExpectedRetry {
  public readonly path: string;
  public readonly reasons: readonly string[];

  public constructor(path: string, reasons: readonly string[]) {
    this.path = path;
    this.reasons = reasons;
  }

  public static read(reader: JsonReader): TypeScriptExpectedRetry {
    return new TypeScriptExpectedRetry(reader.readString("path"), reader.readStringArray("reasons"));
  }
}
