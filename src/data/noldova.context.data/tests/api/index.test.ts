/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DataApiTests {
  @TestMethod
  public exportsTheCompleteRuntimeSurface(): void {
    const expected = [
      "AmbiguousRelationException", "Change", "ChangeFeed", "ChangeOperation", "ColumnMappedTwiceException", "Connection", "DataException", "DataProvider",
      "DataRecord", "DataSource", "DatabaseFacade", "DbContext", "DbContextOptions", "DbContextOptionsBuilder", "EntityKeyMissingException", "EntityProperty",
      "EntityPropertyMissingException", "EntityRelation", "EntityType", "EntityTypeBuilder", "ForeignKeyMismatchException", "Index", "Migration",
      "MigrationHistory", "Migrator", "Model", "ModelBuilder", "ModelSnapshot", "PropertyBuilder", "PropertyType", "ReferenceMissingException", "RelationBuilder", "RelationKind",
      "RelationTargetUnmappedException", "SnapshotBuilder", "SnapshotEntity", "SnapshotEntityBuilder", "SnapshotForeignKey",
      "SnapshotNavigation", "SnapshotProperty", "StaleSnapshotException", "TableMappedTwiceException", "Transaction"
    ];

    Assert.areEqual(expected.join(","), Object.keys(api).sort().join(","));
  }
}
