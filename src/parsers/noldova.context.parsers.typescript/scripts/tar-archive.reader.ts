/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createReadStream } from "node:fs";
import { createGunzip } from "node:zlib";

export default class TarArchiveReader {
  private static readonly BLOCK_SIZE: number = 512;
  private static readonly NAME_OFFSET: number = 0;
  private static readonly NAME_LENGTH: number = 100;
  private static readonly SIZE_OFFSET: number = 124;
  private static readonly SIZE_LENGTH: number = 12;
  private static readonly TYPE_OFFSET: number = 156;
  private static readonly MAGIC_OFFSET: number = 257;
  private static readonly MAGIC: string = "ustar";
  private static readonly PREFIX_OFFSET: number = 345;
  private static readonly PREFIX_LENGTH: number = 155;
  private static readonly OCTAL_RADIX: number = 8;
  private static readonly OCTAL_DIGITS_PATTERN: RegExp = /^[0-7]+$/u;
  private static readonly DECIMAL_RADIX: number = 10;
  private static readonly DECIMAL_DIGITS_PATTERN: RegExp = /^[0-9]+$/u;
  private static readonly REGULAR_FILE_TYPES: string = "0\u00007";
  private static readonly DIRECTORY_TYPE: string = "5";
  private static readonly PAX_ENTRY_TYPE: string = "x";
  private static readonly PAX_GLOBAL_TYPE: string = "g";
  private static readonly GNU_LONG_NAME_TYPE: string = "L";
  private static readonly PAX_PATH_KEY: string = "path";
  private static readonly PAX_LENGTH_END: number = 0x20;
  private static readonly PAX_RECORD_END: number = 0x0A;
  private static readonly PAX_ASSIGNMENT: string = "=";
  private static readonly SEPARATOR: string = "/";
  private static readonly NUL: string = "\u0000";
  private static readonly ERROR_EVENT: string = "error";
  private static readonly TRUNCATED: string = "The archive ended inside an entry.";

  private readonly chunks: AsyncIterator<Buffer>;
  private buffered: Buffer = Buffer.alloc(0);

  private constructor(chunks: AsyncIterator<Buffer>) {
    this.chunks = chunks;
  }

  public static async readAsync(archivePath: string, destinationOf: (entryPath: string) => string | undefined,
    write: (destination: string, content: Buffer) => Promise<void>): Promise<void> {
    const file = createReadStream(archivePath);
    const decompressed = createGunzip();
    file.on(TarArchiveReader.ERROR_EVENT, t => decompressed.destroy(t));
    const chunks = file.pipe(decompressed)[Symbol.asyncIterator]();
    try {
      await new TarArchiveReader(chunks).readEntriesAsync(destinationOf, write);
    }
    finally {
      await chunks.return?.();
      file.destroy();
    }
  }

  private async readEntriesAsync(destinationOf: (entryPath: string) => string | undefined,
    write: (destination: string, content: Buffer) => Promise<void>): Promise<void> {
    let extendedName: string | undefined;
    while (true) {
      const header = await this.takeAsync(TarArchiveReader.BLOCK_SIZE);
      if (header.every(t => t === 0)) {
        while ((await this.chunks.next()).done !== true);
        return;
      }

      const size = TarArchiveReader.readSize(header);
      const storedSize = Math.ceil(size / TarArchiveReader.BLOCK_SIZE) * TarArchiveReader.BLOCK_SIZE;
      const type = String.fromCharCode(header[TarArchiveReader.TYPE_OFFSET]!);
      if (type === TarArchiveReader.PAX_ENTRY_TYPE || type === TarArchiveReader.GNU_LONG_NAME_TYPE) {
        const data = (await this.takeAsync(storedSize)).subarray(0, size);
        extendedName = type === TarArchiveReader.PAX_ENTRY_TYPE ? TarArchiveReader.readPaxPath(data) ?? extendedName : TarArchiveReader.readText(data);
        continue;
      }
      if (type === TarArchiveReader.PAX_GLOBAL_TYPE) {
        await this.skipAsync(storedSize);
        continue;
      }

      const entryPath = extendedName ?? TarArchiveReader.readName(header);
      extendedName = undefined;
      const destination = type === TarArchiveReader.DIRECTORY_TYPE ? undefined : destinationOf(entryPath);
      if (destination === undefined) {
        await this.skipAsync(storedSize);
        continue;
      }
      if (!TarArchiveReader.REGULAR_FILE_TYPES.includes(type))
        throw new Error(TarArchiveReader.notARegularFile(entryPath, type));
      await write(destination, (await this.takeAsync(storedSize)).subarray(0, size));
    }
  }

