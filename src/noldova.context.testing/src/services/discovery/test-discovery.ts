/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { isGeneratorFunction } from "node:util/types";

import { nameof } from "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";

import { TestingException } from "../../exceptions/testing.exception.js";
import { TestDataEntry } from "../../models/decorators/test-data-entry.js";
import { TestMarks } from "../../models/decorators/test-marks.js";
import { DiscoveredTestClass } from "../../models/discovery/discovered-test-class.js";
import { DiscoveredTestMethod } from "../../models/discovery/discovered-test-method.js";
import type { TestProject } from "../../models/discovery/test-project.js";
import { Resources } from "../../resources.js";

export class TestDiscovery {
  public async discoverAsync(testProjects: readonly TestProject[],
    onFileImported: (filePath: string) => void = () => undefined): Promise<DiscoveredTestClass[]> {
    const testClasses: DiscoveredTestClass[] = [];
    const sortedProjects = [...testProjects]
      .sort((first, second) => this.compareProjects(first, second));
    for (const testProject of sortedProjects) {
      for (const testFile of await this.findTestFilesAsync(testProject.rootDirectory)) {
        const filePath = relative(testProject.rootDirectory, testFile).replaceAll(Resources.windowsDirectorySeparator, Resources.directorySeparator);
        const moduleExports: object = await import(pathToFileURL(testFile).href);
        onFileImported(filePath);
        testClasses.push(...this.discoverModuleExports(moduleExports, filePath, testProject.packageName));
      }
    }

    return testClasses;
  }

  public discoverModuleExports(moduleExports: object, filePath: string, packageName: string): DiscoveredTestClass[] {
    ArgumentException.throwIfNullOrWhitespace(filePath, Resources.filePathParameter);
    ArgumentException.throwIfNullOrWhitespace(packageName, Resources.packageNameParameter);

    const testClasses: DiscoveredTestClass[] = [];
    for (const exportName of Object.keys(moduleExports).sort()) {
      const exportedValue = this.getOwnDataProperty(moduleExports, exportName);
      const isNamed = exportName.endsWith(Resources.testClassSuffix);

      if (!this.isMarkedTestClass(exportedValue)) {
        if (this.hasCategories(exportedValue))
          throw new TestingException(Resources.categoryWithoutTestClass(exportName, filePath));

        if (Object.isFunction(exportedValue) && Object.hasOwn(exportedValue, TestMarks.SKIP))
          throw new TestingException(Resources.skipWithoutTestClass(exportName, filePath));

        if (isNamed)
          throw new TestingException(Resources.unmarkedNamedTestClass(exportName, filePath));

        continue;
      }

      if (!isNamed)
        throw new TestingException(Resources.markedTestClassWithoutRequiredName(exportName, filePath, Resources.testClassSuffix));

      testClasses.push(this.discoverTestClass(exportName, exportedValue, filePath, packageName));
    }

    if (testClasses.length === 0)
      throw new TestingException(Resources.testFileWithoutTestClass(filePath));

    return testClasses;
  }

  private discoverTestClass(className: string, testClassConstructor: new () => object, filePath: string, packageName: string): DiscoveredTestClass {
    const prototype: unknown = testClassConstructor.prototype;
    if (!Object.isObject(prototype) || Object.isFunction(prototype))
      throw new TestingException(Resources.testClassWithoutPrototype(className, filePath));
    const classCategories = this.getCategories(testClassConstructor);

    for (const memberName of [...Object.getOwnPropertyNames(testClassConstructor).sort(), ...Object.getOwnPropertySymbols(testClassConstructor)]) {
      const descriptor = Object.getOwnPropertyDescriptor(testClassConstructor, memberName)!;
      if (this.descriptorHasTestMetadata(descriptor))
        throw new TestingException(Resources.staticTestMetadataInvalid(String(memberName), className, filePath));
    }

    const methods: DiscoveredTestMethod[] = [];
    for (const memberName of [...Object.getOwnPropertyNames(prototype).sort(), ...Object.getOwnPropertySymbols(prototype)]) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, memberName)!;
      if (Object.isSymbol(memberName)) {
        if (this.descriptorHasTestMetadata(descriptor))
          throw new TestingException(Resources.symbolTestMetadataInvalid(className, filePath));

        continue;
      }

      if (memberName === nameof<Object>(t => t.constructor))
        continue;

      if (!Object.isUndefined(descriptor.get) || !Object.isUndefined(descriptor.set)) {
        if (this.descriptorHasTestMetadata(descriptor))
          throw new TestingException(Resources.accessorTestMetadataInvalid(memberName, className, filePath));

        continue;
      }

      const member = this.getOwnDataProperty(prototype, memberName);
      const testDataEntries = this.getTestDataEntries(member);
      const methodCategories = this.getCategories(member);
      if (!this.isMarkedTestMethod(member)) {
        if (!Object.isUndefined(testDataEntries))
          throw new TestingException(Resources.testDataWithoutTestMethod(memberName, className, filePath));
        if (methodCategories.length > 0)
          throw new TestingException(Resources.categoryWithoutTestMethod(memberName, className, filePath));

        if (Object.isFunction(member) && Object.hasOwn(member, TestMarks.SKIP))
          throw new TestingException(Resources.skipWithoutTestMethod(memberName, className, filePath));

        continue;
      }

