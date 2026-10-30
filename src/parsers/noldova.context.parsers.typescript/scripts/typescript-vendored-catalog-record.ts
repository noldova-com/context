/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type JsonObjectReader from "../../../../scripts/json-object.reader.ts";
import type TypeScriptVendoredCatalog from "./typescript-vendored-catalog.ts";
import type TypeScriptVendoredFile from "./typescript-vendored-file.ts";

export default class TypeScriptVendoredCatalogRecord {
  public readonly source: string;
  public readonly upstreamPath: string;
  public readonly localPath: string;
  public readonly entries: number;
  public readonly sha256: string;

  public constructor(source: string, upstreamPath: string, localPath: string, entries: number, sha256: string) {
    this.source = source;
    this.upstreamPath = upstreamPath;
    this.localPath = localPath;
    this.entries = entries;
    this.sha256 = sha256;
  }

  public static of(source: string, file: TypeScriptVendoredFile, catalog: TypeScriptVendoredCatalog): TypeScriptVendoredCatalogRecord {
    return new TypeScriptVendoredCatalogRecord(source, file.upstreamPath, file.localPath, catalog.entries, catalog.sha256);
  }

  public static read(reader: JsonObjectReader): TypeScriptVendoredCatalogRecord {
    return new TypeScriptVendoredCatalogRecord(
      reader.string("source"), reader.string("upstreamPath"), reader.string("localPath"), reader.integer("entries"), reader.string("sha256"));
  }
}
