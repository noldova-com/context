/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary, Enumerable, KeyValuePair, ReadOnlyDictionary } from "@noldova/context.collections";
import { InvalidOperationException, KeyNotFoundException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ReadOnlyDictionaryTests {
  @TestMethod
  public readsTheEntriesOfItsDictionary(): void {
    const view = new Dictionary([new KeyValuePair("a", 1), new KeyValuePair("b", 2)]).asReadOnly();

    Assert.isInstanceOf(view, ReadOnlyDictionary);
    Assert.areEqual(2, view.get("b"));
    Assert.areEqual(1, view.tryGet("a"));
    Assert.isUndefined(view.tryGet("c"));
    Assert.isTrue(view.containsKey("a"));
    Assert.isFalse(view.containsKey("c"));
    Assert.areEqual("[\"a\",\"b\"]", JSON.stringify(view.keys().toArray()));
    Assert.areEqual("[1,2]", JSON.stringify(view.values().toArray()));
    Assert.areEqual("[{\"key\":\"a\",\"value\":1},{\"key\":\"b\",\"value\":2}]", JSON.stringify(view.toArray()));
  }

  @TestMethod
  public getThrowsForAKeyMissingFromItsDictionary(): void {
    const view = new Dictionary([new KeyValuePair("a", 1)]).asReadOnly();

    const exception = Assert.throws(() => view.get("b"), KeyNotFoundException);

    Assert.areEqual("The key is not present in the collection.", exception.message);
  }

  @TestMethod
  public countsAllOrTheMatchingEntriesOfItsDictionary(): void {
    const view = new Dictionary([new KeyValuePair("a", 1), new KeyValuePair("b", 2)]).asReadOnly();

    Assert.areEqual(2, view.count());
    Assert.areEqual(1, view.count(t => t.value > 1));
  }

  @TestMethod
  public showsLaterChangesToItsDictionary(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1)]);
    const view = dictionary.asReadOnly();

    dictionary.set("b", 2);

    Assert.areEqual(2, view.count());
    Assert.areEqual(2, view.get("b"));
  }

  @TestMethod
  public enumeratesWithTheChecksOfItsDictionary(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1), new KeyValuePair("b", 2)]);
    const view = dictionary.asReadOnly();
    const enumerateWhileRemoving = (): void => {
      for (const entry of view)
        dictionary.remove(entry.key);
    };

    Assert.throws(enumerateWhileRemoving, InvalidOperationException);
  }

  @TestMethod
  public cannotBeTurnedBackIntoTheDictionary(): void {
    const view = new Dictionary([new KeyValuePair("a", 1)]).asReadOnly();

    Assert.isFalse(view instanceof Dictionary);
    Assert.isFalse("set" in view);
    Assert.isInstanceOf(view, Enumerable);
  }
}
