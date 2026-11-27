/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Dictionary, KeyValuePair, List } from "@noldova/context.collections";
import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptSourceKind } from "@noldova/context.parsers.typescript";
import type { PositionMap } from "@noldova/context.sdk/plugins/models/position-map.js";
import { SourceEdit } from "@noldova/context.sdk/plugins/models/source-edit.js";
import { SourceFile } from "@noldova/context.sdk/plugins/models/source-file.js";
import { Base64Vlq } from "@noldova/context.sdk/plugins/services/base64-vlq.js";
import { SourceMapComposer } from "@noldova/context.sdk/plugins/services/source-map-composer.js";
import { SourceRewriter } from "@noldova/context.sdk/plugins/services/source-rewriter.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { SDKProject } from "../../fixtures/sdk-project.fixture.js";

@TestClass
export class SourceMapComposerTests {
  @TestMethod
  public async pointsAMapAtTheOriginalSourcesAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    const text = "a;\nb;";
    const source = SourceFile.parse(project.path("src/a.ts"), text, TypeScriptSourceKind.Code);
    const map = SourceRewriter.rewrite(project.path("gen/a.ts"), source, new List([new SourceEdit(new SourceSpan(0, 0), "x;\n", "inserter")]));
    await project.writeAsync("build/a.js.map", JSON.stringify({ version: 3, file: "a.js", sourceRoot: "../gen", sources: ["a.ts"], names: [], mappings: "A,AAAA;AACA,ACAA" }));

    await SourceMapComposer.composeAsync(project.path("build"), new Dictionary([new KeyValuePair(map.path, map)]));

    const composed: unknown = JSON.parse(await project.readAsync("build/a.js.map"));
    Assert.areEqual(JSON.stringify({ version: 3, file: "a.js", sources: ["../src/a.ts"], names: [], mappings: "A,AAAA;AAAA,ACCA" }), JSON.stringify(composed));
    Assert.areEqual("0 1,0 0 0 0 4;0 0 0 0 4,0 1 1 0 4", Base64Vlq.decode("A,AAAA;AAAA,ACCA")
      .select(line => line.select(t => t.fieldCount === 1 ? "0 1" : [t.column, t.sourceIndex, t.line, t.character, t.fieldCount].join(" ")).toArray().join(",")).toArray().join(";"));
  }

  @TestMethod
  public async leavesAMapWithAnotherSourceAsItIsAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    const other = JSON.stringify({ version: 3, sources: ["../src/b.ts"], names: [], mappings: "AAAA" });
    const empty = JSON.stringify({ version: 3, sources: [], names: [], mappings: "" });
    await project.writeAsync("build/b.js.map", other);
    await project.writeAsync("build/c.js.map", empty);

    await SourceMapComposer.composeAsync(project.path("build"), new Dictionary<string, PositionMap>());

    Assert.areEqual(other, await project.readAsync("build/b.js.map"));
    Assert.areEqual(empty, await project.readAsync("build/c.js.map"));
  }

  @TestMethod
  public async leavesAScriptWithoutAMapOfTheSourcesAsItIsAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    const other = `b;\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify({ version: 3, sources: ["../src/b.ts"], names: [], mappings: "AAAA" })).toString("base64")}`;
    await project.writeAsync("build/b.js", other);
    await project.writeAsync("build/c.mjs", "c;\n");

    await SourceMapComposer.composeAsync(project.path("build"), new Dictionary<string, PositionMap>());

    Assert.areEqual(other, await project.readAsync("build/b.js"));
    Assert.areEqual("c;\n", await project.readAsync("build/c.mjs"));
  }
}
