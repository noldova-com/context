/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptListKind } from "@noldova/context.parsers.typescript/enums/typescript-list-kind.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptListKindTests {
  @TestMethod
  public namesTheReferenceParsingContextsByTheirOwnNames(): void {
    Assert.areEqual("SourceElements", TypeScriptListKind.SourceElements);
    Assert.areEqual("BlockStatements", TypeScriptListKind.BlockStatements);
    Assert.areEqual("SwitchClauses", TypeScriptListKind.SwitchClauses);
    Assert.areEqual("SwitchClauseStatements", TypeScriptListKind.SwitchClauseStatements);
    Assert.areEqual("TypeMembers", TypeScriptListKind.TypeMembers);
    Assert.areEqual("ClassMembers", TypeScriptListKind.ClassMembers);
    Assert.areEqual("EnumMembers", TypeScriptListKind.EnumMembers);
    Assert.areEqual("HeritageClauseElement", TypeScriptListKind.HeritageClauseElement);
    Assert.areEqual("VariableDeclarations", TypeScriptListKind.VariableDeclarations);
    Assert.areEqual("ObjectBindingElements", TypeScriptListKind.ObjectBindingElements);
    Assert.areEqual("ArrayBindingElements", TypeScriptListKind.ArrayBindingElements);
    Assert.areEqual("ArgumentExpressions", TypeScriptListKind.ArgumentExpressions);
    Assert.areEqual("ObjectLiteralMembers", TypeScriptListKind.ObjectLiteralMembers);
    Assert.areEqual("ArrayLiteralMembers", TypeScriptListKind.ArrayLiteralMembers);
    Assert.areEqual("Parameters", TypeScriptListKind.Parameters);
    Assert.areEqual("TypeParameters", TypeScriptListKind.TypeParameters);
    Assert.areEqual("TypeArguments", TypeScriptListKind.TypeArguments);
    Assert.areEqual("TupleElementTypes", TypeScriptListKind.TupleElementTypes);
    Assert.areEqual("HeritageClauses", TypeScriptListKind.HeritageClauses);
    Assert.areEqual("ImportOrExportSpecifiers", TypeScriptListKind.ImportOrExportSpecifiers);
    Assert.areEqual("ImportAttributes", TypeScriptListKind.ImportAttributes);
  }
}
