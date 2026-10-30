/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { ArgumentException, ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class DiagnosticLocation {
  public readonly sourceIdentity: string | undefined;
  public readonly start: number;
  public readonly length: number;

  public constructor(sourceIdentity: string | undefined, start: number, length: number, sourceLength?: number) {
    if (!Object.isUndefined(sourceIdentity))
      ArgumentException.throwIfNullOrWhitespace(sourceIdentity, nameof<DiagnosticLocation>(t => t.sourceIdentity));

    if (!Number.isSafeInteger(start) || start < 0)
      throw new ArgumentOutOfRangeException(nameof<DiagnosticLocation>(t => t.start), start, Resources.startInvalid);

    if (!Number.isSafeInteger(length) || length < 0)
      throw new ArgumentOutOfRangeException(nameof<DiagnosticLocation>(t => t.length), length, Resources.lengthInvalid);

    const end = start + length;
    if (!Number.isSafeInteger(end))
      throw new ArgumentOutOfRangeException(nameof<DiagnosticLocation>(t => t.length), length, Resources.spanEndInvalid);

    if (!Object.isUndefined(sourceLength)) {
      if (!Number.isSafeInteger(sourceLength) || sourceLength < 0)
        throw new ArgumentOutOfRangeException(Resources.sourceLengthParameterName, sourceLength, Resources.sourceLengthInvalid);

      if (end > sourceLength)
        throw new ArgumentOutOfRangeException(nameof<DiagnosticLocation>(t => t.length), length, Resources.spanBeyondSource(end, sourceLength));
    }

    this.sourceIdentity = sourceIdentity;
    this.start = start;
    this.length = length;
  }
}
