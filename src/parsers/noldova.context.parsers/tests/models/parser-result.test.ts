/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Diagnostic, DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticTemplate } from "@noldova/context.diagnostics";
import { ParserResult, SourceSpan } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { LiteralNodeFixture } from "../fixtures/literal-node.fixture.js";

@TestClass
export class ParserResultTests {
  @TestMethod
  public constructorPreservesRootAndCopiesDiagnostics(): void {
    const rootNode = new LiteralNodeFixture("root", new SourceSpan(0, 4));
    const template = new DiagnosticTemplate(
      new DiagnosticCode(DiagnosticAuthority.context, 1),
      DiagnosticCategory.Error,
      "Error.");
    const diagnostic = template.create(undefined);
    const sourceDiagnostics: Diagnostic[] = [diagnostic];
    const result = new ParserResult(rootNode, sourceDiagnostics);

    sourceDiagnostics.push(template.create(undefined));

    Assert.areEqual(rootNode, result.rootNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(diagnostic, result.diagnostics[0]);
  }
}
