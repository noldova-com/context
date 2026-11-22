/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Buffer } from "node:buffer";

import "@noldova/context.core";

import { MalformedMessageException } from "../../exceptions/malformed-message.exception.js";
import { Backend } from "../protocol/backend.js";

export class BinaryArrayReader {
  private static readonly HEADER_LENGTH: number = 12;
  private static readonly DIMENSION_LENGTH: number = 8;
  private static readonly ELEMENT_LENGTH_SIZE: number = 4;
  private static readonly MAX_DIMENSIONS: number = 6;

  private readonly data: Buffer;
  private readonly end: number;
  private readonly width: number;
  private readonly read: (data: Buffer, at: number) => unknown;
  private readonly sizes: number[] = [];
  private at: number;

  public constructor(data: Buffer, start: number, end: number, width: number, read: (data: Buffer, at: number) => unknown) {
    if (start + BinaryArrayReader.HEADER_LENGTH > end)
      throw new MalformedMessageException();

    const dimensions = data.readInt32BE(start);
    const first = start + BinaryArrayReader.HEADER_LENGTH + dimensions * BinaryArrayReader.DIMENSION_LENGTH;
    if (dimensions < 0 || dimensions > BinaryArrayReader.MAX_DIMENSIONS || first > end)
      throw new MalformedMessageException();

    let elements = dimensions === 0 ? 0 : 1;
    for (let dimension = 0; dimension < dimensions; dimension += 1) {
      const size = data.readInt32BE(start + BinaryArrayReader.HEADER_LENGTH + dimension * BinaryArrayReader.DIMENSION_LENGTH);
      if (size < 1)
        throw new MalformedMessageException();

      this.sizes.push(size);
      elements *= size;
    }
    if (elements * BinaryArrayReader.ELEMENT_LENGTH_SIZE > end - first)
      throw new MalformedMessageException();

    this.data = data;
    this.end = end;
    this.width = width;
    this.read = read;
    this.at = first;
  }

  public readValues(): unknown[] {
    const read = this.sizes.reduceRight<(() => unknown[]) | null>((inner, count) => this.createReader(count, inner), null);
    return Object.isNull(read) ? [] : read();
  }

  private createReader(count: number, inner: (() => unknown[]) | null): () => unknown[] {
    return Object.isNull(inner) ? () => this.readElements(count) : () => Array.from({ length: count }, () => inner());
  }

  private readElements(count: number): unknown[] {
    const values: unknown[] = [];
    for (let index = 0; index < count; index += 1) {
      const length = Backend.readFieldLength(this.data, this.at, this.end);
      if (length !== -1 && length !== this.width)
        throw new MalformedMessageException();

      this.at += BinaryArrayReader.ELEMENT_LENGTH_SIZE;
      if (length === -1)
        values.push(null);
      else {
        values.push(this.read(this.data, this.at));
        this.at += length;
      }
    }

    return values;
  }
}
