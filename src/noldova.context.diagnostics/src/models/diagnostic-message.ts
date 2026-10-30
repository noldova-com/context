/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";

import type { DiagnosticCategory } from "../enums/diagnostic-category.js";
import type { DiagnosticCode } from "./diagnostic-code.js";

export class DiagnosticMessage {
  public readonly code: DiagnosticCode;
  public readonly category: DiagnosticCategory;
  public readonly text: string;
  public readonly children: readonly DiagnosticMessage[];

  public constructor(code: DiagnosticCode, category: DiagnosticCategory, text: string, children: readonly DiagnosticMessage[]) {
    ArgumentException.throwIfNullOrWhitespace(text, nameof<DiagnosticMessage>(t => t.text));

    this.code = code;
    this.category = category;
    this.text = text;
    this.children = [...children];
  }
}
