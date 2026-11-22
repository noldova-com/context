/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import CommandFailedException from "./command-failed.exception.ts";

export default class TarArchive {
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";
  private static readonly TAR_BLOCK: number = 512;
  private static readonly TAR_NAME_LENGTH: number = 100;
  private static readonly TAR_MODE_OFFSET: number = 100;
  private static readonly TAR_SIZE_OFFSET: number = 124;
  private static readonly TAR_TYPE_OFFSET: number = 156;
  private static readonly TAR_LINK_OFFSET: number = 157;
  private static readonly TAR_PREFIX_OFFSET: number = 345;
  private static readonly TAR_PREFIX_LENGTH: number = 155;
  private static readonly TAR_FIELD_LENGTH: number = 12;
  private static readonly TAR_MODE_LENGTH: number = 8;
  private static readonly OCTAL: number = 8;
  private static readonly OCTAL_PATTERN: RegExp = /^[0-7]+$/u;
  private static readonly TAR_FILE_TYPES: ReadonlySet<string> = new Set(["0", "\0", "7"]);
  private static readonly TAR_DIRECTORY_TYPE: string = "5";
  private static readonly TAR_HARD_LINK_TYPE: string = "1";
  private static readonly TAR_SYMBOLIC_LINK_TYPE: string = "2";
  private static readonly TAR_LONG_NAME_TYPE: string = "L";
  private static readonly TAR_LONG_LINK_TYPE: string = "K";
  private static readonly TAR_PAX_TYPES: ReadonlySet<string> = new Set(["x", "g"]);
  private static readonly PAX_PATH_KEY: string = "path";
  private static readonly PAX_LINK_KEY: string = "linkpath";
  private static readonly PARENT_SEGMENT: string = "..";
  private static readonly LINK_SEGMENT_SEPARATOR: RegExp = /[\\/]/u;
  private static readonly MISSING_FILE_CODE: string = "ENOENT";
  private static readonly ARCHIVE_LIMIT_BYTES: number = 1024 * 1024 * 1024;

  public static async extractAsync(archive: Buffer, folder: string): Promise<void> {
    const tar = TarArchive.unzip(archive);
    const root = await fs.realpath(folder);
    let longName: string | null = null;
    let longLink: string | null = null;
    let pax = new Map<string, string>();
    let offset = 0;
    while (offset + TarArchive.TAR_BLOCK <= tar.length) {
      const header = tar.subarray(offset, offset + TarArchive.TAR_BLOCK);
      if (header.every(t => t === 0))
        return;

      const shortName = TarArchive.readText(header, 0, TarArchive.TAR_NAME_LENGTH);
      const size = TarArchive.readOctal(header, TarArchive.TAR_SIZE_OFFSET, TarArchive.TAR_FIELD_LENGTH, shortName);
      if (offset + TarArchive.TAR_BLOCK + size > tar.length)
        throw new CommandFailedException(TarArchive.archiveEndsInsideEntry(shortName));

      const type = String.fromCharCode(header[TarArchive.TAR_TYPE_OFFSET] ?? 0);
      const body = tar.subarray(offset + TarArchive.TAR_BLOCK, offset + TarArchive.TAR_BLOCK + size);
      offset += TarArchive.TAR_BLOCK + Math.ceil(size / TarArchive.TAR_BLOCK) * TarArchive.TAR_BLOCK;

      if (type === TarArchive.TAR_LONG_NAME_TYPE) {
        longName = TarArchive.readText(body, 0, body.length);
        continue;
      }
      if (type === TarArchive.TAR_LONG_LINK_TYPE) {
        longLink = TarArchive.readText(body, 0, body.length);
        continue;
      }
      if (TarArchive.TAR_PAX_TYPES.has(type)) {
        pax = TarArchive.readPax(body);
        continue;
      }

      const prefix = TarArchive.readText(header, TarArchive.TAR_PREFIX_OFFSET, TarArchive.TAR_PREFIX_LENGTH);
      const name = pax.get(TarArchive.PAX_PATH_KEY) ?? longName ?? (prefix.length > 0 ? `${prefix}/${shortName}` : shortName);
      const link = pax.get(TarArchive.PAX_LINK_KEY) ?? longLink ?? TarArchive.readText(header, TarArchive.TAR_LINK_OFFSET, TarArchive.TAR_NAME_LENGTH);
      const mode = TarArchive.readOctal(header, TarArchive.TAR_MODE_OFFSET, TarArchive.TAR_MODE_LENGTH, name);
      longName = null;
      longLink = null;
      pax = new Map();

      const destination = TarArchive.resolveInside(folder, name, name);
      if (type === TarArchive.TAR_DIRECTORY_TYPE)
        await TarArchive.makeFolderInsideAsync(root, destination, name);
      else if (type === TarArchive.TAR_SYMBOLIC_LINK_TYPE) {
        const parent = await TarArchive.makeFolderInsideAsync(root, path.dirname(destination), name);
        if (TarArchive.climbsOrStartsAtRoot(link))
          throw new CommandFailedException(TarArchive.unsafeEntry(name));

        TarArchive.resolveInside(root, path.resolve(parent, link), name);
        await fs.symlink(link, destination);
      }
      else if (type === TarArchive.TAR_HARD_LINK_TYPE) {
        await TarArchive.makeFolderInsideAsync(root, path.dirname(destination), name);
        if (TarArchive.climbsOrStartsAtRoot(link))
          throw new CommandFailedException(TarArchive.unsafeEntry(name));

        await fs.link(await TarArchive.findExtractedFileAsync(root, TarArchive.resolveInside(folder, link, name), name, link), destination);
      }
      else if (TarArchive.TAR_FILE_TYPES.has(type)) {
        await TarArchive.makeFolderInsideAsync(root, path.dirname(destination), name);
        await fs.writeFile(destination, body, { mode: mode === 0 ? 0o644 : mode });
      }
      else
        throw new CommandFailedException(TarArchive.unsupportedEntry(name, type));
    }

    if (tar.subarray(offset).some(t => t !== 0))
      throw new CommandFailedException(TarArchive.archiveEndsInsideHeader());
  }

