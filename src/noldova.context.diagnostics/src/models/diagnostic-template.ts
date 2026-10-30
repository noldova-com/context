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
import { DiagnosticMessage } from "./diagnostic-message.js";
import type { DiagnosticRelatedInformation } from "./diagnostic-related-information.js";
import { Diagnostic } from "./diagnostic.js";

export class DiagnosticTemplate {
  public readonly code: DiagnosticCode;
  public readonly category: DiagnosticCategory;
  public readonly messageTemplate: string;
  public readonly defaultTags: readonly DiagnosticTag[];

  public constructor(code: DiagnosticCode, category: DiagnosticCategory, messageTemplate: string, defaultTags: readonly DiagnosticTag[] = []) {
    ArgumentException.throwIfNullOrWhitespace(messageTemplate, nameof<DiagnosticTemplate>(t => t.messageTemplate));

    if (new Set(defaultTags).size !== defaultTags.length)
      throw new ArgumentException(Resources.duplicateTag, nameof<DiagnosticTemplate>(t => t.defaultTags));

    this.code = code;
    this.category = category;
    this.messageTemplate = messageTemplate;
    this.defaultTags = [...defaultTags];
  }

  public create(
    location: DiagnosticLocation | undefined,
    messageArguments: readonly (string | number)[] = [],
    relatedInformation: readonly DiagnosticRelatedInformation[] = [],
    tags: readonly DiagnosticTag[] = []): Diagnostic {
    const message = new DiagnosticMessage(this.code, this.category, String.format(this.messageTemplate, ...messageArguments), []);

    return new Diagnostic(message, location, relatedInformation, [...this.defaultTags, ...tags]);
  }
}
