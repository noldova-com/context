/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Diagnostic } from "@noldova/context.diagnostics";
import { type Node, SourceSpan } from "@noldova/context.parsers";
import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import { TypeScriptDeferredRecords } from "@noldova/context.parsers.typescript/models/typescript-deferred-records.js";
import { TypeScriptReparsedRegion } from "@noldova/context.parsers.typescript/models/typescript-reparsed-region.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptReparsedRegionTests {
  @TestMethod
  public retainsTheOwnedRegionResultsItsExactSpanAndItsRecords(): void {
    const content = "await value; export {};";
    const parsed = TypeScriptParser.parse(content);
    const statements: readonly Node[] = parsed.rootNode.children;
    const diagnostics: readonly Diagnostic[] = parsed.diagnostics;
    const span = new SourceSpan(0, parsed.rootNode.span.length);
    const records = new TypeScriptDeferredRecords();

    const region = new TypeScriptReparsedRegion(statements, diagnostics, span, records);

    Assert.areEqual(statements, region.statements);
    Assert.areEqual(diagnostics, region.diagnostics);
    Assert.areEqual(span, region.span);
    Assert.areEqual(records, region.records);
  }
}
