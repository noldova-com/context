/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RelationKind } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RelationKindTests {
  @TestMethod
  public usesMemberNamesAsValues(): void {
    Assert.areEqual("OneToMany", RelationKind.OneToMany);
    Assert.areEqual("OneToOne", RelationKind.OneToOne);
    Assert.areEqual(2, Object.values(RelationKind).length);
  }
}
