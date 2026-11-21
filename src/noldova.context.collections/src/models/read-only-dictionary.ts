/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyDictionary } from "../interfaces/i-read-only-dictionary.js";
import { Enumerable } from "./enumerable.js";
import type { KeyValuePair } from "./key-value-pair.js";

export class ReadOnlyDictionary<TKey, TValue extends {} | null> extends Enumerable<KeyValuePair<TKey, TValue>>
  implements IReadOnlyDictionary<TKey, TValue> {
  private readonly dictionary: IReadOnlyDictionary<TKey, TValue>;

  public constructor(dictionary: IReadOnlyDictionary<TKey, TValue>) {
    super();

    this.dictionary = dictionary;
  }

  public override [Symbol.iterator](): Iterator<KeyValuePair<TKey, TValue>> {
    return this.dictionary[Symbol.iterator]();
  }

  public override count(predicate?: (item: KeyValuePair<TKey, TValue>) => boolean): number {
    return this.dictionary.count(predicate);
  }

  public get(key: TKey): TValue {
    return this.dictionary.get(key);
  }

  public tryGet(key: TKey): TValue | undefined {
    return this.dictionary.tryGet(key);
  }

  public containsKey(key: TKey): boolean {
    return this.dictionary.containsKey(key);
  }

  public keys(): Enumerable<TKey> {
    return this.dictionary.keys();
  }

  public values(): Enumerable<TValue> {
    return this.dictionary.values();
  }
}
