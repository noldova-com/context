/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

import type { IArchiveEntry } from "../interfaces/i-archive-entry.js";

export class PackageArchiveFixture {
  public static readonly MANIFEST_ENTRY_NAME: string = "package/package.json";

  private static readonly BLOCK_SIZE: number = 512;

  public static createTar(entries: readonly IArchiveEntry[], isTerminated: boolean = true): Buffer {
    const blocks: Buffer[] = [];
    for (const entry of entries) {
      const content = Buffer.from(entry.content, "utf8");
      const header = Buffer.alloc(PackageArchiveFixture.BLOCK_SIZE);
      header.write(entry.name, 0, "utf8");
      header.write(entry.size ?? `${content.length.toString(8).padStart(11, "0")}\0`, 124, "latin1");
      header.write(entry.type ?? "0", 156, "latin1");
      header.write(entry.prefix ?? "", 345, "utf8");
      blocks.push(header, content, Buffer.alloc((PackageArchiveFixture.BLOCK_SIZE - content.length % PackageArchiveFixture.BLOCK_SIZE) % PackageArchiveFixture.BLOCK_SIZE));
    }

    if (isTerminated)
      blocks.push(Buffer.alloc(PackageArchiveFixture.BLOCK_SIZE * 2));

    return Buffer.concat(blocks);
  }

  public static createArchive(entries: readonly IArchiveEntry[], isTerminated: boolean = true): Buffer {
    return gzipSync(PackageArchiveFixture.createTar(entries, isTerminated));
  }

  public static createPackageArchive(manifest: unknown): Buffer {
    return PackageArchiveFixture.createArchive([{ name: PackageArchiveFixture.MANIFEST_ENTRY_NAME, content: typeof manifest === "string" ? manifest : JSON.stringify(manifest) }]);
  }

  public static async writePackageArchiveAsync(folder: string, archiveName: string, manifest: unknown): Promise<string> {
    const filePath = join(folder, archiveName);
    await writeFile(filePath, PackageArchiveFixture.createPackageArchive(manifest));

    return filePath;
  }
}
