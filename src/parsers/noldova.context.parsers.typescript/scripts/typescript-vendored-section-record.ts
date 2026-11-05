/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonReader } from "@noldova/context.json";

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

  public static read(reader: JsonReader): TypeScriptVendoredSectionRecord {
    return new TypeScriptVendoredSectionRecord(
      reader.readString("source"), reader.readOptionalString("selection"), reader.readStringArray("upstreamRoots"), reader.readString("localRoot"), reader.readInteger("files"));
  }
}
