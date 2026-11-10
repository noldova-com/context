/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
import type { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import { ConnectionEvents } from "@noldova/context.data.sql.postgresql/services/client/connection-events.js";
import type { PostgreSQLConnection } from "@noldova/context.data.sql.postgresql/models/client/postgresql-connection.js";
import { TypeRegistry } from "@noldova/context.data.sql.postgresql/models/type-registry.js";
import type { BinaryDecoder } from "@noldova/context.data.sql.postgresql/types/binary-decoder.js";
import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";
import type { ValueSerializer } from "@noldova/context.data.sql.postgresql/types/value-serializer.js";

export class FakeEvents extends ConnectionEvents {
  public readonly registry: TypeRegistry;
  public readonly needed: PostgreSQLConnection[] = [];
  public readonly closes: ConnectionClosedException[] = [];
  public readonly notifications: string[] = [];
  public readonly parameters: string[] = [];
  public readonly timed: number[] = [];
  public readonly cancelAbort: AbortController = new AbortController();
  public readonly cancelled: Promise<void>[] = [];
  public isTyped: boolean = true;
  public unknownTypes: boolean = false;
  public ready: number = 0;

  public constructor(options: ClientOptions) {
    super();
    this.registry = new TypeRegistry(options);
  }

  public override get typed(): boolean {
    return this.isTyped;
  }

  public override get plain(): boolean {
    return this.registry.plain;
  }

  public override get cancels(): AbortSignal {
    return this.cancelAbort.signal;
  }

  public override findParser(oid: number): ValueParser | null {
    return this.registry.findParser(oid);
  }

  public override findDecoder(oid: number, parser: ValueParser | null): BinaryDecoder | null {
    return this.registry.findDecoder(oid, parser);
  }

  public override findBinaryDecoder(oid: number): BinaryDecoder | null {
    return this.registry.findBinaryDecoder(oid);
  }

  public override findSerializer(oid: number): ValueSerializer {
    return this.registry.findSerializer(oid);
  }

  public override hasUnknownTypes(oids: readonly number[]): boolean {
    return this.unknownTypes && oids.length > 0;
  }

  public override requestTypes(connection: PostgreSQLConnection): void {
    this.needed.push(connection);
  }

  public override onReady(): void {
    this.ready += 1;
  }

  public override onClose(_connection: PostgreSQLConnection, error: ConnectionClosedException): void {
    this.closes.push(error);
  }

  public override onNotify(channel: string, payload: string, pid: number): void {
    this.notifications.push(`${channel}:${payload}:${pid}`);
  }

  public override onParameter(name: string, value: string): void {
    this.parameters.push(`${name}=${value}`);
  }

  public override onTimed(sample: number): void {
    this.timed.push(sample);
  }

  public override onCancelling(cancel: Promise<void>): void {
    this.cancelled.push(cancel);
  }
}
