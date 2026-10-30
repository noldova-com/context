/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptAtNode,
  TypeScriptDeclareKeywordNode,
  TypeScriptDecoratorNode,
  TypeScriptDefaultClauseNode,
  TypeScriptDefaultKeywordNode,
  TypeScriptExportKeywordNode,
  TypeScriptMissingExpressionNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptDefaultKeywordNodeExtensionsTests {
  @TestMethod
  public distinguishesASourceDefaultFromADefaultInsideAnOrdinaryBlock(): void {
    const source = TypeScriptParser.parse("default value;");
    const block = TypeScriptParser.parse("{ default value; }");
    Assert.areEqual(1, source.diagnostics.length);
    Assert.areEqual("TS1005", source.diagnostics[0]?.code.displayText);
    Assert.areEqual("'export' expected.", source.diagnostics[0]?.message.text);
    Assert.areEqual(1, block.diagnostics.length);
    Assert.areEqual("TS1128", block.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public parsesADefaultClauseUpToTheNextSwitchClause(): void {
    const parser = TypeScriptParserFixture.create("default: break; case 1:");
    Assert.isTrue(parser.currentNode.isTypeScriptSwitchClauseStart());
    const node = parser.currentNode.parseTypeScriptSwitchClause(parser);
    Assert.isInstanceOf(node, TypeScriptDefaultClauseNode);
    Assert.areEqual(1, node.children.length);
    Assert.isTrue(parser.currentNode.isTypeScriptSwitchClauseStart());
    Assert.areEqual("TS1105", parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("default class {}", true)
  @TestData("default function() {}", true)
  @TestData("default interface I {}", true)
  @TestData("default abstract class {}", true)
  @TestData("default async function() {}", true)
  @TestData("default\nfunction() {}", true)
  @TestData("default abstract\nclass {}", false)
  @TestData("default async\nfunction() {}", false)
  @TestData("default abstract name", false)
  @TestData("default value", false)
  @TestMethod
  public distinguishesDeclarationModifiersFromValueExports(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, TypeScriptDefaultKeywordNode);

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.areEqual(expected, node.canParseTypeScriptDeclarationModifier(parser, [new TypeScriptExportKeywordNode(new SourceSpan(0, 0))]));
    Assert.areEqual(expected, node.canParseTypeScriptDeclarationModifier(parser));
    Assert.areEqual(expected, node.canParseTypeScriptDeclarationModifier(parser,
      [new TypeScriptDecoratorNode(new TypeScriptAtNode(new SourceSpan(0, 1)), new SourceSpan(0, 1), new TypeScriptMissingExpressionNode(new SourceSpan(1, 0))),
        new TypeScriptDeclareKeywordNode(new SourceSpan(1, 7))]));
    Assert.isFalse(node.canParseTypeScriptDeclarationModifier(parser, [new TypeScriptDeclareKeywordNode(new SourceSpan(0, 7))]));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("namespace N { export default class C {} }")
  @TestData("namespace N { export default function f() {} }")
  @TestData("namespace N { export default interface I {} }")
  @TestData("namespace N.M { export default class C {} }")
  @TestData("declare namespace N { export default class C {} }")
  @TestData("namespace N { namespace M { export default class C {} } }")
  @TestData("namespace N { export @d default class C {} }")
  @TestMethod
  public reportsADefaultDeclarationANamespaceBodyHolds(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1319", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.lastIndexOf("default"), result.diagnostics[0]?.location?.start);
    Assert.areEqual("default".length, result.diagnostics[0]?.location?.length);
  }

  @TestData("export default class C {}")
  @TestData("declare module \"module\" { export default class C {} }")
  @TestData("declare global { export default class C {} }")
  @TestMethod
  public acceptsADefaultDeclarationItsSourceMayHold(content: string): void {
    Assert.areEqual(0, TypeScriptParser.parse(content).diagnostics.length);
  }

  @TestData("@dec default class C {}", "TS1029@5:7")
  @TestData("@dec declare default class C {}", "TS1029@13:7")
  @TestData("@dec default abstract class C {}", "TS1029@5:7")
  @TestData("@dec default @dec2 class C {}", "TS1029@5:7")
  @TestData("declare module 'm' { @dec default class C {} }", "TS1029@26:7")
  @TestData("@dec default function f() {}", "TS1206@0:1")
  @TestData("export @dec default class C {}", "TS1206@7:4")
  @TestData("export declare default class C {}", "TS1128@0:6|TS1005@15:7")
  @TestMethod
  public reportsADefaultWrittenWithNoExportBeforeIt(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { default class; }", "TS1029@10:7")
  @TestData("interface I { default class: 1 }", "TS1070@14:7")
  @TestData("function f(default class) {}", "TS1359@19:5|TS1005@24:1")
  @TestData("namespace N { class C { default class; } }", "TS1029@24:7")
  @TestMethod
  public readsAsAModifierInEveryMemberPosition(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
