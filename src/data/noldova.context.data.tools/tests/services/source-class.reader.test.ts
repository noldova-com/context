/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataToolsException } from "@noldova/context.data.tools";
import { SourceClassReader } from "@noldova/context.data.tools/services/source-class.reader.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SourceClassReaderTests {
  @TestMethod
  public readsEachTopLevelClassWithItsBaseAndInstanceProperties(): void {
    const classes = SourceClassReader.read([
      "import { DbContext } from \"@noldova/context.data\";",
      "export class Note extends Entry {",
      "  public static readonly table: string = \"notes\";",
      "  public id: number = 0;",
      "  public title?: string;",
      "  public body = \"\";",
      "  public read(): string { return this.body; }",
      "}",
      "class Entry { }",
      "export class NotesContext extends DbContext<SqlConnection, SqlMigration> { }",
      "export class Qualified extends data.DbContext { }",
      "export default class { public id: number = 0; }",
      "function inner(): void { class Hidden { } }"
    ].join("\n"), "src/notes.ts");

    Assert.areEqual("Note<Entry>,Entry<>,NotesContext<DbContext>,Qualified<>", classes.map(t => `${t.name}<${t.baseName ?? ""}>`).join(","));
    Assert.areEqual("src/notes.ts", classes[0]?.filePath);
    Assert.areEqual("id:true:false,title:true:true,body:false:false",
      classes[0]?.properties.map(t => `${t.name}:${!Object.isUndefined(t.typeNode)}:${t.isOptional}`).join(","));
  }

  @TestMethod
  public failsForASourceThatDoesNotParse(): void {
    const exception = Assert.throws(() => SourceClassReader.read("export class {", "src/broken.ts"), DataToolsException);

    Assert.isTrue(exception.message.startsWith("The source \"src/broken.ts\" doesn't parse: "), exception.message);
  }
}
