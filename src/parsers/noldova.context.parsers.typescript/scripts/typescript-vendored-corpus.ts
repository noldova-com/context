/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonReader } from "@noldova/context.json";

import TypeScriptVendoredSuite from "./typescript-vendored-suite.ts";

export default class TypeScriptVendoredCorpus {
  public readonly native: TypeScriptVendoredSuite;
  public readonly classic: TypeScriptVendoredSuite;

  public constructor(native: TypeScriptVendoredSuite, classic: TypeScriptVendoredSuite) {
    this.native = native;
    this.classic = classic;
  }

  public static read(reader: JsonReader): TypeScriptVendoredCorpus {
    return new TypeScriptVendoredCorpus(TypeScriptVendoredSuite.read(reader.readObject("native")), TypeScriptVendoredSuite.read(reader.readObject("classic")));
  }
}
