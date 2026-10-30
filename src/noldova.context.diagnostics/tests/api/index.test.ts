/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import * as api from "@noldova/context.diagnostics";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DiagnosticsApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    const exportNames = [
      "Diagnostic", "DiagnosticAuthority", "DiagnosticCategory", "DiagnosticCode",
      "DiagnosticLocation", "DiagnosticMessage",
      "DiagnosticRelatedInformation", "DiagnosticTag",
      "DiagnosticTemplate",
    ];

    Assert.areEqual(exportNames.sort().join(","), Object.keys(api).sort().join(","));
  }

  @TestMethod
  public async exposesDependencyAugmentationsInAnIsolatedConsumerAsync(): Promise<void> {
    const directory = await mkdtemp(resolve(import.meta.dirname, "../../../consumer-"));
    try {
      const consumerPath = join(directory, "consumer.ts");
      await writeFile(consumerPath, `
        import "@noldova/context.diagnostics";

        const empty: string = String.empty;
        const formatted: string = String.format("{0}", "value");
        const isUndefined: boolean = Object.isUndefined(undefined);
        if (empty !== "" || formatted !== "value" || !isUndefined)
          throw new Error("Core augmentations were not loaded.");
      `);
      const configurationPath = join(directory, "tsconfig.json");
      await writeFile(configurationPath, JSON.stringify({
        extends: resolve(import.meta.dirname, "../../../../tsconfig-base.json"),
        compilerOptions: { noEmit: true, types: [] },
        files: ["consumer.ts"],
        include: []
      }));

      const compilerPath = fileURLToPath(new URL("./bin/tsc", import.meta.resolve("typescript/package.json")));
      await promisify(execFile)(process.execPath, [compilerPath, "--project", configurationPath], { windowsHide: true });
      await promisify(execFile)(process.execPath, [consumerPath], { windowsHide: true });
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