  private static unzip(archive: Buffer): Buffer {
    try {
      return gunzipSync(archive, { maxOutputLength: TarArchive.ARCHIVE_LIMIT_BYTES });
    }
    catch (error) {
      if (error instanceof RangeError)
        throw new CommandFailedException(TarArchive.archiveTooLarge(TarArchive.ARCHIVE_LIMIT_BYTES));

      throw error;
    }
  }

  private static async makeFolderInsideAsync(root: string, folder: string, name: string): Promise<string> {
    await fs.mkdir(folder, { recursive: true });
    const real = await fs.realpath(folder);
    if (real !== root)
      TarArchive.resolveInside(root, real, name);

    return real;
  }

  private static async findExtractedFileAsync(root: string, target: string, name: string, link: string): Promise<string> {
    let real: string;
    try {
      real = await fs.realpath(target);
    }
    catch (error) {
      if (error instanceof Error && "code" in error && error.code === TarArchive.MISSING_FILE_CODE)
        throw new CommandFailedException(TarArchive.hardLinkTargetMissing(name, link));

      throw error;
    }

    TarArchive.resolveInside(root, real, name);
    if (!(await fs.lstat(real)).isFile())
      throw new CommandFailedException(TarArchive.hardLinkTargetMissing(name, link));

    return real;
  }

  private static climbsOrStartsAtRoot(link: string): boolean {
    const segments = link.split(TarArchive.LINK_SEGMENT_SEPARATOR);
    const firstName = segments.findIndex(t => t !== TarArchive.PARENT_SEGMENT);
    return path.posix.isAbsolute(link) || path.win32.isAbsolute(link) || (firstName >= 0 && segments.slice(firstName).includes(TarArchive.PARENT_SEGMENT));
  }

  private static resolveInside(folder: string, target: string, name: string): string {
    const destination = path.resolve(folder, target);
    const relative = path.relative(folder, destination);
    if (relative.length === 0 || relative.split(path.sep).includes(TarArchive.PARENT_SEGMENT) || path.isAbsolute(relative))
      throw new CommandFailedException(TarArchive.unsafeEntry(name));

    return destination;
  }

  private static readText(data: Buffer, offset: number, length: number): string {
    const field = data.subarray(offset, offset + length);
    const end = field.indexOf(0);
    return field.toString(TarArchive.TEXT_ENCODING, 0, end < 0 ? field.length : end);
  }

  private static readOctal(data: Buffer, offset: number, length: number, name: string): number {
    const text = TarArchive.readText(data, offset, length).trim();
    if (text.length === 0)
      return 0;

    if (!TarArchive.OCTAL_PATTERN.test(text))
      throw new CommandFailedException(TarArchive.numberNotOctal(name));

    return Number.parseInt(text, TarArchive.OCTAL);
  }

  private static readPax(body: Buffer): Map<string, string> {
    const records = new Map<string, string>();
    for (let offset = 0; offset < body.length;) {
      const space = body.indexOf(0x20, offset);
      if (space < 0)
        break;

      const length = Number.parseInt(body.toString(TarArchive.TEXT_ENCODING, offset, space), 10);
      if (!Number.isSafeInteger(length) || length <= 0)
        break;

      const record = body.toString(TarArchive.TEXT_ENCODING, space + 1, offset + length - 1);
      const equals = record.indexOf("=");
      if (equals > 0)
        records.set(record.slice(0, equals), record.slice(equals + 1));
      offset += length;
    }

    return records;
  }

  private static unsafeEntry(name: string): string {
    return `The archive holds the entry "${name}", which points outside its folder.`;
  }

  private static hardLinkTargetMissing(name: string, link: string): string {
    return `The archive holds the hard link "${name}", whose target "${link}" is not a file extracted before it.`;
  }

  private static unsupportedEntry(name: string, type: string): string {
    return `The archive holds the entry "${name}" of type "${type}", which the extraction does not support.`;
  }

  private static numberNotOctal(name: string): string {
    return `The archive holds the entry "${name}", whose header has a number that is not octal.`;
  }

  private static archiveEndsInsideEntry(name: string): string {
    return `The archive ends inside the entry "${name}".`;
  }

  private static archiveEndsInsideHeader(): string {
    return "The archive ends inside an entry's header.";
  }

  private static archiveTooLarge(limitBytes: number): string {
    return `The archive unpacks to more than ${limitBytes} bytes.`;
  }
}
