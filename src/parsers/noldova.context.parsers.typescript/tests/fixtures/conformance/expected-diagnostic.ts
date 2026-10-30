/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonObject } from "./json-object.js";

export class ExpectedDiagnostic {
  public readonly code: number;
  public readonly category: string;
  public readonly file: number | string | undefined;
  public readonly start: number | undefined;
  public readonly length: number | undefined;
  public readonly text: string;
  public readonly chain: readonly ExpectedDiagnostic[];
  public readonly related: readonly ExpectedDiagnostic[];
  public readonly tags: readonly string[];

  public constructor(code: number, category: string, file: number | string | undefined, start: number | undefined, length: number | undefined,
    text: string, chain: readonly ExpectedDiagnostic[], related: readonly ExpectedDiagnostic[], tags: readonly string[]) {
    this.code = code;
    this.category = category;
    this.file = file;
    this.start = start;
    this.length = length;
    this.text = text;
    this.chain = chain;
    this.related = related;
    this.tags = tags;
  }

  public static from(object: JsonObject): ExpectedDiagnostic {
    return new ExpectedDiagnostic(object.number("code"), object.string("category"), object.optionalNumberOrString("file"), object.optionalNumber("start"),
      object.optionalNumber("length"), object.string("text"), object.optionalObjects("chain").map(t => ExpectedDiagnostic.from(t)),
      object.optionalObjects("related").map(t => ExpectedDiagnostic.from(t)), object.optionalStrings("tags"));
  }
}
