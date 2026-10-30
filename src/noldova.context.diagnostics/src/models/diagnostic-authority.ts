/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";

export class DiagnosticAuthority {
  public static readonly context: DiagnosticAuthority = new DiagnosticAuthority(Resources.contextCodePrefix);
  public static readonly typeScript: DiagnosticAuthority = new DiagnosticAuthority(Resources.typeScriptCodePrefix);

  public readonly codePrefix: string;

  private constructor(codePrefix: string) {
    this.codePrefix = codePrefix;
  }
}
