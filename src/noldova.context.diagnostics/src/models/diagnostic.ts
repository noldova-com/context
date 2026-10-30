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
import type { DiagnosticTag } from "../enums/diagnostic-tag.js";
import { Resources } from "../resources.js";
import type { DiagnosticCode } from "./diagnostic-code.js";
import type { DiagnosticLocation } from "./diagnostic-location.js";
import type { DiagnosticMessage } from "./diagnostic-message.js";
import type { DiagnosticRelatedInformation } from "./diagnostic-related-information.js";

export class Diagnostic {
  public readonly message: DiagnosticMessage;
  public readonly code: DiagnosticCode;
  public readonly category: DiagnosticCategory;
  public readonly location: DiagnosticLocation | undefined;
  public readonly relatedInformation: readonly DiagnosticRelatedInformation[];
  public readonly tags: readonly DiagnosticTag[];

  public constructor(
    message: DiagnosticMessage,
    location: DiagnosticLocation | undefined,
    relatedInformation: readonly DiagnosticRelatedInformation[],
    tags: readonly DiagnosticTag[]) {
    if (new Set(tags).size !== tags.length)
      throw new ArgumentException(Resources.duplicateTag, nameof<Diagnostic>(t => t.tags));

    this.message = message;
    this.code = this.message.code;
    this.category = this.message.category;
    this.location = location;
    this.relatedInformation = [...relatedInformation];
    this.tags = [...tags];
  }
}