  private async takeAsync(length: number): Promise<Buffer> {
    const parts: Buffer[] = [this.buffered];
    let available = this.buffered.length;
    while (available < length) {
      const next = await this.chunks.next();
      if (next.done === true)
        throw new Error(TarArchiveReader.TRUNCATED);
      parts.push(next.value);
      available += next.value.length;
    }

    const joined = parts.length === 1 ? this.buffered : Buffer.concat(parts, available);
    this.buffered = joined.subarray(length);
    return joined.subarray(0, length);
  }

  private async skipAsync(length: number): Promise<void> {
    let remaining = length;
    while (remaining > this.buffered.length) {
      remaining -= this.buffered.length;
      const next = await this.chunks.next();
      if (next.done === true)
        throw new Error(TarArchiveReader.TRUNCATED);
      this.buffered = next.value;
    }
    this.buffered = this.buffered.subarray(remaining);
  }

  private static readSize(header: Buffer): number {
    const text = TarArchiveReader.readText(header.subarray(TarArchiveReader.SIZE_OFFSET, TarArchiveReader.SIZE_OFFSET + TarArchiveReader.SIZE_LENGTH)).trim();
    if (text.length === 0)
      return 0;

    const size = Number.parseInt(text, TarArchiveReader.OCTAL_RADIX);
    if (!TarArchiveReader.OCTAL_DIGITS_PATTERN.test(text) || !Number.isSafeInteger(size))
      throw new Error(TarArchiveReader.unreadableSize(text));
    return size;
  }

  private static readName(header: Buffer): string {
    const name = TarArchiveReader.readText(header.subarray(TarArchiveReader.NAME_OFFSET, TarArchiveReader.NAME_OFFSET + TarArchiveReader.NAME_LENGTH));
    const magic = header.subarray(TarArchiveReader.MAGIC_OFFSET, TarArchiveReader.MAGIC_OFFSET + TarArchiveReader.MAGIC.length).toString();
    const prefix = magic === TarArchiveReader.MAGIC
      ? TarArchiveReader.readText(header.subarray(TarArchiveReader.PREFIX_OFFSET, TarArchiveReader.PREFIX_OFFSET + TarArchiveReader.PREFIX_LENGTH))
      : "";
    return prefix.length === 0 ? name : `${prefix}${TarArchiveReader.SEPARATOR}${name}`;
  }

  private static readText(field: Buffer): string {
    const text = field.toString();
    const end = text.indexOf(TarArchiveReader.NUL);
    return end < 0 ? text : text.slice(0, end);
  }

  private static readPaxPath(data: Buffer): string | undefined {
    let path: string | undefined;
    let offset = 0;
    while (offset < data.length) {
      const space = data.indexOf(TarArchiveReader.PAX_LENGTH_END, offset);
      const lengthText = space < 0 ? "" : data.subarray(offset, space).toString();
      const length = Number.parseInt(lengthText, TarArchiveReader.DECIMAL_RADIX);
      if (!TarArchiveReader.DECIMAL_DIGITS_PATTERN.test(lengthText) || !Number.isSafeInteger(length) || length <= space - offset + 1
        || offset + length > data.length || data[offset + length - 1] !== TarArchiveReader.PAX_RECORD_END)
        throw new Error(TarArchiveReader.unreadablePaxRecord(offset));
      const record = data.subarray(space + 1, offset + length - 1).toString();
      const equals = record.indexOf(TarArchiveReader.PAX_ASSIGNMENT);
      if (equals < 0)
        throw new Error(TarArchiveReader.unreadablePaxRecord(offset));
      if (record.slice(0, equals) === TarArchiveReader.PAX_PATH_KEY)
        path = record.slice(equals + 1);
      offset += length;
    }
    return path;
  }

  private static notARegularFile(entryPath: string, type: string): string {
    return `"${entryPath}" is selected but is an entry of type "${type}", not a regular file.`;
  }

  private static unreadableSize(text: string): string {
    return `An archive entry declares the unreadable size "${text}".`;
  }

  private static unreadablePaxRecord(offset: number): string {
    return `An archive's extended header holds an unreadable record at byte ${offset}.`;
  }
}
