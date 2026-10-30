/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";
import { DiagnosticAuthority } from "./diagnostic-authority.js";

export class DiagnosticCode {
  public readonly authority: DiagnosticAuthority;
  public readonly displayText: string;
  public readonly value: number;

  public constructor(authority: DiagnosticAuthority, value: number) {
    if (!Number.isSafeInteger(value) || value < 1)
      throw new ArgumentOutOfRangeException(nameof<DiagnosticCode>(t => t.value), value, Resources.codeValueInvalid);

    this.authority = authority;
    this.displayText = `${authority.codePrefix}${value}`;
    this.value = value;
  }
}
