/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ConnectionClosedException } from "../../exceptions/connection-closed.exception.js";
import type { BinaryDecoder } from "../../types/binary-decoder.js";
import type { ValueParser } from "../../types/value-parser.js";
import type { ValueSerializer } from "../../types/value-serializer.js";
import type { PostgreSQLConnection } from "../../models/client/postgresql-connection.js";

export abstract class ConnectionEvents {
  public abstract get typed(): boolean;

  public abstract get plain(): boolean;

  public abstract get cancels(): AbortSignal;

  public abstract findParser(oid: number): ValueParser | null;

  public abstract findDecoder(oid: number, parser: ValueParser | null): BinaryDecoder | null;

  public abstract findBinaryDecoder(oid: number): BinaryDecoder | null;

  public abstract findSerializer(oid: number): ValueSerializer;

  public abstract hasUnknownTypes(oids: readonly number[]): boolean;

  public abstract requestTypes(connection: PostgreSQLConnection): void;

  public abstract onReady(connection: PostgreSQLConnection): void;

  public abstract onClose(connection: PostgreSQLConnection, error: ConnectionClosedException): void;

  public abstract onNotify(channel: string, payload: string, pid: number): void;

  public abstract onParameter(name: string, value: string): void;

  public abstract onTimed(sample: number, time: number): void;

  public abstract onCancelling(cancel: Promise<void>): void;
}
