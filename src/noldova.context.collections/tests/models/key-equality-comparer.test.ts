/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { KeyEqualityComparer } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CaseInsensitiveComparer } from "../fixtures/case-insensitive-comparer.fixture.js";
import { Person } from "../fixtures/person.fixture.js";

@TestClass
export class KeyEqualityComparerTests {
  @TestMethod
  public comparesAndHashesTheKeysWithItsComparer(): void {
    const comparer = new KeyEqualityComparer((t: Person) => t.name, new CaseInsensitiveComparer());

    Assert.isTrue(comparer.equals(new Person(1, "Ann"), new Person(2, "aNN")));
    Assert.isFalse(comparer.equals(new Person(1, "Ann"), new Person(1, "Bob")));
    Assert.areEqual(3, comparer.hash(new Person(1, "Ann")));
  }
}
