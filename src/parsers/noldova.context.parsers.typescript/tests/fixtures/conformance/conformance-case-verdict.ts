/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ComparedDiagnostic } from "./compared-diagnostic.js";

export class ConformanceCaseVerdict {
  private static readonly LINE_FEED: string = "\n";

  public readonly underReported: readonly ComparedDiagnostic[];
  public readonly overReported: readonly ComparedDiagnostic[];

  public constructor(underReported: readonly ComparedDiagnostic[], overReported: readonly ComparedDiagnostic[]) {
    this.underReported = underReported;
    this.overReported = overReported;
  }

  public get isMatch(): boolean {
    return this.underReported.length === 0 && this.overReported.length === 0;
  }

  public describe(): string {
    return [
      ...this.underReported.map(t => `missing ${t.describe()}`),
      ...this.overReported.map(t => `extra ${t.describe()}`),
    ].join(ConformanceCaseVerdict.LINE_FEED);
  }
}
