/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptListKind } from "@noldova/context.parsers.typescript/enums/typescript-list-kind.js";
import { TypeScriptListScope } from "@noldova/context.parsers.typescript/models/typescript-list-scope.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptListScopeTests {
  @TestMethod
  public constructorLeavesTheRootWithoutParentKindOrNestedScopes(): void {
    const root = new TypeScriptListScope();

    Assert.isUndefined(root.parent);
    Assert.isUndefined(root.kind);
    Assert.areEqual(0, root.nestedScopes.size);
  }

  @TestMethod
  public constructorKeepsTheParentAndKindOfANestedScope(): void {
    const root = new TypeScriptListScope();
    const nested = new TypeScriptListScope(root, TypeScriptListKind.TypeMembers);

    Assert.areEqual(root, nested.parent);
    Assert.areEqual(TypeScriptListKind.TypeMembers, nested.kind);
  }
}
