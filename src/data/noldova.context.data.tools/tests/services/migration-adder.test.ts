/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { SqlModelValidator, SqlQuery } from "@noldova/context.data.sql";
import { DataToolsException, EntityPropertyTypeException } from "@noldova/context.data.tools";
import { AddMigrationArguments } from "@noldova/context.data.tools/models/migrations/add-migration-arguments.js";
import { MigrationAdder } from "@noldova/context.data.tools/services/migration-adder.js";
import { ProjectSources } from "@noldova/context.data.tools/services/project-sources.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { NotesStep } from "../fixtures/notes-step.fixture.js";
import { ProviderDatabase } from "../fixtures/provider-database.fixture.js";
import { ToolProject } from "../fixtures/tool-project.fixture.js";

@TestClass
export class MigrationAdderTests {
  private static readonly sqlite: string = "noldova.context.data.sql.sqlite";
  private static readonly thingSource: string = [
    "import { DbContext } from \"@noldova/context.data\";",
    "export class Thing { public name: string = \"\"; }",
    "export class ThingContext extends DbContext<SqlConnection, SqlMigration> { }"
  ].join("\n");

  @TestMethod
  @TestData("sqlite")
  @TestData("postgresql")
  public async writesEachVersionsMigrationSnapshotAndListAsync(provider: string): Promise<void> {
    let previous: string | null = null;
    for (const step of NotesStep.all) {
      await using project = await ToolProject.createAsync();
      await project.copyVersionAsync(step.version, previous, provider);

      const written = await MigrationAdderTests.addAsync(project, [step.name, "--provider", `noldova.context.data.sql.${provider}`], step.now);

      const names = [step.migrationFile, "notes-context-model-snapshot.ts", "notes-context-migrations.ts"];
      Assert.areEqual(names.map(t => `src/migrations/${provider}/${t}`).join(","), written.map(t => project.relative(t)).join(","));
      for (const name of names)
        Assert.areEqual(await ToolProject.expectedAsync(step.version, provider, name), await project.readAsync(`src/migrations/${provider}/${name}`), name);
      previous = step.version;
    }
  }

  @TestMethod
  public async writesToTheOutputFolderGivenAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.copyVersionAsync("v1", null, "sqlite");

    const written = await MigrationAdderTests.addAsync(project, ["AddNotes", "--provider", MigrationAdderTests.sqlite, "--output", "src/data",
      "--context", "NotesContext"], new Date(Date.UTC(2026, 10, 27, 12)));

