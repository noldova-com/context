/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary, KeyValuePair } from "@noldova/context.collections";
import { ArgumentException, InvalidOperationException, KeyNotFoundException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CaseInsensitiveComparer } from "../fixtures/case-insensitive-comparer.fixture.js";

@TestClass
export class DictionaryTests {
  private static readonly caseInsensitive: CaseInsensitiveComparer = new CaseInsensitiveComparer();

  @TestMethod
  public startsEmptyByDefault(): void {
    Assert.areEqual(0, new Dictionary<string, number>().count());
  }

  @TestMethod
  public addsTheEntriesItIsGivenInOrder(): void {
    const dictionary = new Dictionary([new KeyValuePair("b", 2), new KeyValuePair("a", 1)]);

    Assert.areEqual("[{\"key\":\"b\",\"value\":2},{\"key\":\"a\",\"value\":1}]", JSON.stringify(dictionary.toArray()));
  }

  @TestMethod
  public enumeratesKeyValuePairs(): void {
    const entry = new Dictionary([new KeyValuePair("a", 1)]).first();

    Assert.isInstanceOf(entry, KeyValuePair);
    Assert.areEqual("a", entry.key);
    Assert.areEqual(1, entry.value);
  }

  @TestMethod
  public throwsForADuplicateKeyAmongTheEntriesItIsGiven(): void {
    const exception = Assert.throws(() => new Dictionary([new KeyValuePair("a", 1), new KeyValuePair("a", 2)]), ArgumentException);

    Assert.areEqual("An entry with the same key already exists. (Parameter 'key')", exception.message);
  }

