/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import "@noldova/context.core";

export class ProtocolWriter {
  private static readonly retainedLength: number = 4096;

  private readonly size: number;
  private buffer: Buffer;
  private index: number = 0;
  private start: number = 0;

  public constructor(size: number = 16384) {
    this.size = size;
    this.buffer = Buffer.allocUnsafe(size);
  }

  public get length(): number {
    return this.index;
  }

  public writeType(code: number): this {
    this.fit(5);
    this.start = this.index;
    this.buffer[this.index] = code;
    this.index += 5;
    return this;
  }

  public beginUntyped(): this {
    this.fit(4);
    this.start = this.index;
    this.index += 4;
    return this;
  }

  public end(): this {
    this.buffer.writeInt32BE(this.index - this.start - 1, this.start + 1);
    return this;
  }

  public endUntyped(): this {
    this.buffer.writeInt32BE(this.index - this.start, this.start);
    return this;
  }

  public writeString(text: string): this {
    this.fit(text.length * 3 + 1);
    this.index += this.buffer.write(text, this.index);
    this.buffer[this.index] = 0;
    this.index += 1;
    return this;
  }

  public writeBytes(value: string | Uint8Array): this {
    if (Object.isString(value)) {
      this.fit(value.length * 3);
      this.index += this.buffer.write(value, this.index);
    }
    else {
      this.fit(value.length);
      this.buffer.set(value, this.index);
      this.index += value.length;
    }

    return this;
  }

  public writeValue(value: string | Uint8Array | null): this {
    if (Object.isNull(value))
      return this.writeInt32(-1);

    const lengthAt = this.index;
    this.fit(4);
    this.index += 4;
    this.writeBytes(value);
    this.buffer.writeInt32BE(this.index - lengthAt - 4, lengthAt);
    return this;
  }

  public writeUint8(value: number): this {
    this.fit(1);
    this.buffer[this.index] = value;
    this.index += 1;
    return this;
  }

  public writeInt16(value: number): this {
    this.fit(2);
    this.buffer.writeInt16BE(value, this.index);
    this.index += 2;
    return this;
  }

  public writeUint16(value: number): this {
    this.fit(2);
    this.buffer.writeUInt16BE(value, this.index);
    this.index += 2;
    return this;
  }

  public writeInt32(value: number): this {
    this.fit(4);
    this.buffer.writeInt32BE(value, this.index);
    this.index += 4;
    return this;
  }

  public truncate(length: number): this {
    this.index = length;
    return this;
  }

  public take(): Buffer {
    const output = this.index < ProtocolWriter.retainedLength ? Buffer.from(this.buffer.subarray(0, this.index)) : this.buffer.subarray(0, this.index);
    if (this.index >= ProtocolWriter.retainedLength)
      this.buffer = Buffer.allocUnsafe(this.size);
    this.index = 0;
    this.start = 0;
    return output;
  }

  private fit(length: number): void {
    if (this.buffer.length - this.index >= length)
      return;

    const previous = this.buffer;
    this.buffer = Buffer.allocUnsafe(Math.max(this.size, previous.length * 2, this.index + length));
    previous.copy(this.buffer, 0, 0, this.index);
  }
}
