/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";

export class SourcePosition {
  public readonly lineIndex: number;
  public readonly characterIndex: number;

  public constructor(lineIndex: number, characterIndex: number) {
    if (!Number.isSafeInteger(lineIndex) || lineIndex < 0)
      throw new ArgumentOutOfRangeException(nameof<SourcePosition>(t => t.lineIndex), lineIndex, Resources.lineIndexInvalid);

    if (!Number.isSafeInteger(characterIndex) || characterIndex < 0)
      throw new ArgumentOutOfRangeException(nameof<SourcePosition>(t => t.characterIndex), characterIndex, Resources.characterIndexInvalid);

    this.lineIndex = lineIndex;
    this.characterIndex = characterIndex;
  }
}
