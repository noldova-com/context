/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { TestProject } from "@noldova/context.testing";

export class FixtureTestProject {
  private static readonly PACKAGE_NAME: string = "FixturePackage";
  private static readonly DIRECTORY_PREFIX: string = "project-";

  public readonly testProject: TestProject;

  private constructor(testProject: TestProject) {
    this.testProject = testProject;
  }

  public static async createAsync(fixtureNames: readonly string[]): Promise<FixtureTestProject> {
    const rootDirectory = await mkdtemp(join(tmpdir(), FixtureTestProject.DIRECTORY_PREFIX));
    for (const fixtureName of fixtureNames)
      await FixtureTestProject.writeTestFileAsync(rootDirectory, `${fixtureName}.test.js`, fixtureName);

    return new FixtureTestProject(new TestProject(FixtureTestProject.PACKAGE_NAME, rootDirectory));
  }

  public static async writeTestFileAsync(rootDirectory: string, fileName: string, fixtureName: string, search: string = String.empty): Promise<void> {
    await writeFile(join(rootDirectory, fileName), `export * from "${FixtureTestProject.workerUrl(fixtureName).href}${search}";\n`);
  }

  public static workerUrl(fixtureName: string): URL {
    return new URL(`./${fixtureName}.fixture.js`, import.meta.url);
  }

  public async removeAsync(): Promise<void> {
    await rm(this.testProject.rootDirectory, { recursive: true, force: true });
  }
}
