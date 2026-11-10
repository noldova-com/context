/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import { DataException } from "@noldova/context.data";

import { FrontendMessage } from "../../enums/frontend-message.js";
import { MessageTarget } from "../../enums/message-target.js";
import { Resources } from "../../resources.js";
import { ProtocolWriter } from "./protocol-writer.js";

export class Frontend {
  private static readonly protocolVersion: number = 196608;
  private static readonly sslRequestCode: number = 80877103;
  private static readonly cancelRequestCode: number = 80877102;

  private readonly writer: ProtocolWriter = new ProtocolWriter(1024);

  public static writeSync(writer: ProtocolWriter): ProtocolWriter {
    return writer.writeType(FrontendMessage.Sync).end();
  }

  public static writeFlush(writer: ProtocolWriter): ProtocolWriter {
    return writer.writeType(FrontendMessage.Flush).end();
  }

  public static writeTerminate(writer: ProtocolWriter): ProtocolWriter {
    return writer.writeType(FrontendMessage.Terminate).end();
  }

  public static writeCopyDone(writer: ProtocolWriter): ProtocolWriter {
    return writer.writeType(FrontendMessage.CopyDone).end();
  }

  public static writeSslRequest(writer: ProtocolWriter): ProtocolWriter {
    return writer.beginUntyped().writeInt32(Frontend.sslRequestCode).endUntyped();
  }

  public static writeQuery(writer: ProtocolWriter, text: string): ProtocolWriter {
    return writer.writeType(FrontendMessage.Query).writeString(text).end();
  }

  public static writePassword(writer: ProtocolWriter, text: string): ProtocolWriter {
    return writer.writeType(FrontendMessage.Password).writeString(text).end();
  }

  public static writeSaslResponse(writer: ProtocolWriter, text: string): ProtocolWriter {
    return writer.writeType(FrontendMessage.Password).writeBytes(text).end();
  }

  public static writeCopyData(writer: ProtocolWriter, data: string | Uint8Array): ProtocolWriter {
    return writer.writeType(FrontendMessage.CopyData).writeBytes(data).end();
  }

  public static writeCopyFail(writer: ProtocolWriter, text: string): ProtocolWriter {
    return writer.writeType(FrontendMessage.CopyFail).writeString(text).end();
  }

  public static writeDescribe(writer: ProtocolWriter, target: MessageTarget, name: string): ProtocolWriter {
    return writer.writeType(FrontendMessage.Describe).writeUint8(target).writeString(name).end();
  }

  public static writeClose(writer: ProtocolWriter, target: MessageTarget, name: string): ProtocolWriter {
    return writer.writeType(FrontendMessage.Close).writeUint8(target).writeString(name).end();
  }

  public static writeExecute(writer: ProtocolWriter, portal: string, rows: number = 0): ProtocolWriter {
    return writer.writeType(FrontendMessage.Execute).writeString(portal).writeInt32(rows).end();
  }

  public static writeCancel(writer: ProtocolWriter, pid: number, secret: number): ProtocolWriter {
    return writer.beginUntyped().writeInt32(Frontend.cancelRequestCode).writeInt32(pid).writeInt32(secret).endUntyped();
  }

  public static writeStartup(writer: ProtocolWriter, parameters: ReadonlyMap<string, string>): ProtocolWriter {
    writer.beginUntyped().writeInt32(Frontend.protocolVersion);
    for (const [name, value] of parameters)
      if (value.length > 0)
        writer.writeString(Frontend.requireUnbroken(name, name)).writeString(Frontend.requireUnbroken(name, value));
    return writer.writeUint8(0).endUntyped();
  }

  public static writeSasl(writer: ProtocolWriter, mechanism: string, initial: string): ProtocolWriter {
    return writer.writeType(FrontendMessage.Password).writeString(mechanism).writeInt32(Buffer.byteLength(initial)).writeBytes(initial).end();
  }

  public static writeParse(writer: ProtocolWriter, name: string, text: string, oids: readonly number[] = []): ProtocolWriter {
    writer.writeType(FrontendMessage.Parse).writeString(name).writeString(text).writeUint16(oids.length);
    for (const oid of oids)
      writer.writeInt32(oid | 0);
    return writer.end();
  }

