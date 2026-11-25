/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { Project, ProjectFileException, ProjectKind } from "@noldova/context";
import { JsonException } from "@noldova/context.json";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ProjectTests {
  private static readonly PATH: string = "/app/app.ctxp";
  private static readonly DIRECTORY: string = "/app";

  @TestMethod
  public readsALibraryWithTheDefaultSdkAndNoTools(): void {
    const project = ProjectTests.parse({ name: "noldova.context.lib", kind: "library", entry: { source: "ignored.ts" } });

    Assert.areEqual("noldova.context.lib", project.name);
    Assert.areEqual(ProjectKind.Library, project.kind);
    Assert.areEqual("noldova.context.sdk", project.sdk);
    Assert.areEqual(0, project.tools.length);
    Assert.areEqual("noldova.context.sdk", project.providers.join(","));
    Assert.isUndefined(project.entryPoint);
    Assert.areEqual(ProjectTests.PATH, project.manifestPath);
    Assert.areEqual(ProjectTests.DIRECTORY, project.directory);
  }

  @TestMethod
  public readsAnAppWithItsSdkToolsAndDefaultEntry(): void {
    const project = ProjectTests.parse({ name: "noldova.context.app", kind: "executable", sdk: "noldova.context.web.sdk", tools: ["noldova.context.data.sql", "noldova.context.lint"] });

    Assert.areEqual(ProjectKind.Executable, project.kind);
    Assert.areEqual("noldova.context.web.sdk,noldova.context.data.sql,noldova.context.lint", project.providers.join(","));
    Assert.areEqual("main.ts", project.entryPoint?.source);
    Assert.isUndefined(project.entryPoint?.className);
  }

  @TestMethod
  public readsTheEntrysSourceAndClass(): void {
    const entryPoint = ProjectTests.parse({ name: "noldova.context.app", kind: "executable", entry: { source: "app/server.ts", class: "Server" } }).entryPoint;

    Assert.areEqual("app/server.ts", entryPoint?.source);
    Assert.areEqual("Server", entryPoint?.className);
  }

  @TestMethod
  public readsAnEntryWithOnlyItsClass(): void {
    const entryPoint = ProjectTests.parse({ name: "noldova.context.app", kind: "executable", entry: { class: "Server" } }).entryPoint;

    Assert.areEqual("main.ts", entryPoint?.source);
    Assert.areEqual("Server", entryPoint?.className);
  }

  @TestMethod
  public refusesTextThatIsNotJson(): void {
    const exception = Assert.throws(() => Project.parse("{", ProjectTests.PATH, ProjectTests.DIRECTORY), ProjectFileException);

    Assert.areEqual(ProjectTests.PATH, exception.path);
    Assert.isTrue(exception.message.startsWith(`The project file "${ProjectTests.PATH}" is invalid: `), exception.message);
    Assert.isInstanceOf(exception.cause, JsonException);
  }

  @TestMethod
  public refusesAProjectWithoutAName(): void {
    ProjectTests.assertRefused({ kind: "library" }, undefined);
  }

  @TestMethod
  public refusesAnUnknownKind(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "service" }, "\"kind\" is \"service\", not \"library\" or \"executable\".");
  }

  @TestMethod
  public refusesAnSdkThatIsNotAnIdentity(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "library", sdk: "Noldova.Context.Sdk" },
      "\"sdk\" names \"Noldova.Context.Sdk\", which is not a package identity such as noldova.context.sdk.");
  }

  @TestMethod
  public refusesAToolThatIsNotAnIdentity(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "library", tools: ["lint"] },
      "\"tools\" names \"lint\", which is not a package identity such as noldova.context.sdk.");
  }

  @TestMethod
  public refusesTheHostAsATool(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "library", tools: ["noldova.context"] },
      "\"tools\" names \"noldova.context\", which is not a package identity such as noldova.context.sdk.");
  }

  @TestMethod
  public refusesARepeatedTool(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "library", tools: ["noldova.context.lint", "noldova.context.lint"] },
      "\"tools\" names \"noldova.context.lint\" more than once, or names the SDK.");
  }

  @TestMethod
  public refusesTheSdkAsATool(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "library", tools: ["noldova.context.sdk"] },
      "\"tools\" names \"noldova.context.sdk\" more than once, or names the SDK.");
  }

  @TestMethod
  public refusesToolsThatAreNotAList(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "library", tools: "noldova.context.lint" }, undefined);
  }

  @TestMethod
  public refusesAnEntrySourceThatIsNotTypeScript(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "executable", entry: { source: "main.js" } },
      "\"entry.source\" is \"main.js\", not a TypeScript source such as main.ts.");
  }

  @TestMethod
  public refusesAnEntrySourceWithoutAName(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "executable", entry: { source: ".ts" } },
      "\"entry.source\" is \".ts\", not a TypeScript source such as main.ts.");
  }

  @TestMethod
  public readsAnEntrySourceInASubfolder(): void {
    Assert.areEqual("app/..main.ts", ProjectTests.parse({ name: "noldova.context.app", kind: "executable", entry: { source: "app/..main.ts" } }).entryPoint?.source);
  }

  @TestMethod
  public refusesAnEntrySourceInAParentFolder(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "executable", entry: { source: "../other/main.ts" } },
      "\"entry.source\" is \"../other/main.ts\", which is outside the project file's folder.");
  }

  @TestMethod
  public refusesAnEntrySourceThatLeavesThroughASubfolder(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "executable", entry: { source: "app\\..\\..\\main.ts" } },
      "\"entry.source\" is \"app\\..\\..\\main.ts\", which is outside the project file's folder.");
  }

  @TestMethod
  public refusesAnAbsoluteEntrySource(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "executable", entry: { source: "/app/main.ts" } },
      "\"entry.source\" is \"/app/main.ts\", which is outside the project file's folder.");
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "executable", entry: { source: "C:main.ts" } },
      "\"entry.source\" is \"C:main.ts\", which is outside the project file's folder.");
  }

  @TestMethod
  public refusesABlankEntryClass(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "executable", entry: { class: " " } }, "\"entry.class\" is \" \", not a class name.");
  }

  @TestMethod
  public refusesAnEntryThatIsNotAnObject(): void {
    ProjectTests.assertRefused({ name: "noldova.context.app", kind: "executable", entry: "main.ts" }, undefined);
  }

  private static parse(fields: object): Project {
    return Project.parse(JSON.stringify(fields), ProjectTests.PATH, ProjectTests.DIRECTORY);
  }

  private static assertRefused(fields: object, reason: string | undefined): void {
    const exception = Assert.throws(() => ProjectTests.parse(fields), ProjectFileException);

    Assert.areEqual(ProjectTests.PATH, exception.path);
    if (Object.isUndefined(reason))
      Assert.isInstanceOf(exception.cause, JsonException);
    else
      Assert.areEqual(`The project file "${ProjectTests.PATH}" is invalid: ${reason}`, exception.message);
  }
}
