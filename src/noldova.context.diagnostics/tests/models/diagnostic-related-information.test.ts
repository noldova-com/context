/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  DiagnosticAuthority,
  DiagnosticCategory,
  DiagnosticCode,
  DiagnosticLocation,
  DiagnosticMessage,
  DiagnosticRelatedInformation
} from "@noldova/context.diagnostics";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DiagnosticRelatedInformationTests {
  @TestMethod
  public carriesTheMessageAndLocation(): void {
    const message = this.createMessage();
    const location = new DiagnosticLocation("sample.ts", 3, 4);
    const relatedInformation = new DiagnosticRelatedInformation(message, location);

    Assert.areEqual(message, relatedInformation.message);
    Assert.areEqual<DiagnosticLocation | undefined>(location, relatedInformation.location);
  }

  @TestMethod
  public acceptsAnAbsentLocation(): void {
    const relatedInformation = new DiagnosticRelatedInformation(this.createMessage(), undefined);

    Assert.isUndefined(relatedInformation.location);
  }

  private createMessage(): DiagnosticMessage {
    const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2728);

    return new DiagnosticMessage(code, DiagnosticCategory.Error, "'value' is declared here.", []);
  }
}
