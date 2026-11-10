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

export class BackendMessages {
  public static message(type: string, body: string | Buffer = Buffer.alloc(0)): Buffer {
    const content = typeof body === "string" ? Buffer.from(body) : body;
    const header = Buffer.alloc(5);
    header.write(type, 0);
    header.writeInt32BE(4 + content.length, 1);
    return Buffer.concat([header, content]);
  }

  public static parseComplete(): Buffer {
    return BackendMessages.message("1");
  }

  public static bindComplete(): Buffer {
    return BackendMessages.message("2");
  }

  public static noData(): Buffer {
    return BackendMessages.message("n");
  }

  public static portalSuspended(): Buffer {
    return BackendMessages.message("s");
  }

  public static emptyQuery(): Buffer {
    return BackendMessages.message("I");
  }

  public static copyDone(): Buffer {
    return BackendMessages.message("c");
  }

  public static copyIn(): Buffer {
    return BackendMessages.message("G", Buffer.from("000000", "hex"));
  }

  public static copyOut(): Buffer {
    return BackendMessages.message("H", Buffer.from("000000", "hex"));
  }

  public static copyData(text: string): Buffer {
    return BackendMessages.message("d", text);
  }

  public static parameterDescription(oids: readonly number[]): Buffer {
    const body = Buffer.alloc(2 + oids.length * 4);
    body.writeUInt16BE(oids.length, 0);
    oids.forEach((oid, index) => body.writeUInt32BE(oid, 2 + index * 4));
    return BackendMessages.message("t", body);
  }

  public static rowDescription(columns: readonly (readonly [string, number])[], table: number = 0): Buffer {
    const parts: Buffer[] = [Buffer.alloc(2)];
    parts[0]?.writeUInt16BE(columns.length, 0);
    columns.forEach(([name, type], index) => {
      const field = Buffer.alloc(18);
      field.writeUInt32BE(table, 0);
      field.writeUInt16BE(index + 1, 4);
      field.writeUInt32BE(type, 6);
      field.writeInt16BE(-1, 10);
      field.writeInt32BE(-1, 12);
      field.writeInt16BE(0, 16);
      parts.push(Buffer.from(name + "\0"), field);
    });
    return BackendMessages.message("T", Buffer.concat(parts));
  }

  public static dataRow(values: readonly (string | null)[]): Buffer {
    const parts: Buffer[] = [Buffer.alloc(2)];
    parts[0]?.writeUInt16BE(values.length, 0);
    for (const value of values) {
      const length = Buffer.alloc(4);
      length.writeInt32BE(Object.isNull(value) ? -1 : Buffer.byteLength(value), 0);
      parts.push(length);
      if (!Object.isNull(value))
        parts.push(Buffer.from(value));
    }
    return BackendMessages.message("D", Buffer.concat(parts));
  }

  public static commandComplete(tag: string): Buffer {
    return BackendMessages.message("C", tag + "\0");
  }

  public static readyForQuery(status: string = "I"): Buffer {
    return BackendMessages.message("Z", status);
  }

  public static error(code: string, message: string, severity: string = "ERROR"): Buffer {
    return BackendMessages.message("E", `S${severity}\0V${severity}\0C${code}\0M${message}\0\0`);
  }

  public static notice(message: string): Buffer {
    return BackendMessages.message("N", `SNOTICE\0C00000\0M${message}\0\0`);
  }

  public static notification(pid: number, channel: string, payload: string): Buffer {
    const head = Buffer.alloc(4);
    head.writeInt32BE(pid, 0);
    return BackendMessages.message("A", Buffer.concat([head, Buffer.from(`${channel}\0${payload}\0`)]));
  }

  public static parameterStatus(name: string, value: string): Buffer {
    return BackendMessages.message("S", `${name}\0${value}\0`);
  }

  public static backendKeyData(pid: number, secret: number): Buffer {
    const body = Buffer.alloc(8);
    body.writeInt32BE(pid, 0);
    body.writeInt32BE(secret, 4);
    return BackendMessages.message("K", body);
  }

  public static types(data: Buffer): string {
    const types: string[] = [];
    for (let index = 0; index < data.length; index += 1 + data.readInt32BE(index + 1))
      types.push(String.fromCharCode(data.readUInt8(index)));

    return types.join(",");
  }
}
