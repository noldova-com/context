/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly connectionClosed: string = "The connection is closed.";
  public static readonly containerParameterName: string = "container";
  public static readonly createdAtParameterName: string = "createdAt";
  public static readonly defaultChangeBatch: number = 100;
  public static readonly entityIdParameterName: string = "entityId";
  public static readonly entityParameterName: string = "entity";
  public static readonly fieldsParameterName: string = "fields";
  public static readonly foreignKeyWithoutProperties: string = "A foreign key names at least one property.";
  public static readonly idParameterName: string = "id";
  public static readonly indexWithoutFields: string = "An index names at least one field.";
  public static readonly keyName: string = "id";
  public static readonly keySuffix: string = "Id";
  public static readonly keyWithoutProperties: string = "A key names at least one property.";
  public static readonly limitParameterName: string = "limit";
  public static readonly locationParameterName: string = "location";
  public static readonly migrationIdInvalid: string = "A migration id is fourteen digits, an underscore, and a PascalCase name.";
  public static readonly migrationIdPattern: RegExp = /^\d{14}_[A-Z][A-Za-z0-9]*$/;
  public static readonly migrationsUnordered: string = "Migrations are listed once each, in ascending id order.";
  public static readonly nameParameterName: string = "name";
  public static readonly propertiesParameterName: string = "properties";
  public static readonly sequenceParameterName: string = "sequence";
  public static readonly transactionCompleted: string = "The transaction has already been committed or rolled back.";
  public static readonly transactionFailedInside: string = "A statement or an inner transaction failed, so the transaction was rolled back.";
  public static readonly transactionRollbackFailed: string = "The transaction failed and rollback also failed.";

  public static formatAmbiguousRelation(entity: string, navigation: string): string {
    return `The relation "${entity}.${navigation}" has more than one inverse navigation on its principal.`;
  }

  public static formatColumnMappedTwice(table: string, column: string): string {
    return `The table "${table}" maps two properties to the column "${column}".`;
  }

  public static formatEntityKeyMissing(entity: string, conventionalKey: string): string {
    return `The entity "${entity}" has no key: name one with hasKey, or declare a property named "${Resources.keyName}" or "${conventionalKey}", in any letter case.`;
  }

  public static formatEntityPropertyMissing(entity: string, property: string): string {
    return `The entity "${entity}" has no property "${property}".`;
  }

  public static formatFieldMissing(field: string): string {
    return `The record has no field "${field}".`;
  }

  public static formatFieldNotInteger(field: string): string {
    return `The field "${field}" does not hold an integer.`;
  }

  public static formatFieldNotText(field: string): string {
    return `The field "${field}" does not hold text.`;
  }

  public static formatForeignKeyMismatch(entity: string, navigation: string): string {
    return `The foreign key of "${entity}.${navigation}" does not match its principal's key in count or type.`;
  }

  public static formatReferenceMissing(entity: string, navigation: string): string {
    return `The entity "${entity}" has no reference "${navigation}" to configure a foreign key on.`;
  }

  public static formatRelationTargetUnmapped(entity: string, navigation: string, target: string): string {
    return `The relation "${entity}.${navigation}" leads to "${target}", which the model does not map.`;
  }

  public static formatStaleSnapshot(entity: string): string {
    return `The entity "${entity}" changed since the model snapshot was made: add a migration.`;
  }

  public static formatTableMappedTwice(table: string): string {
    return `Two entities are mapped to the table "${table}".`;
  }
}