  @TestMethod
  public countsAllOrTheMatchingEntries(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1), new KeyValuePair("b", 2), new KeyValuePair("c", 3)]);

    Assert.areEqual(3, dictionary.count());
    Assert.areEqual(2, dictionary.count(t => t.value > 1));
  }

  @TestMethod
  public getReturnsTheValueOfTheKey(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1)]);

    Assert.areEqual(1, dictionary.get("a"));
  }

  @TestMethod
  public getReturnsANullValue(): void {
    const dictionary = new Dictionary<string, number | null>([new KeyValuePair("a", null)]);

    Assert.isNull(dictionary.get("a"));
  }

  @TestMethod
  public getThrowsForAMissingKey(): void {
    const exception = Assert.throws(() => new Dictionary([new KeyValuePair("a", 1)]).get("b"), KeyNotFoundException);

    Assert.areEqual("The key is not present in the collection.", exception.message);
  }

  @TestMethod
  public tryGetReturnsUndefinedForAMissingKey(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1)]);

    Assert.areEqual(1, dictionary.tryGet("a"));
    Assert.isUndefined(dictionary.tryGet("b"));
  }

  @TestMethod
  public setAddsANewKeyAtTheEnd(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1)]);

    dictionary.set("b", 2);

    Assert.areEqual("[{\"key\":\"a\",\"value\":1},{\"key\":\"b\",\"value\":2}]", JSON.stringify(dictionary.toArray()));
  }

  @TestMethod
  public setReplacesTheValueOfAnExistingKeyInPlace(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1), new KeyValuePair("b", 2)]);

    dictionary.set("a", 3);

    Assert.areEqual("[{\"key\":\"a\",\"value\":3},{\"key\":\"b\",\"value\":2}]", JSON.stringify(dictionary.toArray()));
  }

  @TestMethod
  public addAddsANewKey(): void {
    const dictionary = new Dictionary<string, number>();

    dictionary.add("a", 1);

    Assert.areEqual(1, dictionary.get("a"));
  }

  @TestMethod
  public addThrowsForAnExistingKeyAndKeepsItsValue(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1)]);

    const exception = Assert.throws(() => dictionary.add("a", 2), ArgumentException);

    Assert.areEqual("An entry with the same key already exists. (Parameter 'key')", exception.message);
    Assert.areEqual("key", exception.parameterName);
    Assert.areEqual(1, dictionary.get("a"));
  }

  @TestMethod
  public tryAddAddsOnlyANewKey(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1)]);

    Assert.isTrue(dictionary.tryAdd("b", 2));
    Assert.isFalse(dictionary.tryAdd("a", 3));
    Assert.areEqual("[{\"key\":\"a\",\"value\":1},{\"key\":\"b\",\"value\":2}]", JSON.stringify(dictionary.toArray()));
  }

  @TestMethod
  public removeReturnsWhetherTheKeyWasPresent(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1), new KeyValuePair("b", 2)]);

    Assert.isTrue(dictionary.remove("a"));
    Assert.isFalse(dictionary.remove("a"));
    Assert.areEqual("[{\"key\":\"b\",\"value\":2}]", JSON.stringify(dictionary.toArray()));
  }

  @TestMethod
  public containsKeyTellsWhetherTheKeyIsPresent(): void {
    const dictionary = new Dictionary([new KeyValuePair(Number.NaN, 1)]);

    Assert.isTrue(dictionary.containsKey(Number.NaN));
    Assert.isFalse(dictionary.containsKey(1));
  }

  @TestMethod
  public containsValueComparesTheValuesByDefaultEquality(): void {
    const dictionary = new Dictionary<string, number | null>([new KeyValuePair("a", Number.NaN), new KeyValuePair("b", null)]);

    Assert.isTrue(dictionary.containsValue(Number.NaN));
    Assert.isTrue(dictionary.containsValue(null));
    Assert.isFalse(dictionary.containsValue(1));
  }

  @TestMethod
  public keysAndValuesFollowTheEntriesAsTheyAreWhenEnumerated(): void {
    const dictionary = new Dictionary([new KeyValuePair("b", 2), new KeyValuePair("a", 1)]);
    const keys = dictionary.keys();
    const values = dictionary.values();

    dictionary.set("c", 3);

    Assert.areEqual("[\"b\",\"a\",\"c\"]", JSON.stringify(keys.toArray()));
    Assert.areEqual("[2,1,3]", JSON.stringify(values.toArray()));
  }

  @TestMethod
  public clearRemovesEveryEntry(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1)]);

    dictionary.clear();

    Assert.areEqual(0, dictionary.count());
    Assert.isFalse(dictionary.containsKey("a"));
  }

  @TestMethod
  public findsKeysWithTheComparer(): void {
    const dictionary = new Dictionary([new KeyValuePair("ab", 1), new KeyValuePair("cd", 2)], DictionaryTests.caseInsensitive);

    Assert.areEqual(1, dictionary.get("AB"));
    Assert.areEqual(2, dictionary.get("Cd"));
    Assert.isTrue(dictionary.containsKey("aB"));
    Assert.isFalse(dictionary.containsKey("xy"));
    Assert.isFalse(dictionary.containsKey("abc"));
    Assert.isUndefined(dictionary.tryGet("xy"));
  }

  @TestMethod
  public keepsTheFirstKeyWhenTheComparerFindsAnEqualOne(): void {
    const dictionary = new Dictionary([new KeyValuePair("ab", 1)], DictionaryTests.caseInsensitive);

    dictionary.set("AB", 2);

    Assert.isFalse(dictionary.tryAdd("Ab", 3));
    Assert.areEqual("[{\"key\":\"ab\",\"value\":2}]", JSON.stringify(dictionary.toArray()));
  }

  @TestMethod
  public removesKeysWithTheComparer(): void {
    const dictionary = new Dictionary([new KeyValuePair("ab", 1), new KeyValuePair("cd", 2)], DictionaryTests.caseInsensitive);

    Assert.isFalse(dictionary.remove("xy"));
    Assert.isFalse(dictionary.remove("abc"));
    Assert.isTrue(dictionary.remove("AB"));
    Assert.isTrue(dictionary.containsKey("CD"));
    Assert.isTrue(dictionary.remove("CD"));
    Assert.isFalse(dictionary.remove("cd"));
    Assert.areEqual(0, dictionary.count());
  }

  @TestMethod
  public addsAKeyAgainAfterTheComparerRemovedIt(): void {
    const dictionary = new Dictionary([new KeyValuePair("ab", 1)], DictionaryTests.caseInsensitive);

    dictionary.remove("AB");
    dictionary.add("AB", 2);

    Assert.areEqual("[{\"key\":\"AB\",\"value\":2}]", JSON.stringify(dictionary.toArray()));
    Assert.areEqual(2, dictionary.get("ab"));
  }

  @TestMethod
  public clearRemovesEveryEntryWithTheComparer(): void {
    const dictionary = new Dictionary([new KeyValuePair("ab", 1)], DictionaryTests.caseInsensitive);

    dictionary.clear();

    Assert.isFalse(dictionary.containsKey("ab"));
    dictionary.add("AB", 2);
    Assert.areEqual(2, dictionary.get("ab"));
  }

  @TestMethod
  public changingTheDictionaryWhileEnumeratingItThrows(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1), new KeyValuePair("b", 2)]);
    const enumerateWhileAdding = (): void => {
      for (const entry of dictionary)
        dictionary.set(`${entry.key}${entry.key}`, entry.value);
    };

    const exception = Assert.throws(enumerateWhileAdding, InvalidOperationException);

    Assert.areEqual("The collection was changed while it was being enumerated.", exception.message);
    Assert.areEqual("[\"a\",\"b\",\"aa\"]", JSON.stringify(dictionary.keys().toArray()));
  }

  @TestMethod
  public everyChangeEndsAnEnumerationInProgress(): void {
    const changes: readonly ((dictionary: Dictionary<string, number>) => void)[] = [
      t => t.set("a", 9),
      t => t.set("z", 9),
      t => t.add("z", 9),
      t => t.tryAdd("z", 9),
      t => t.remove("a"),
      t => t.clear()
    ];

    for (const change of changes) {
      const dictionary = new Dictionary([new KeyValuePair("a", 1), new KeyValuePair("b", 2)]);
      const iterator = dictionary[Symbol.iterator]();
      iterator.next();

      change(dictionary);

      Assert.throws(() => iterator.next(), InvalidOperationException);
    }
  }

  @TestMethod
  public anAttemptThatChangesNothingLeavesAnEnumerationRunning(): void {
    const dictionary = new Dictionary([new KeyValuePair("a", 1), new KeyValuePair("b", 2)]);
    const keys: string[] = [];

    for (const entry of dictionary) {
      dictionary.tryAdd("a", 9);
      dictionary.remove("z");
      keys.push(entry.key);
    }

    Assert.areEqual("[\"a\",\"b\"]", JSON.stringify(keys));
  }
}
