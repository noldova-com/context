/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type JsonObjectReader from "../../../../scripts/json-object.reader.ts";
import type TypeScriptVendoredSection from "./typescript-vendored-section.ts";

export default class TypeScriptVendoredSectionRecord {
  public readonly source: string;
  public readonly selection: string | undefined;
  public readonly upstreamRoots: readonly string[];
  public readonly localRoot: string;
  public readonly files: number;

  public constructor(source: string, selection: string | undefined, upstreamRoots: readonly string[], localRoot: string, files: number) {
    this.source = source;
    this.selection = selection;
    this.upstreamRoots = upstreamRoots;
    this.localRoot = localRoot;
    this.files = files;
  }

  public static of(source: string, section: TypeScriptVendoredSection, files: number): TypeScriptVendoredSectionRecord {
    return new TypeScriptVendoredSectionRecord(source, section.selection?.text, section.upstreamRoots, section.localRoot, files);
  }

  public static read(reader: JsonObjectReader): TypeScriptVendoredSectionRecord {
    return new TypeScriptVendoredSectionRecord(
      reader.string("source"), reader.optionalString("selection"), reader.strings("upstreamRoots"), reader.string("localRoot"), reader.integer("files"));
  }
}
