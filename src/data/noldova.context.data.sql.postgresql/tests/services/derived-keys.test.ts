/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

import { DerivedKeys } from "@noldova/context.data.sql.postgresql/services/derived-keys.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DerivedKeysTests {
  private static readonly password: string = "pencil";

  @TestMethod
  public async returnsAKeyItAlreadyDerivedWithoutDerivingItAgain(): Promise<void> {
    const keys = new DerivedKeys();
    const salt = Buffer.from(`known-${randomUUID()}`).toString("base64");
    const derived = await keys.deriveAsync(DerivedKeysTests.password, salt, 1);

    const known = keys.deriveAsync(DerivedKeysTests.password, salt, 1);
    const derivingWhileKnown = keys.deriving.size;

    Assert.areEqual(derived, await known);
    Assert.areEqual(0, derivingWhileKnown);
  }

  @TestMethod
  public async dropsTheOldestKeyWhenItHoldsSixtyFour(): Promise<void> {
    const keys = new DerivedKeys();
    const salts = Array.from({ length: 65 }, (_value, index) => Buffer.from(`oldest-${index.toString()}-${randomUUID()}`).toString("base64"));
    const derived: Buffer[] = [];
    for (const salt of salts)
      derived.push(await keys.deriveAsync(DerivedKeysTests.password, salt, 1));

    const second = await keys.deriveAsync(DerivedKeysTests.password, salts[1] ?? "", 1);
    const first = await keys.deriveAsync(DerivedKeysTests.password, salts[0] ?? "", 1);

    Assert.areEqual(derived[1], second);
    Assert.areNotEqual(derived[0], first);
    Assert.isTrue(derived[0]?.equals(first) ?? false);
  }

  @TestMethod
  public async keepsNoKeyOnceClearedEvenFromADerivationStillRunning(): Promise<void> {
    const keys = new DerivedKeys();
    const salt = Buffer.from(`cleared-${randomUUID()}`).toString("base64");
    await keys.deriveAsync(DerivedKeysTests.password, salt, 1);

    keys.clear();
    const running = keys.deriveAsync(DerivedKeysTests.password, salt, 50_000);
    keys.clear();
    await running;

    Assert.areEqual(0, keys.salted.size);
    Assert.areEqual(0, keys.deriving.size);
  }
}
