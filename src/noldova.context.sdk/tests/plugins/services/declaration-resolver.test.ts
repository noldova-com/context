/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { List } from "@noldova/context.collections";
import { SDKException } from "@noldova/context.sdk";
import type { Plugin } from "@noldova/context.sdk/plugins/models/plugin.js";
import { PluginBuilder } from "@noldova/context.sdk/plugins/services/plugin-builder.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RecordingOutput } from "../../fixtures/recording-output.fixture.js";
import { SDKProject } from "../../fixtures/sdk-project.fixture.js";
import { TestPlugin } from "../../fixtures/test-plugin.fixture.js";

@TestClass
export class DeclarationResolverTests {
  private static readonly source: string = [
    "import { Local as Renamed, Nonexistent } from \"./local.js\";",
    "import { Reexported, Star, Chained, Missing } from \"./barrel.js\";",
    "import { Declared } from \"./declared.js\";",
    "import { Typed, TypedToo } from \"typed\";",
    "import { Sub } from \"typed/sub.js\";",
    "import { Scoped } from \"@scope/package\";",
    "import { Untyped } from \"untyped\";",
    "import { Unknown } from \"unknown\";",
    "import { Nowhere } from \"./nowhere.js\";",
    "import Default from \"./local.js\";",
    "import * as Namespace from \"./local.js\";",
    "import \"./local.js\";",
    "export class Here {}",
    "export const first: number = 1, second: number = 2;",
    "export interface Shape {}",
    "export function make(): void {}",
    "export enum Kind { A }",
    "export type Alias = string;",
    "export default class {}"
  ].join("\n");

  @TestMethod
  @TestData("Here", "src/index.ts Here TypeScriptClassDeclarationNode")
  @TestData("second", "src/index.ts second TypeScriptVariableDeclarationNode")
  @TestData("Shape", "src/index.ts Shape TypeScriptInterfaceDeclarationNode")
  @TestData("make", "src/index.ts make TypeScriptFunctionDeclarationNode")
  @TestData("Kind", "src/index.ts Kind TypeScriptEnumDeclarationNode")
  @TestData("Alias", "src/index.ts Alias TypeScriptTypeAliasDeclarationNode")
  @TestData("Renamed", "src/local.ts Local TypeScriptClassDeclarationNode")
  @TestData("Reexported", "src/reexported.ts Reexported TypeScriptClassDeclarationNode")
  @TestData("Star", "src/star.ts Star TypeScriptClassDeclarationNode")
  @TestData("Chained", "src/inner.ts Inner TypeScriptClassDeclarationNode")
  @TestData("Declared", "src/declared.d.ts Declared TypeScriptClassDeclarationNode")
  @TestData("Typed", "node_modules/typed/index.d.ts Typed TypeScriptClassDeclarationNode")
  @TestData("TypedToo", "node_modules/typed/index.d.ts TypedToo TypeScriptClassDeclarationNode")
  @TestData("Sub", "node_modules/typed/sub.d.ts Sub TypeScriptClassDeclarationNode")
  @TestData("Scoped", "node_modules/@scope/package/index.d.ts Scoped TypeScriptVariableDeclarationNode")
  @TestData("Missing", "undefined")
  @TestData("Nonexistent", "undefined")
  @TestData("Untyped", "undefined")
  @TestData("Unknown", "undefined")
  @TestData("Nowhere", "undefined")
  @TestData("Default", "undefined")
  @TestData("Namespace", "undefined")
  @TestData("NotImported", "undefined")
  public async resolvesTheDeclarationANameStandsForAsync(name: string, expected: string): Promise<void> {
    await using project = await SDKProject.createAsync(DeclarationResolverTests.source);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { packages: [TestPlugin.packageIdentity] } });
    await project.writeAsync("src/local.ts", "export class Local {}");
    await project.writeAsync("src/barrel.ts", [
      "export { Reexported } from \"./reexported.js\";",
      "export * from \"./star.js\";",
      "export * as names from \"./star.js\";",
      "export { Inner as Chained };",
      "import { Inner } from \"./inner.js\";"
    ].join("\n"));
    await project.writeAsync("src/star.ts", "export * from \"./barrel.js\";\nexport class Star {}");
    await project.writeAsync("src/reexported.ts", "export class Reexported {}");
    await project.writeAsync("src/inner.ts", "export class Inner {}");
    await project.writeAsync("src/declared.d.ts", "export declare class Declared {}");
    await project.writeAsync("node_modules/typed/package.json", JSON.stringify({ name: "typed", types: "index.d.ts" }));
    await project.writeAsync("node_modules/typed/index.d.ts", "export declare class Typed {}\nexport declare class TypedToo {}");
    await project.writeAsync("node_modules/typed/sub.d.ts", "export declare class Sub {}");
    await project.writeAsync("node_modules/@scope/package/package.json", JSON.stringify({ name: "@scope/package", types: "index.d.ts" }));
    await project.writeAsync("node_modules/@scope/package/index.d.ts", "export declare const Scoped: number;");
    await project.writeAsync("node_modules/untyped/package.json", JSON.stringify({ name: "untyped" }));
    const found: string[] = [];
    const plugin = new TestPlugin("resolver", context => {
      const source = context.sources.firstOrDefault(t => t.path === project.path("src/index.ts"));
      for (const other of ["Typed", name].map(t => Object.isUndefined(source) ? undefined : context.resolve(source, t)))
        found.push(Object.isUndefined(other)
          ? "undefined"
          : `${other.source.path.substring(project.directory.length + 1).replaceAll("\\", "/")} ${other.name} ${other.node.constructor.name}`);
      throw new Error("resolved");
    });

    await Assert.throwsAsync(async () => PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([plugin]), [], new RecordingOutput()), SDKException);

    Assert.areEqual(expected, found.at(-1));
  }
}
