/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class RegexCapturingGroupSummary {
  public readonly capturingGroupCount: number;
  public readonly namedCapturingGroupNames: ReadonlySet<string>;

  public constructor(capturingGroupCount: number, namedCapturingGroupNames: ReadonlySet<string>) {
    this.capturingGroupCount = capturingGroupCount;
    this.namedCapturingGroupNames = namedCapturingGroupNames;
  }
}
