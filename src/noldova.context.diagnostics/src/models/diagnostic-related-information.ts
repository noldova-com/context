/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticLocation } from "./diagnostic-location.js";
import type { DiagnosticMessage } from "./diagnostic-message.js";

export class DiagnosticRelatedInformation {
  public readonly message: DiagnosticMessage;
  public readonly location: DiagnosticLocation | undefined;

  public constructor(message: DiagnosticMessage, location: DiagnosticLocation | undefined) {
    this.message = message;
    this.location = location;
  }
}
