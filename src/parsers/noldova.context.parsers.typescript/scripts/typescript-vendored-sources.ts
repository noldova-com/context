/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type JsonObjectReader from "../../../../scripts/json-object.reader.ts";
import TypeScriptVendoredSource from "./typescript-vendored-source.ts";

export default class TypeScriptVendoredSources {
  public readonly typescriptGo: TypeScriptVendoredSource;
  public readonly typescript: TypeScriptVendoredSource;

  public constructor(typescriptGo: TypeScriptVendoredSource, typescript: TypeScriptVendoredSource) {
    this.typescriptGo = typescriptGo;
    this.typescript = typescript;
  }

  public static read(reader: JsonObjectReader): TypeScriptVendoredSources {
    return new TypeScriptVendoredSources(TypeScriptVendoredSource.read(reader.object("typescriptGo")), TypeScriptVendoredSource.read(reader.object("typescript")));
  }
}
