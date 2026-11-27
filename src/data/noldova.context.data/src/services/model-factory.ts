/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary, HashSet, type IReadOnlyDictionary, type IReadOnlyList, List } from "@noldova/context.collections";

import { RelationKind } from "../enums/relation-kind.js";
import { AmbiguousRelationException } from "../exceptions/ambiguous-relation.exception.js";
import { ColumnMappedTwiceException } from "../exceptions/column-mapped-twice.exception.js";
import { EntityKeyMissingException } from "../exceptions/entity-key-missing.exception.js";
import { EntityPropertyMissingException } from "../exceptions/entity-property-missing.exception.js";
import { ForeignKeyMismatchException } from "../exceptions/foreign-key-mismatch.exception.js";
import { RelationTargetUnmappedException } from "../exceptions/relation-target-unmapped.exception.js";
import { StaleSnapshotException } from "../exceptions/stale-snapshot.exception.js";
import { TableMappedTwiceException } from "../exceptions/table-mapped-twice.exception.js";
import { EntityDraft } from "../models/entities/entity-draft.js";
import { EntityProperty } from "../models/entities/entity-property.js";
import { EntityRelation } from "../models/entities/entity-relation.js";
import type { EntityTypeDefinition } from "../models/entities/entity-type-definition.js";
import { EntityType } from "../models/entities/entity-type.js";
import { Model } from "../models/entities/model.js";
import type { SnapshotEntity } from "../models/snapshots/snapshot-entity.js";
import type { SnapshotNavigation } from "../models/snapshots/snapshot-navigation.js";
import { Resources } from "../resources.js";
import { EntityNames } from "./entity-names.js";

export class ModelFactory {
  private readonly drafts: Dictionary<string, EntityDraft> = new Dictionary();
  private readonly claimed: HashSet<SnapshotNavigation> = new HashSet();
  private readonly unresolved: Dictionary<SnapshotNavigation, EntityPropertyMissingException> = new Dictionary();

  private constructor(definitions: IReadOnlyList<EntityTypeDefinition>, snapshot: IReadOnlyList<SnapshotEntity>) {
    const tables = new HashSet<string>();
    for (const definition of definitions) {
      const entity = snapshot.firstOrDefault(t => t.name === definition.type.name);
      if (Object.isUndefined(entity) || ModelFactory.isStale(definition, entity))
        throw new StaleSnapshotException(definition.type.name);
      if (!tables.add(definition.tableName))
        throw new TableMappedTwiceException(definition.tableName);

      this.drafts.set(entity.name, ModelFactory.createDraft(definition, entity));
    }
    for (const entity of snapshot)
      if (!this.drafts.containsKey(entity.name))
        throw new StaleSnapshotException(entity.name);
  }

  public static create(definitions: IReadOnlyList<EntityTypeDefinition>, snapshot: IReadOnlyList<SnapshotEntity>): Model {
    return new ModelFactory(definitions, snapshot).createModel();
  }

  private static isStale(definition: EntityTypeDefinition, entity: SnapshotEntity): boolean {
    const members = entity.properties.select(t => t.name).concat(entity.navigations.select(t => t.name)).toHashSet();

    return !members.setEquals(Object.keys(new definition.type()));
  }

  private static createDraft(definition: EntityTypeDefinition, entity: SnapshotEntity): EntityDraft {
    const keyNames = definition.key ?? ModelFactory.findConventionalKey(entity);
    const columns = new HashSet<string>();
    const properties = new Dictionary<string, EntityProperty>();
    for (const property of entity.properties) {
      const columnName = definition.columnNames.tryGet(property.name) ?? property.name;
      if (!columns.add(columnName))
        throw new ColumnMappedTwiceException(definition.tableName, columnName);

      properties.set(property.name, new EntityProperty(property.name, property.type, columnName, !property.isOptional || keyNames.contains(property.name)));
    }
    for (const name of definition.columnNames.keys())
      ModelFactory.getProperty(properties, entity.name, name);

    return new EntityDraft(definition, entity, properties.asReadOnly(), keyNames.select(t => ModelFactory.getProperty(properties, entity.name, t)).toList().asReadOnly());
  }

  private static findConventionalKey(entity: SnapshotEntity): IReadOnlyList<string> {
    const names = entity.properties.select(t => t.name);
    const key = EntityNames.find(names, Resources.keyName) ?? EntityNames.find(names, entity.name + Resources.keySuffix);
    if (Object.isUndefined(key))
      throw new EntityKeyMissingException(entity.name);

    return new List([key]).asReadOnly();
  }

