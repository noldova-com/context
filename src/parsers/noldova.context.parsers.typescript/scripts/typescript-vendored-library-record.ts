/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type JsonObjectReader from "../../../../scripts/json-object.reader.ts";

export default class TypeScriptVendoredLibraryRecord {
  public readonly source: string;
  public readonly sourcePackagePattern: string;
  public readonly sourcePackageVersion: string;
  public readonly upstreamRoot: string;
  public readonly selection: string;
  public readonly localRoot: string;
  public readonly files: number;

  public constructor(
    source: string,
    sourcePackagePattern: string,
    sourcePackageVersion: string,
    upstreamRoot: string,
    selection: string,
    localRoot: string,
    files: number) {
    this.source = source;
    this.sourcePackagePattern = sourcePackagePattern;
    this.sourcePackageVersion = sourcePackageVersion;
    this.upstreamRoot = upstreamRoot;
    this.selection = selection;
    this.localRoot = localRoot;
    this.files = files;
  }

  public static read(reader: JsonObjectReader): TypeScriptVendoredLibraryRecord {
    return new TypeScriptVendoredLibraryRecord(
      reader.string("source"),
      reader.string("sourcePackagePattern"),
      reader.string("sourcePackageVersion"),
      reader.string("upstreamRoot"),
      reader.string("selection"),
      reader.string("localRoot"),
      reader.integer("files"));
  }
}
