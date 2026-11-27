/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";

import type { PropertyType } from "../../enums/property-type.js";
import { SnapshotEntity } from "./snapshot-entity.js";
import { SnapshotForeignKey } from "./snapshot-foreign-key.js";
import { SnapshotNavigation } from "./snapshot-navigation.js";
import { SnapshotProperty } from "./snapshot-property.js";

export class SnapshotEntityBuilder {
  private readonly name: string;
  private tableName: string;
  private readonly properties: List<SnapshotProperty> = new List();
  private key: readonly string[] = [];
  private readonly foreignKeys: List<SnapshotForeignKey> = new List();
  private readonly navigations: List<SnapshotNavigation> = new List();

  public constructor(name: string) {
    this.name = name;
    this.tableName = name;
  }

  public toTable(name: string): this {
    this.tableName = name;

    return this;
  }

  public property(name: string, type: PropertyType, columnName: string = name): this {
    this.properties.add(new SnapshotProperty(name, type, false, columnName));

    return this;
  }

  public optionalProperty(name: string, type: PropertyType, columnName: string = name): this {
    this.properties.add(new SnapshotProperty(name, type, true, columnName));

    return this;
  }

  public hasKey(...properties: readonly string[]): this {
    this.key = properties;

    return this;
  }

  public hasForeignKey(principal: string, ...properties: readonly string[]): this {
    this.foreignKeys.add(new SnapshotForeignKey(principal, properties));

    return this;
  }

  public reference(name: string, target: string): this {
    this.navigations.add(new SnapshotNavigation(name, target, false));

    return this;
  }

  public collection(name: string, target: string): this {
    this.navigations.add(new SnapshotNavigation(name, target, true));

    return this;
  }

  public toEntity(): SnapshotEntity {
    return new SnapshotEntity(this.name, this.tableName, this.properties, this.key, this.foreignKeys, this.navigations);
  }
}
