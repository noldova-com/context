/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComparedDiagnostic } from "./compared-diagnostic.js";
import type { ConformanceCaseVerdict } from "./conformance-case-verdict.js";
import type { JsonObject } from "./json-object.js";

export class KnownFailure {
  public readonly path: string;
  public readonly missing: readonly ComparedDiagnostic[];
  public readonly extra: readonly ComparedDiagnostic[];

  public constructor(path: string, missing: readonly ComparedDiagnostic[], extra: readonly ComparedDiagnostic[]) {
    this.path = path;
    this.missing = missing;
    this.extra = extra;
  }

  public static fromVerdict(path: string, verdict: ConformanceCaseVerdict): KnownFailure {
    return new KnownFailure(path, verdict.underReported, verdict.overReported);
  }

  public static from(object: JsonObject): KnownFailure {
    return new KnownFailure(object.string("path"), object.objects("missing").map(t => ComparedDiagnostic.from(t)),
      object.objects("extra").map(t => ComparedDiagnostic.from(t)));
  }

  public isRecordedAs(verdict: ConformanceCaseVerdict): boolean {
    return KnownFailure.keys(this.missing) === KnownFailure.keys(verdict.underReported)
      && KnownFailure.keys(this.extra) === KnownFailure.keys(verdict.overReported);
  }

  public contains(failure: KnownFailure): boolean {
    const missing = new Set(this.missing.map(t => t.key));
    const extra = new Set(this.extra.map(t => t.key));
    return failure.missing.every(t => missing.has(t.key)) && failure.extra.every(t => extra.has(t.key));
  }

  private static keys(diagnostics: readonly ComparedDiagnostic[]): string {
    return JSON.stringify(diagnostics.map(t => t.key).toSorted());
  }
}