    Assert.areEqual("src/data/20261127120000-add-notes.ts,src/data/notes-context-model-snapshot.ts,src/data/notes-context-migrations.ts",
      written.map(t => project.relative(t)).join(","));
  }

  @TestMethod
  @TestData("sqlite")
  @TestData("postgresql")
  public async writesNothingWhenTheModelMatchesTheLastSnapshotAsync(provider: string): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.copyVersionAsync("v3", "v3", provider);

    Assert.areEqual(0, (await MigrationAdderTests.addAsync(project, ["Again", "--provider", `noldova.context.data.sql.${provider}`], new Date())).length);
    Assert.areEqual(5, (await project.listAsync(`src/migrations/${provider}`)).length);
  }

  @TestMethod
  public async readsASnapshotWithWindowsLineBreaksAsItsCompiledSnapshotAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.copyVersionAsync("v3", "v3", "sqlite");
    const snapshot = "src/migrations/sqlite/notes-context-model-snapshot.ts";
    await project.writeAsync(snapshot, (await project.readAsync(snapshot)).replaceAll("\n", "\r\n"));

    Assert.areEqual(0, (await MigrationAdderTests.addAsync(project, ["Again", "--provider", MigrationAdderTests.sqlite], new Date())).length);
  }

  @TestMethod
  public async failsWhenTheCompiledSnapshotIsOlderThanItsSourceAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.copyVersionAsync("v2", "v1", "sqlite");
    await MigrationAdderTests.addAsync(project, ["AddOwners", "--provider", MigrationAdderTests.sqlite], new Date(Date.UTC(2026, 10, 27, 13)));

    const message = await MigrationAdderTests.failureAsync(project, ["Again", "--provider", MigrationAdderTests.sqlite]);

    Assert.areEqual(`The compiled snapshot of "${project.path("src/migrations/sqlite/notes-context-model-snapshot.ts")}" doesn't match its source: `
      + "build the project first, and leave the files the tool writes as it wrote them.", message);
    Assert.areEqual("20261127120000-add-notes.ts,20261127130000-add-owners.ts,notes-context-migrations.ts,notes-context-model-snapshot.ts",
      (await project.listAsync("src/migrations/sqlite")).join(","));
  }

  @TestMethod
  @TestData("sqlite")
  @TestData("postgresql")
  public async appliesTheWrittenMigrationsInTurnKeepingTheRowsAsync(provider: string): Promise<void> {
    await using database = await ProviderDatabase.createAsync(provider);
    const [first, second, third] = NotesStep.all;
    Assert.isDefined(first);
    Assert.isDefined(second);
    Assert.isDefined(third);
    {
      await using context = first.open(database.options(), provider);
      Assert.areEqual("20261127120000_AddNotes", (await context.database.migrateAsync()).join(","));
      SqlModelValidator.validate(context.model, first.snapshot(provider), context.database.connection.dialect);
      await context.database.connection.executeAsync(new SqlQuery("INSERT INTO \"notes\" (\"id\", \"body\") VALUES (?, ?)", [1, "first"]));
    }
    {
      await using context = second.open(database.options(), provider);
      Assert.areEqual("20261127130000_AddOwners", (await context.database.migrateAsync()).join(","));
      SqlModelValidator.validate(context.model, second.snapshot(provider), context.database.connection.dialect);
      const connection = context.database.connection;
      const notes = await connection.queryAsync(new SqlQuery("SELECT \"body\", \"rank\", \"title\", \"ownerId\" FROM \"notes\""));
      Assert.areEqual("first:0:null:null",
        notes.map(t => `${t.readString("body")}:${t.readInteger("rank")}:${t.readNullableString("title")}:${t.readNullableInteger("ownerId")}`).join(","));
      await connection.executeAsync(new SqlQuery("INSERT INTO \"owners\" (\"id\", \"name\") VALUES (?, ?)", [7, "owner"]));
      await connection.executeAsync(new SqlQuery("UPDATE \"notes\" SET \"ownerId\" = ?", [7]));
    }
    await using context = third.open(database.options(), provider);
    Assert.areEqual("20261127140000_ChangeOwnerKey", (await context.database.migrateAsync()).join(","));
    SqlModelValidator.validate(context.model, third.snapshot(provider), context.database.connection.dialect);
    const connection = context.database.connection;
    const owners = await connection.queryAsync(new SqlQuery("SELECT \"code\", \"name\" FROM \"owners\""));
    const notes = await connection.queryAsync(new SqlQuery("SELECT \"id\", \"title\", \"body\", \"rank\" FROM \"notes\""));
    Assert.areEqual(":owner", owners.map(t => `${t.readString("code")}:${t.readString("name")}`).join(","));
    Assert.areEqual("1::first:0", notes.map(t => `${t.readInteger("id")}:${t.readString("title")}:${t.readString("body")}:${t.readString("rank")}`).join(","));
  }

  @TestMethod
  public async writesNothingForAPropertyTypeItCannotMapAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.copyVersionAsync("v1", null, "sqlite");
    await project.writeAsync("src/entities.ts", (await project.readAsync("src/entities.ts")).replace("public text: string = \"\";", "public text: Date = new Date();"));

    const exception = await Assert.throwsAsync(() => MigrationAdderTests.addAsync(project, ["AddNotes", "--provider", MigrationAdderTests.sqlite], new Date()),
      EntityPropertyTypeException);

    Assert.areEqual("Note.text", `${exception.entity}.${exception.property}`);
    Assert.areEqual("build,notes.ctxp,src,tsconfig.json", (await project.listAsync(".")).join(","));
    Assert.areEqual("entities.ts,notes-context.ts", (await project.listAsync("src")).join(","));
  }

  @TestMethod
  public async failsForAContextItsCompiledFileDoesNotExportAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.writeAsync("src/context.ts", MigrationAdderTests.thingSource);
    await project.writeAsync("build/context.js", "export const ThingContext = 1;\n");

    Assert.areEqual(`The compiled "${project.path("src/context.ts")}" exports no class "ThingContext" of the kind its source declares: build the project again.`,
      await MigrationAdderTests.failureAsync(project, ["AddThings", "--provider", MigrationAdderTests.sqlite]));
  }

  @TestMethod
  public async failsForAModelItCannotBuildAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.writeAsync("src/context.ts", MigrationAdderTests.thingSource);
    await project.writeAsync("build/context.js", [
      "import { DbContext } from \"@noldova/context.data\";",
      "export class Thing { }",
      "export class ThingContext extends DbContext { onModelCreating(builder) { builder.entity(Thing); } }"
    ].join("\n"));

    const message = await MigrationAdderTests.failureAsync(project, ["AddThings", "--provider", MigrationAdderTests.sqlite]);

    Assert.isTrue(message.startsWith("The model of \"ThingContext\" can't be built: "), message);
  }

  @TestMethod
  @TestData("noldova.context.data.sql", "The provider \"noldova.context.data.sql\" exports no SqlDialect.")
  @TestData("noldova.context.data.sql.missing", "The provider package @noldova/context.data.sql.missing is not installed for \"{project}\".")
  public async failsForAProviderWithNoDialectAsync(provider: string, message: string): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.copyVersionAsync("v1", null, "sqlite");

    Assert.areEqual(message.replace("{project}", project.projectFilePath), await MigrationAdderTests.failureAsync(project, ["AddNotes", "--provider", provider]));
  }

  @TestMethod
  public async failsForASnapshotItsCompiledFileDoesNotExportAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.copyVersionAsync("v2", "v1", "sqlite");
    await project.writeAsync("build/migrations/sqlite/notes-context-model-snapshot.js", "export class NotesContextModelSnapshot { }\n");

    Assert.areEqual(`The compiled "${project.path("src/migrations/sqlite/notes-context-model-snapshot.ts")}" exports no class "NotesContextModelSnapshot" `
      + "of the kind its source declares: build the project again.",
    await MigrationAdderTests.failureAsync(project, ["AddOwners", "--provider", MigrationAdderTests.sqlite]));
  }

  @TestMethod
  public async failsForAMigrationFileWithNoMigrationClassAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.copyVersionAsync("v2", "v1", "sqlite");
    await project.writeAsync("src/migrations/sqlite/20261127125959-broken.ts", "export class Broken { }\n");

    Assert.areEqual(`The migration "${project.path("src/migrations/sqlite/20261127125959-broken.ts")}" has no one class that extends SqlMigration.`,
      await MigrationAdderTests.failureAsync(project, ["AddOwners", "--provider", MigrationAdderTests.sqlite]));
  }

  @TestMethod
  public async failsForANameAnEarlierMigrationHasAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.copyVersionAsync("v2", "v1", "sqlite");

    Assert.areEqual("The migration \"20261127120000-add-notes\" is already named \"AddNotes\".",
      await MigrationAdderTests.failureAsync(project, ["AddNotes", "--provider", MigrationAdderTests.sqlite]));
    Assert.areEqual(3, (await project.listAsync("src/migrations/sqlite")).length);
  }

  private static async addAsync(project: ToolProject, arguments_: readonly string[], now: Date): Promise<readonly string[]> {
    return MigrationAdder.addAsync(await ProjectSources.openAsync(project.projectFilePath), AddMigrationArguments.parse(["add", ...arguments_]), now);
  }

  private static async failureAsync(project: ToolProject, arguments_: readonly string[]): Promise<string> {
    return (await Assert.throwsAsync(() => MigrationAdderTests.addAsync(project, arguments_, new Date()), DataToolsException)).message;
  }
}
