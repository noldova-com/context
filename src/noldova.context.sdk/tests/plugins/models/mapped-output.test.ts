/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Dictionary, KeyValuePair, List } from "@noldova/context.collections";
import { TypeScriptSourceKind } from "@noldova/context.parsers.typescript";
import { MappedOutput } from "@noldova/context.sdk/plugins/models/mapped-output.js";
import type { PositionMap } from "@noldova/context.sdk/plugins/models/position-map.js";
import type { SourceEdit } from "@noldova/context.sdk/plugins/models/source-edit.js";
import { SourceFile } from "@noldova/context.sdk/plugins/models/source-file.js";
import { SourceRewriter } from "@noldova/context.sdk/plugins/services/source-rewriter.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RecordingOutput } from "../../fixtures/recording-output.fixture.js";
import { SDKProject } from "../../fixtures/sdk-project.fixture.js";

@TestClass
export class MappedOutputTests {
  @TestMethod
  public async writesTheOriginalPlaceOfAGeneratedFilesLineAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    const text = "first;\nsecond;";
    const map = SourceRewriter.rewrite(project.path("gen/a.ts"), SourceFile.parse(project.path("src/a.ts"), text, TypeScriptSourceKind.Code), new List<SourceEdit>());
    const output = new RecordingOutput();
    const mapped = new MappedOutput(output, project.directory, new Dictionary([new KeyValuePair(map.path, map)]));

    mapped.writeLine("gen/a.ts(2,3): error TS1005: ';' expected.");
    mapped.writeErrorLine("gen/a.ts(1,1): error TS1005: ';' expected.");

    Assert.areEqual("src/a.ts(2,3): error TS1005: ';' expected.", output.lines.join(","));
    Assert.areEqual("src/a.ts(1,1): error TS1005: ';' expected.", output.errorLines.join(","));
  }

  @TestMethod
  public writesOtherLinesAsTheyAre(): void {
    const output = new RecordingOutput();
    const mapped = new MappedOutput(output, import.meta.dirname, new Dictionary<string, PositionMap>());

    mapped.writeLine("other.ts(1,1): error TS1005: ';' expected.");
    mapped.writeErrorLine("Found 1 error.");

    Assert.areEqual("other.ts(1,1): error TS1005: ';' expected.", output.lines.join(","));
    Assert.areEqual("Found 1 error.", output.errorLines.join(","));
  }
}