      if (isGeneratorFunction(member))
        throw new TestingException(Resources.generatorTestMethodInvalid(memberName, className, filePath));

      const skipReason = this.getSkipReason(member);
      const categories = [...classCategories, ...methodCategories];
      if (Object.isUndefined(testDataEntries)) {
        if (member.length > 0)
          throw new TestingException(Resources.testMethodRequiresData(memberName, className, filePath));

        methods.push(new DiscoveredTestMethod(memberName, undefined, [], skipReason, categories));
        continue;
      }

      for (let index = 0; index < testDataEntries.length; index++) {
        const testDataEntry = testDataEntries[index];
        if (Object.isUndefined(testDataEntry))
          throw new TestingException(Resources.testDataMarkInvalid);

        if (testDataEntry.values.length !== member.length)
          throw new TestingException(Resources.testDataParameterCountMismatch(
            memberName,
            className,
            filePath,
            member.length,
            testDataEntry.values.length));

        methods.push(new DiscoveredTestMethod(memberName, index, testDataEntry.values, skipReason, categories));
      }
    }

    if (methods.length === 0)
      throw new TestingException(Resources.testClassWithoutTestMethod(className, filePath));

    return new DiscoveredTestClass(packageName, className, filePath, testClassConstructor, this.getSkipReason(testClassConstructor), methods, classCategories);
  }

  private async findTestFilesAsync(rootDirectory: string): Promise<string[]> {
    ArgumentException.throwIfNullOrWhitespace(rootDirectory, Resources.rootDirectoryParameter);

    const entries = await readdir(rootDirectory, { recursive: true, withFileTypes: true });
    const testFiles: string[] = [];
    for (const entry of entries)
      if (entry.isFile() && entry.name.endsWith(Resources.testFileSuffix))
        testFiles.push(join(entry.parentPath, entry.name));

    return testFiles.sort();
  }

  private isMarkedTestClass(value: unknown): value is new () => object {
    if (!Object.isFunction(value) || !Object.hasOwn(value, TestMarks.TEST_CLASS))
      return false;

    if (this.getOwnDataProperty(value, TestMarks.TEST_CLASS) !== true)
      throw new TestingException(Resources.testClassMarkInvalid);

    return true;
  }

  private isMarkedTestMethod(value: unknown): value is Function {
    if (!Object.isFunction(value) || !Object.hasOwn(value, TestMarks.TEST_METHOD))
      return false;

    if (this.getOwnDataProperty(value, TestMarks.TEST_METHOD) !== true)
      throw new TestingException(Resources.testMethodMarkInvalid);

    return true;
  }

  private hasTestData(value: unknown): value is Function {
    return Object.isFunction(value) && Object.hasOwn(value, TestMarks.TEST_DATA);
  }

  private hasCategories(value: unknown): value is Function {
    return Object.isFunction(value) && Object.hasOwn(value, TestMarks.CATEGORY);
  }

  private getCategories(value: unknown): string[] {
    if (!this.hasCategories(value))
      return [];

    const markedCategories = this.getOwnDataProperty(value, TestMarks.CATEGORY);
    if (!Array.isArray(markedCategories) || markedCategories.length === 0)
      throw new TestingException(Resources.categoryMarkInvalid);

    const categories: string[] = [];
    for (const category of markedCategories) {
      if (!Object.isString(category) || String.isNullOrWhitespace(category))
        throw new TestingException(Resources.categoryMarkInvalid);

      categories.push(category);
    }

    return [...new Set(categories)];
  }

  private getTestDataEntries(value: unknown): readonly TestDataEntry[] | undefined {
    if (!this.hasTestData(value))
      return undefined;

    const entries = this.getOwnDataProperty(value, TestMarks.TEST_DATA);
    if (!Array.isArray(entries) || entries.length === 0 || entries.some(t => !(t instanceof TestDataEntry)))
      throw new TestingException(Resources.testDataMarkInvalid);

    return entries;
  }

  private getSkipReason(value: Function): string | undefined {
    if (!Object.hasOwn(value, TestMarks.SKIP))
      return undefined;

    const reason = this.getOwnDataProperty(value, TestMarks.SKIP);
    if (!Object.isString(reason) || String.isNullOrWhitespace(reason))
      throw new TestingException(Resources.skipReasonInvalid);

    return reason;
  }

  private descriptorHasTestMetadata(descriptor: PropertyDescriptor): boolean {
    return this.hasTestMetadata(descriptor.value)
      || this.hasTestMetadata(descriptor.get)
      || this.hasTestMetadata(descriptor.set);
  }

  private hasTestMetadata(value: unknown): boolean {
    return Object.isFunction(value)
      && (this.isMarkedTestMethod(value) || this.hasTestData(value) || this.hasCategories(value) || Object.hasOwn(value, TestMarks.SKIP));
  }

  private getOwnDataProperty(value: object, propertyKey: PropertyKey): unknown {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyKey);

    return !Object.isUndefined(descriptor) && Object.hasOwn(descriptor, nameof<PropertyDescriptor>(t => t.value)) ? descriptor.value : undefined;
  }

  private compareProjects(first: TestProject, second: TestProject): number {
    if (first.packageName !== second.packageName)
      return first.packageName < second.packageName ? -1 : 1;

    return first.rootDirectory === second.rootDirectory ? 0 : first.rootDirectory < second.rootDirectory ? -1 : 1;
  }
}
