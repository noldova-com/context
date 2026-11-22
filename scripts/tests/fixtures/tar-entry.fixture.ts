/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { gzipSync } from "node:zlib";

export class TarEntry {
  private static readonly BLOCK: number = 512;
  private static readonly CHECKSUM_LENGTH: number = 8;
  private static readonly CHECKSUM_OFFSET: number = 148;
  private static readonly DIRECTORY_TYPE: string = "5";
  private static readonly END_BLOCKS: number = 2;
  private static readonly FILE_TYPE: string = "0";
  private static readonly HARD_LINK_TYPE: string = "1";
  private static readonly LINK_OFFSET: number = 157;
  private static readonly MAGIC: string = "ustar\u000000";
  private static readonly MAGIC_OFFSET: number = 257;
  private static readonly MODE: string = "0000755";
  private static readonly MODE_OFFSET: number = 100;
  private static readonly NAME_LENGTH: number = 100;
  private static readonly OCTAL: number = 8;
  private static readonly SIZE_LENGTH: number = 11;
  private static readonly SIZE_OFFSET: number = 124;
  private static readonly SPACE: number = 0x20;
  private static readonly SYMBOLIC_LINK_TYPE: string = "2";
  private static readonly TYPE_OFFSET: number = 156;

  public readonly name: string;
  public readonly type: string;
  public readonly body: Buffer;
  public readonly link: string;
  public readonly sizeField: string;

  private constructor(name: string, type: string, body: Buffer, link: string, sizeField: string = body.length.toString(TarEntry.OCTAL).padStart(TarEntry.SIZE_LENGTH, "0")) {
    this.name = name;
    this.type = type;
    this.body = body;
    this.link = link;
    this.sizeField = sizeField;
  }

  public static folder(name: string): TarEntry {
    return new TarEntry(name, TarEntry.DIRECTORY_TYPE, Buffer.alloc(0), "");
  }

  public static file(name: string, text: string): TarEntry {
    return new TarEntry(name, TarEntry.FILE_TYPE, Buffer.from(text), "");
  }

  public static symbolicLink(name: string, target: string): TarEntry {
    return new TarEntry(name, TarEntry.SYMBOLIC_LINK_TYPE, Buffer.alloc(0), target);
  }

  public static hardLink(name: string, target: string): TarEntry {
    return new TarEntry(name, TarEntry.HARD_LINK_TYPE, Buffer.alloc(0), target);
  }

  public static ofType(name: string, type: string): TarEntry {
    return new TarEntry(name, type, Buffer.alloc(0), "");
  }

  public static withSizeField(name: string, sizeField: string): TarEntry {
    return new TarEntry(name, TarEntry.FILE_TYPE, Buffer.alloc(0), "", sizeField);
  }

  public static archive(entries: readonly TarEntry[]): Buffer {
    return gzipSync(Buffer.concat([...entries.map(t => t.toBlocks()), Buffer.alloc(TarEntry.END_BLOCKS * TarEntry.BLOCK)]));
  }

  private toBlocks(): Buffer {
    const header = Buffer.alloc(TarEntry.BLOCK);
    header.write(this.name, 0, TarEntry.NAME_LENGTH);
    header.write(TarEntry.MODE, TarEntry.MODE_OFFSET);
    header.write(this.sizeField, TarEntry.SIZE_OFFSET);
    header.write(this.type, TarEntry.TYPE_OFFSET);
    header.write(this.link, TarEntry.LINK_OFFSET, TarEntry.NAME_LENGTH);
    header.write(TarEntry.MAGIC, TarEntry.MAGIC_OFFSET);
    header.fill(TarEntry.SPACE, TarEntry.CHECKSUM_OFFSET, TarEntry.CHECKSUM_OFFSET + TarEntry.CHECKSUM_LENGTH);
    const checksum = header.reduce((total, t) => total + t, 0);
    header.write(`${checksum.toString(TarEntry.OCTAL).padStart(TarEntry.CHECKSUM_LENGTH - 2, "0")}\0 `, TarEntry.CHECKSUM_OFFSET);

    const padding = Buffer.alloc((TarEntry.BLOCK - this.body.length % TarEntry.BLOCK) % TarEntry.BLOCK);
    return Buffer.concat([header, this.body, padding]);
  }
}
