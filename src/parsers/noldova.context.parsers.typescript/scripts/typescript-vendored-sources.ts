/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonReader } from "@noldova/context.json";

import TypeScriptVendoredSource from "./typescript-vendored-source.ts";

export default class TypeScriptVendoredSources {
  public readonly typescriptGo: TypeScriptVendoredSource;
  public readonly typescript: TypeScriptVendoredSource;

  public constructor(typescriptGo: TypeScriptVendoredSource, typescript: TypeScriptVendoredSource) {
    this.typescriptGo = typescriptGo;
    this.typescript = typescript;
  }

  public static read(reader: JsonReader): TypeScriptVendoredSources {
    return new TypeScriptVendoredSources(TypeScriptVendoredSource.read(reader.readObject("typescriptGo")), TypeScriptVendoredSource.read(reader.readObject("typescript")));
  }
}