  private static getProperty(properties: IReadOnlyDictionary<string, EntityProperty>, entity: string, name: string): EntityProperty {
    const property = properties.tryGet(name);
    if (Object.isUndefined(property))
      throw new EntityPropertyMissingException(entity, name);

    return property;
  }

  private static foreignKeyNames(owner: EntityDraft, navigation: SnapshotNavigation, target: EntityDraft): IReadOnlyList<string> {
    return owner.definition.foreignKeys.tryGet(navigation.name) ?? ModelFactory.findForeignKey(owner, navigation.name, target);
  }

  private static findForeignKey(dependent: EntityDraft, prefix: string, principal: EntityDraft): IReadOnlyList<string> {
    return principal.key.select(t => {
      const name = prefix + t.name;

      return EntityNames.find(dependent.properties.keys(), name) ?? name;
    }).toList().asReadOnly();
  }

  private static throwIfMismatched(entity: string, navigation: string, foreignKey: IReadOnlyList<EntityProperty>, principalKey: IReadOnlyList<EntityProperty>): void {
    if (!foreignKey.select(t => t.type).sequenceEqual(principalKey.select(t => t.type)))
      throw new ForeignKeyMismatchException(entity, navigation);
  }

  private createModel(): Model {
    for (const dependent of this.drafts.values())
      for (const navigation of dependent.snapshot.navigations)
        if (!navigation.isCollection)
          this.addReference(dependent, navigation);
    for (const principal of this.drafts.values())
      for (const navigation of principal.snapshot.navigations)
        if (navigation.isCollection && !this.claimed.contains(navigation))
          this.addCollection(principal, navigation);
    for (const unresolved of this.unresolved)
      if (!this.claimed.contains(unresolved.key))
        throw unresolved.value;

    return new Model(this.drafts.values().select(t => new EntityType(t.definition.type, t.definition.tableName, t.properties.values(), t.key, t.relations)));
  }

  private addReference(dependent: EntityDraft, navigation: SnapshotNavigation): void {
    const principal = this.getTarget(dependent, navigation);
    const names = ModelFactory.foreignKeyNames(dependent, navigation, principal);
    const missing = names.firstOrDefault(t => !dependent.properties.containsKey(t));
    if (!Object.isUndefined(missing)) {
      const exception = new EntityPropertyMissingException(dependent.name, missing);
      if (dependent.definition.foreignKeys.containsKey(navigation.name))
        throw exception;

      this.unresolved.set(navigation, exception);
      return;
    }

    const foreignKey = names.select(t => ModelFactory.getProperty(dependent.properties, dependent.name, t)).toList().asReadOnly();
    ModelFactory.throwIfMismatched(dependent.name, navigation.name, foreignKey, principal.key);
    const inverses = principal.snapshot.navigations.where(t => t.target === dependent.name && t !== navigation && !this.holdsForeignKey(principal, t)).toList();
    const inverse = inverses.tryGet(0) ?? null;
    if (inverses.count() > 1 || (inverse !== null && this.claimed.contains(inverse)))
      throw new AmbiguousRelationException(dependent.name, navigation.name);

    this.claimed.add(navigation);
    if (inverse === null) {
      dependent.relations.add(new EntityRelation(RelationKind.OneToMany, navigation.name, principal.definition.type, null, foreignKey));
      return;
    }

    this.claimed.add(inverse);
    dependent.relations.add(new EntityRelation(inverse.isCollection ? RelationKind.OneToMany : RelationKind.OneToOne, navigation.name, principal.definition.type, inverse.name,
      foreignKey));
  }

  private addCollection(principal: EntityDraft, navigation: SnapshotNavigation): void {
    const dependent = this.getTarget(principal, navigation);
    const foreignKey = ModelFactory.findForeignKey(dependent, principal.name, principal).select(t => ModelFactory.getProperty(dependent.properties, dependent.name, t)).toList()
      .asReadOnly();
    ModelFactory.throwIfMismatched(principal.name, navigation.name, foreignKey, principal.key);
    this.claimed.add(navigation);
    dependent.relations.add(new EntityRelation(RelationKind.OneToMany, null, principal.definition.type, navigation.name, foreignKey));
  }

  private holdsForeignKey(owner: EntityDraft, navigation: SnapshotNavigation): boolean {
    if (navigation.isCollection)
      return false;

    const target = this.getTarget(owner, navigation);

    return ModelFactory.foreignKeyNames(owner, navigation, target).all(t => owner.properties.containsKey(t));
  }

  private getTarget(owner: EntityDraft, navigation: SnapshotNavigation): EntityDraft {
    const target = this.drafts.tryGet(navigation.target);
    if (Object.isUndefined(target))
      throw new RelationTargetUnmappedException(owner.name, navigation.name, navigation.target);

    return target;
  }
}
