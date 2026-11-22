/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TarEntry } from "./tar-entry.fixture.js";

export class ExtractionCase {
  public readonly key: string;
  public readonly archive: Buffer;
  public readonly linkPath: string | undefined;
  public readonly linkTarget: string | undefined;
  public readonly outsideFileName: string | undefined;

  private constructor(key: string, archive: Buffer, linkPath: string | undefined, linkTarget: string | undefined, outsideFileName: string | undefined) {
    this.key = key;
    this.archive = archive;
    this.linkPath = linkPath;
    this.linkTarget = linkTarget;
    this.outsideFileName = outsideFileName;
  }

  public static of(key: string, entries: readonly TarEntry[]): ExtractionCase {
    return new ExtractionCase(key, TarEntry.archive(entries), undefined, undefined, undefined);
  }

  public static ofArchive(key: string, archive: Buffer): ExtractionCase {
    return new ExtractionCase(key, archive, undefined, undefined, undefined);
  }

  public static withFolderLink(key: string, entries: readonly TarEntry[], linkPath: string, linkTarget: string, outsideFileName?: string): ExtractionCase {
    return new ExtractionCase(key, TarEntry.archive(entries), linkPath, linkTarget, outsideFileName);
  }
}
