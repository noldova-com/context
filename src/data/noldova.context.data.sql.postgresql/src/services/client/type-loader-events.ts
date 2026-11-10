/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { BinaryDecoder } from "../../types/binary-decoder.js";
import type { ValueParser } from "../../types/value-parser.js";
import type { ValueSerializer } from "../../types/value-serializer.js";
import { ConnectionEvents } from "./connection-events.js";

export class TypeLoaderEvents extends ConnectionEvents {
  private readonly events: ConnectionEvents;

  public constructor(events: ConnectionEvents) {
    super();
    this.events = events;
  }

  public override get typed(): boolean {
    return this.events.typed;
  }

  public override get plain(): boolean {
    return this.events.plain;
  }

  public override get cancels(): AbortSignal {
    return this.events.cancels;
  }

  public override findParser(oid: number): ValueParser | null {
    return this.events.findParser(oid);
  }

  public override findDecoder(oid: number, parser: ValueParser | null): BinaryDecoder | null {
    return this.events.findDecoder(oid, parser);
  }

  public override findBinaryDecoder(oid: number): BinaryDecoder | null {
    return this.events.findBinaryDecoder(oid);
  }

  public override findSerializer(oid: number): ValueSerializer {
    return this.events.findSerializer(oid);
  }

  public override hasUnknownTypes(oids: readonly number[]): boolean {
    return this.events.hasUnknownTypes(oids);
  }

  public override requestTypes(): void {
    return;
  }

  public override onReady(): void {
    return;
  }

  public override onClose(): void {
    return;
  }

  public override onNotify(channel: string, payload: string, pid: number): void {
    this.events.onNotify(channel, payload, pid);
  }

  public override onParameter(): void {
    return;
  }

  public override onTimed(): void {
    return;
  }

  public override onCancelling(cancel: Promise<void>): void {
    this.events.onCancelling(cancel);
  }
}