  public static writeBind(
    writer: ProtocolWriter, portal: string, name: string, values: readonly (string | Uint8Array | null)[] = [], formats: readonly number[] = [],
    resultFormats: readonly number[] = []): ProtocolWriter {
    writer.writeType(FrontendMessage.Bind).writeString(portal).writeString(name).writeInt16(formats.length);
    for (const format of formats)
      writer.writeInt16(format);
    writer.writeUint16(values.length);
    for (const value of values)
      writer.writeValue(value);
    writer.writeInt16(resultFormats.length);
    for (const format of resultFormats)
      writer.writeInt16(format);
    return writer.end();
  }

  public static writeRun(
    writer: ProtocolWriter, portal: string, name: string, values: readonly (string | Uint8Array | null)[], rows: number, flushing: boolean,
    formats: readonly number[] | null): ProtocolWriter {
    Frontend.writeBind(writer, portal, name, values, [], formats ?? []);
    Frontend.writeExecute(writer, portal, rows);
    return flushing ? Frontend.writeFlush(writer) : Frontend.writeSync(writer);
  }

  public createStartup(parameters: ReadonlyMap<string, string>): Buffer {
    return this.take(writer => Frontend.writeStartup(writer, parameters));
  }

  public createSslRequest(): Buffer {
    return this.take(writer => Frontend.writeSslRequest(writer));
  }

  public createPassword(text: string): Buffer {
    return this.take(writer => Frontend.writePassword(writer, text));
  }

  public createSasl(mechanism: string, initial: string): Buffer {
    return this.take(writer => Frontend.writeSasl(writer, mechanism, initial));
  }

  public createSaslResponse(text: string): Buffer {
    return this.take(writer => Frontend.writeSaslResponse(writer, text));
  }

  public createExtendedQuery(text: string, values: readonly (string | null)[]): Buffer {
    return this.take(writer => {
      Frontend.writeParse(writer, "", text);
      Frontend.writeBind(writer, "", "", values);
      Frontend.writeDescribe(writer, MessageTarget.Portal, "");
      Frontend.writeExecute(writer, "");
      Frontend.writeSync(writer);
    });
  }

  public terminate(): Buffer {
    return this.take(writer => Frontend.writeTerminate(writer));
  }

  public sync(): Buffer {
    return this.take(writer => Frontend.writeSync(writer));
  }

  public flush(): Buffer {
    return this.take(writer => Frontend.writeFlush(writer));
  }

  public copyDone(): Buffer {
    return this.take(writer => Frontend.writeCopyDone(writer));
  }

  public query(text: string): Buffer {
    return this.take(writer => Frontend.writeQuery(writer, text));
  }

  public copyData(data: string | Uint8Array): Buffer {
    return this.take(writer => Frontend.writeCopyData(writer, data));
  }

  public copyFail(text: string): Buffer {
    return this.take(writer => Frontend.writeCopyFail(writer, text));
  }

  public describe(target: MessageTarget, name: string): Buffer {
    return this.take(writer => Frontend.writeDescribe(writer, target, name));
  }

  public close(target: MessageTarget, name: string): Buffer {
    return this.take(writer => Frontend.writeClose(writer, target, name));
  }

  public execute(portal: string, rows: number = 0): Buffer {
    return this.take(writer => Frontend.writeExecute(writer, portal, rows));
  }

  public cancel(pid: number, secret: number): Buffer {
    return this.take(writer => Frontend.writeCancel(writer, pid, secret));
  }

  public parse(name: string, text: string, oids: readonly number[] = []): Buffer {
    return this.take(writer => Frontend.writeParse(writer, name, text, oids));
  }

  public bind(
    portal: string, name: string, values: readonly (string | Uint8Array | null)[] = [], formats: readonly number[] = [],
    resultFormats: readonly number[] = []): Buffer {
    return this.take(writer => Frontend.writeBind(writer, portal, name, values, formats, resultFormats));
  }

  public run(
    portal: string, name: string, values: readonly (string | Uint8Array | null)[], rows: number, flushing: boolean, formats: readonly number[] | null): Buffer {
    return this.take(writer => Frontend.writeRun(writer, portal, name, values, rows, flushing, formats));
  }

  private take(build: (writer: ProtocolWriter) => unknown): Buffer {
    try {
      build(this.writer);
    }
    catch (error) {
      this.writer.truncate(0);
      throw error;
    }

    return this.writer.take();
  }

  private static requireUnbroken(name: string, value: string): string {
    if (value.includes("\0"))
      throw new DataException(Resources.formatNulInParameter(name));

    return value;
  }
}
