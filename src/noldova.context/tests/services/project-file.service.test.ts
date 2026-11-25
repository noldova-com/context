/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import "@noldova/context.core";
import { ProjectFileException } from "@noldova/context";
import { ProjectFileService } from "@noldova/context/services/project-file.service.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ProjectFolder } from "../fixtures/project-folder.fixture.js";

@TestClass
export class ProjectFileServiceTests {
  @TestMethod
  public refusesAProjectFileThatCannotBeReadAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      const manifestPath = folder.path("missing.ctxp");

      const exception = await Assert.throwsAsync(() => ProjectFileService.readAsync(manifestPath, folder.directory), ProjectFileException);

      Assert.isTrue(exception.message.startsWith(`The project file "${manifestPath}" can't be read: ENOENT`), exception.message);
    });
  }
}
