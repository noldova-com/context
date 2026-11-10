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
import { DataException } from "@noldova/context.data";

import { Resources } from "../../resources.js";

export class FrameReader {
  private static readonly headerLength: number = 5;
  private static readonly largest: number = 0x40000000;

  private readonly chunks: Buffer[] = [];
  private readonly owned: WeakSet<Buffer> = new WeakSet();
  private readonly shared: boolean;
  private readonly onFrame: (type: number, data: Buffer, start: number, end: number) => void;
  private readonly onError: (error: DataException) => void;
  private data: Buffer | null = null;
  private at: number = 0;
  private part: Buffer | null = null;
  private filled: number = 0;
  private running: boolean = false;
  private broken: boolean = false;
  private paused: boolean = false;
  private owning: boolean = false;

  public constructor(
    onFrame: (type: number, data: Buffer, start: number, end: number) => void, onError: (error: DataException) => void, shared: boolean = false) {
    this.onFrame = onFrame;
    this.onError = onError;
    this.shared = shared;
  }

  public get isPaused(): boolean {
    return this.paused;
  }

  public push(chunk: Buffer): void {
    if (this.broken)
      return;

    this.chunks.push(this.shared && (this.paused || this.owning) ? this.copy(chunk) : chunk);
    this.run();
  }

  public isOwning(data: Buffer): boolean {
    return !this.shared || this.owned.has(data);
  }

  public setOwning(owning: boolean): void {
    this.owning = owning;
    if (owning)
      this.settle();
  }

  public pause(): void {
    this.paused = true;
    this.settle();
  }

  public resume(): void {
    this.paused = false;
    this.run();
  }

  private copy(data: Buffer): Buffer {
    const copy = Buffer.from(data);
    this.owned.add(copy);
    return copy;
  }

  private settle(): void {
    if (!this.shared)
      return;

    if (!Object.isNull(this.data) && this.at < this.data.length && !this.owned.has(this.data)) {
      this.data = this.copy(this.data.subarray(this.at));
      this.at = 0;
    }
    for (let index = 0; index < this.chunks.length; index += 1) {
      const chunk = this.chunks[index];
      if (!Object.isUndefined(chunk) && !this.owned.has(chunk))
        this.chunks[index] = this.copy(chunk);
    }
  }

  private run(): void {
    if (this.running)
      return;

    this.running = true;
    try {
      while (!this.broken && !this.paused) {
        const data = this.takeAvailable();
        if (Object.isNull(data))
          break;

        if (Object.isNull(this.part))
          this.readFrame(data);
        else
          this.fill(this.part, data);
      }
    }
    finally {
      this.running = false;
    }
  }

  private takeAvailable(): Buffer | null {
    if (!Object.isNull(this.data) && this.at < this.data.length)
      return this.data;

    this.data = this.chunks.shift() ?? null;
    this.at = 0;
    return this.data;
  }

  private isInvalid(length: number): boolean {
    if (length >= 4 && length <= FrameReader.largest)
      return false;

    this.broken = true;
    this.chunks.length = 0;
    this.data = null;
    this.part = null;
    this.at = 0;
    this.filled = 0;
    this.onError(new DataException(Resources.formatInvalidMessageLength(length)));
    return true;
  }

  private readFrame(data: Buffer): void {
    const left = data.length - this.at;
    if (left < FrameReader.headerLength) {
      this.startPart(data, FrameReader.headerLength);
      return;
    }

    const length = data.readInt32BE(this.at + 1);
    if (this.isInvalid(length))
      return;

    const end = this.at + 1 + length;
    if (end > data.length) {
      this.startPart(data, end - this.at);
      return;
    }

    const begin = this.at;
    this.at = end;
    this.onFrame(data.readUInt8(begin), data, begin, end);
  }

  private startPart(data: Buffer, length: number): void {
    const part = Buffer.allocUnsafe(length);
    if (this.shared)
      this.owned.add(part);
    this.filled = data.copy(part, 0, this.at);
    this.part = part;
    this.at = data.length;
  }

  private fill(part: Buffer, data: Buffer): void {
    const copied = data.copy(part, this.filled, this.at, this.at + part.length - this.filled);
    this.filled += copied;
    this.at += copied;
    if (this.filled < part.length)
      return;

    if (part.length === FrameReader.headerLength) {
      const length = part.readInt32BE(1);
      if (this.isInvalid(length))
        return;

      const whole = Buffer.allocUnsafe(1 + length);
      if (this.shared)
        this.owned.add(whole);
      this.filled = part.copy(whole);
      this.part = whole;
      if (this.filled === whole.length)
        this.finishPart(whole);
      return;
    }

    this.finishPart(part);
  }

  private finishPart(part: Buffer): void {
    this.part = null;
    this.onFrame(part.readUInt8(0), part, 0, part.length);
  }
}
