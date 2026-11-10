/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

export class Der {
  public static element(tag: number, ...contents: Buffer[]): Buffer {
    const body = Buffer.concat(contents);
    return Buffer.concat([Buffer.from([tag]), Der.length(body.length), body]);
  }

  public static sequence(...contents: Buffer[]): Buffer {
    return Der.element(0x30, ...contents);
  }

  public static identifier(hex: string): Buffer {
    return Der.element(0x06, Buffer.from(hex, "hex"));
  }

  public static algorithm(hex: string, ...parameters: Buffer[]): Buffer {
    return Der.sequence(Der.identifier(hex), ...parameters);
  }

  public static certificate(algorithm: Buffer, subject: string = "localhost"): Buffer {
    const signed = Der.sequence(Der.element(0x02, Buffer.from([1])), Der.element(0x0c, Buffer.from(subject)));
    return Der.sequence(signed, algorithm, Der.element(0x03, Buffer.from([0, 1, 2, 3])));
  }

  private static length(length: number): Buffer {
    if (length < 0x80)
      return Buffer.from([length]);

    const bytes: number[] = [];
    for (let rest = length; rest > 0; rest = Math.floor(rest / 256))
      bytes.unshift(rest % 256);
    return Buffer.from([0x80 | bytes.length, ...bytes]);
  }
}
