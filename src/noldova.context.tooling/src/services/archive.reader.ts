/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import fs from "node:fs/promises";
import zlib from "node:zlib";

import { CommandFailedException } from "../exceptions/command-failed.exception.ts";
import { Resources } from "../resources.ts";

export class ArchiveReader {
  private static readonly BLOCK_SIZE: number = 512;
  private static readonly NAME_END: number = 100;
  private static readonly SIZE_START: number = 124;
  private static readonly SIZE_END: number = 136;
  private static readonly TYPE_POSITION: number = 156;
  private static readonly PREFIX_START: number = 345;
  private static readonly PREFIX_END: number = 500;
  private static readonly SIZE_RADIX: number = 8;
  private static readonly FILE_TYPES: readonly string[] = ["0", "\0"];
  private static readonly EXTENDED_HEADER_TYPE: string = "x";
  private static readonly PATH_RECORD_PATTERN: RegExp = /^\d+ path=(.*)$/m;
  private static readonly FIELD_END_PATTERN: RegExp = /\0.*$/s;
  private static readonly HEADER_ENCODING: BufferEncoding = "latin1";
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";

  public async readFileAsync(archivePath: string, entryName: string): Promise<Buffer | undefined> {
    let tar: Buffer;
    try {
      tar = zlib.gunzipSync(await fs.readFile(archivePath));
    }
    catch (error) {
      throw new CommandFailedException(Resources.formatUnreadableArchive(archivePath), { cause: error });
    }

    let extendedName: string | undefined = undefined;
    for (let offset = 0; offset + ArchiveReader.BLOCK_SIZE <= tar.length && tar[offset] !== 0;) {
      const header = tar.subarray(offset, offset + ArchiveReader.BLOCK_SIZE);
      const size = Number.parseInt(ArchiveReader.readField(header, ArchiveReader.SIZE_START, ArchiveReader.SIZE_END).trim(), ArchiveReader.SIZE_RADIX);
      if (!Number.isInteger(size) || offset + ArchiveReader.BLOCK_SIZE + size > tar.length)
        throw new CommandFailedException(Resources.formatMalformedEntry(archivePath, offset));

      const content = tar.subarray(offset + ArchiveReader.BLOCK_SIZE, offset + ArchiveReader.BLOCK_SIZE + size);
      const type = header.toString(ArchiveReader.HEADER_ENCODING, ArchiveReader.TYPE_POSITION, ArchiveReader.TYPE_POSITION + 1);
      if (type === ArchiveReader.EXTENDED_HEADER_TYPE)
        extendedName = ArchiveReader.PATH_RECORD_PATTERN.exec(content.toString(ArchiveReader.TEXT_ENCODING))?.[1];
      else {
        if (ArchiveReader.FILE_TYPES.includes(type) && (extendedName ?? ArchiveReader.readName(header)) === entryName)
          return Buffer.from(content);

        extendedName = undefined;
      }

      offset += ArchiveReader.BLOCK_SIZE * (1 + Math.ceil(size / ArchiveReader.BLOCK_SIZE));
    }

    return undefined;
  }

  private static readName(header: Buffer): string {
    const name = ArchiveReader.readField(header, 0, ArchiveReader.NAME_END);
    const prefix = ArchiveReader.readField(header, ArchiveReader.PREFIX_START, ArchiveReader.PREFIX_END);

    return prefix.length > 0 ? `${prefix}/${name}` : name;
  }

  private static readField(header: Buffer, start: number, end: number): string {
    return header.toString(ArchiveReader.TEXT_ENCODING, start, end).replace(ArchiveReader.FIELD_END_PATTERN, "");
  }
}
