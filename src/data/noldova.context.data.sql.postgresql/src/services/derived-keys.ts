/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { createHash, webcrypto } from "node:crypto";

import "@noldova/context.core";

export class DerivedKeys {
  private static readonly LIMIT: number = 64;

  private readonly salted: Map<string, Buffer> = new Map();
  private readonly deriving: Map<string, Promise<Buffer>> = new Map();

  public deriveAsync(password: string, salt: string, iterations: number): Promise<Buffer> {
    const key = createHash("sha256").update(password + "\0" + salt + "\0" + iterations.toString()).digest("base64");
    const known = this.salted.get(key);
    if (!Object.isUndefined(known))
      return Promise.resolve(known);

    const running = this.deriving.get(key);
    if (!Object.isUndefined(running))
      return running;

    const derivation: Promise<Buffer> = DerivedKeys.computeAsync(password, salt, iterations).then(salted => {
      if (this.deriving.get(key) === derivation)
        this.remember(key, salted);
      return salted;
    });
    const forget = (): void => {
      this.deriving.delete(key);
    };
    this.deriving.set(key, derivation);
    void derivation.then(forget, forget);
    return derivation;
  }

  public clear(): void {
    this.salted.clear();
    this.deriving.clear();
  }

  private static async computeAsync(password: string, salt: string, iterations: number): Promise<Buffer> {
    const passwordKey = await webcrypto.subtle.importKey("raw", Buffer.from(password, "utf8"), "PBKDF2", false, ["deriveBits"]);
    return Buffer.from(await webcrypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: Buffer.from(salt, "base64"), iterations }, passwordKey, 256));
  }

  private remember(key: string, salted: Buffer): void {
    if (this.salted.size >= DerivedKeys.LIMIT) {
      const oldest = this.salted.keys().next();
      if (oldest.done !== true)
        this.salted.delete(oldest.value);
    }

    this.salted.set(key, salted);
  }
}
