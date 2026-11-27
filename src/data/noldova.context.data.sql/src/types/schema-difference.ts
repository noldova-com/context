/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { AddColumnOperation } from "../models/operations/add-column-operation.js";
import type { AddForeignKeyOperation } from "../models/operations/add-foreign-key-operation.js";
import type { AddPrimaryKeyOperation } from "../models/operations/add-primary-key-operation.js";
import type { AlterColumnOperation } from "../models/operations/alter-column-operation.js";
import type { CreateTableOperation } from "../models/operations/create-table-operation.js";
import type { DropColumnOperation } from "../models/operations/drop-column-operation.js";
import type { DropForeignKeyOperation } from "../models/operations/drop-foreign-key-operation.js";
import type { DropPrimaryKeyOperation } from "../models/operations/drop-primary-key-operation.js";
import type { DropTableOperation } from "../models/operations/drop-table-operation.js";

export type SchemaDifference = AddColumnOperation | AddForeignKeyOperation | AddPrimaryKeyOperation | AlterColumnOperation | CreateTableOperation
  | DropColumnOperation | DropForeignKeyOperation | DropPrimaryKeyOperation | DropTableOperation;
