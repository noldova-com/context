/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SDKException } from "@noldova/context.sdk";
import { ProjectGraphReader } from "@noldova/context.sdk/services/project-graph.reader.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { SDKProject } from "../fixtures/sdk-project.fixture.js";

@TestClass
export class ProjectGraphReaderTests {
  @TestMethod
  @TestData({ name: "notes", kind: "library" })
  @TestData({ name: "notes", kind: "library", dependencies: { packages: [] } })
  public async readsAProjectWithNoProjectDependenciesAsync(manifest: object): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync(manifest);

    const projects = await ProjectGraphReader.readAsync(project.projectFilePath);

    Assert.areEqual("notes", projects.map(t => t.name).join(","));
    Assert.areEqual(project.projectFilePath, projects[0]?.manifestPath);
  }

  @TestMethod
  public async ordersDependenciesFirstInTheirDeclaredOrderAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { projects: ["b/b.ctxp", "./a/a.ctxp"] } });
    await project.writeProjectAsync("a", { name: "a", kind: "library", dependencies: { projects: ["../c/c.ctxp"] } });
    await project.writeProjectAsync("b", { name: "b", kind: "library", dependencies: { projects: ["../c/c.ctxp"] } });
    await project.writeProjectAsync("c", { name: "c", kind: "library" });

    const projects = await ProjectGraphReader.readAsync(project.projectFilePath);

    Assert.areEqual("c,b,a,notes", projects.map(t => t.name).join(","));
    Assert.areEqual(project.path("c/c.ctxp"), projects[0]?.manifestPath);
    Assert.areEqual(project.path("c"), projects[0]?.directory);
  }

  @TestMethod
  @TestData("a/a.ctxp")
  @TestData("B/b.ctxp")
  @TestData("b/B.ctxp")
  @TestData("notes.ctxp/b.ctxp")
  @TestData("b/folder.ctxp")
  @TestData("b/link.ctxp")
  public async refusesADependencyWithNoProjectFileAtItsExactPathAsync(dependency: string): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { projects: [dependency] } });
    await project.writeProjectAsync("b", { name: "b", kind: "library" });
    await project.writeAsync("b/folder.ctxp/b.ctxp", JSON.stringify({ name: "b", kind: "library" }));
    await project.writeDanglingLinkAsync("b/link.ctxp");

    const exception = await Assert.throwsAsync(() => ProjectGraphReader.readAsync(project.projectFilePath), SDKException);

    Assert.areEqual(`"notes" depends on "${dependency}", but no project file has that exact path.`, exception.message);
  }

  @TestMethod
  @TestData("a\\a.ctxp")
  @TestData("/a/a.ctxp")
  @TestData("C:/a/a.ctxp")
  @TestData("a/tsconfig.json")
  public async refusesADependencyThatIsNotARelativeProjectFilePathAsync(dependency: string): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { projects: [dependency] } });
    await project.writeProjectAsync("a", { name: "a", kind: "library" });

    const exception = await Assert.throwsAsync(() => ProjectGraphReader.readAsync(project.projectFilePath), SDKException);

    Assert.areEqual(`"notes" depends on "${dependency}": a project dependency is a relative path to a .ctxp file, with forward slashes.`,
      exception.message);
  }

  @TestMethod
  public async refusesADependencyNamedTwiceAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { projects: ["a/a.ctxp", "./a/a.ctxp"] } });
    await project.writeProjectAsync("a", { name: "a", kind: "library" });

    const exception = await Assert.throwsAsync(() => ProjectGraphReader.readAsync(project.projectFilePath), SDKException);

    Assert.areEqual("\"notes\" names \"./a/a.ctxp\" more than once in its project dependencies.", exception.message);
  }

  @TestMethod
  public async refusesTwoProjectsWithOneNameAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { projects: ["a/a.ctxp", "b/b.ctxp"] } });
    await project.writeProjectAsync("a", { name: "shared", kind: "library" });
    await project.writeProjectAsync("b", { name: "shared", kind: "library" });

    const exception = await Assert.throwsAsync(() => ProjectGraphReader.readAsync(project.projectFilePath), SDKException);

    Assert.areEqual(`"${project.path("a/a.ctxp")}" and "${project.path("b/b.ctxp")}" are both named "shared".`, exception.message);
  }

  @TestMethod
  public async refusesACycleNamingItsProjectsInOrderAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { projects: ["a/a.ctxp"] } });
    await project.writeProjectAsync("a", { name: "a", kind: "library", dependencies: { projects: ["../b/b.ctxp"] } });
    await project.writeProjectAsync("b", { name: "b", kind: "library", dependencies: { projects: ["../a/a.ctxp"] } });

    const exception = await Assert.throwsAsync(() => ProjectGraphReader.readAsync(project.projectFilePath), SDKException);

    Assert.areEqual("The project dependencies form a cycle: a -> b -> a.", exception.message);
  }

  @TestMethod
  public async refusesAnExecutableDependencyAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { projects: ["a/a.ctxp"] } });
    await project.writeProjectAsync("a", { name: "a", kind: "executable" });

    const exception = await Assert.throwsAsync(() => ProjectGraphReader.readAsync(project.projectFilePath), SDKException);

    Assert.areEqual("\"notes\" depends on \"a\", an executable: only a library can be a project dependency.", exception.message);
  }

  @TestMethod
  @TestData({ projects: "a/a.ctxp" })
  @TestData("a/a.ctxp")
  public async refusesInvalidProjectDependenciesAsync(dependencies: unknown): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies });

    const exception = await Assert.throwsAsync(() => ProjectGraphReader.readAsync(project.projectFilePath), SDKException);

    Assert.isTrue(exception.message.startsWith("The project dependencies of \"notes\" can't be read: "));
  }
}
