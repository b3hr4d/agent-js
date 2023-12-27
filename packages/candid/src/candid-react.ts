/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as IDL from './idl';
import { Principal } from '@dfinity/principal';
import * as UI from './candid-core';
import { ExtractedField } from './types';

type InputBox = UI.InputBox;

function validateError(covariant: (value: any) => string | boolean) {
  return function validate(value: any) {
    try {
      covariant(value);
      return true;
    } catch (error) {
      return (error as Error).message || 'An error occurred';
    }
  };
}

export class UIExtract extends IDL.Visitor<string | undefined, ExtractedField> {
  public visitType<T>(t: IDL.Type<T>, l?: string): ExtractedField {
    return {
      component: 'input',
      type: 'text',
      validate: validateError(t.covariant),
      required: true,
      label: l ?? t.name,
      fields: [],
      defaultValues: '',
    };
  }
  public visitNumber<T>(t: IDL.Type<T>, l?: string): ExtractedField {
    return {
      component: 'input',
      type: 'number',
      valueAsNumber: true,
      required: true,
      validate: validateError(t.covariant),
      label: l ?? t.name,
      fields: [],
      defaultValues: undefined,
    };
  }
  public visitInt(t: IDL.IntClass, l?: string): ExtractedField {
    return this.visitNumber(t, l);
  }
  public visitNat(t: IDL.NatClass, l?: string): ExtractedField {
    return this.visitNumber(t, l);
  }
  public visitFloat(t: IDL.FloatClass, l?: string): ExtractedField {
    return this.visitNumber(t, l);
  }
  public visitFixedInt(t: IDL.FixedIntClass, l?: string): ExtractedField {
    return this.visitNumber(t, l);
  }
  public visitFixedNat(t: IDL.FixedNatClass, l?: string): ExtractedField {
    return this.visitNumber(t, l);
  }
  public visitPrincipal(t: IDL.PrincipalClass, data: string | undefined): ExtractedField {
    return {
      component: 'input',
      type: 'principal',
      validate: validateError(t.covariant),
      label: t.name,
      fields: [],
      defaultValues: data,
    };
  }
  public visitBool(t: IDL.BoolClass, l?: string): ExtractedField {
    return {
      component: 'input',
      type: 'checkbox',
      validate: validateError(t.covariant),
      label: l ?? t.name,
      fields: [],
      defaultValues: false,
    };
  }
  public visitNull(t: IDL.NullClass, l?: string): ExtractedField {
    return {
      component: 'span',
      type: 'null',
      label: l ?? t.name,
      validate: validateError(t.covariant),
      fields: [],
      defaultValues: null,
    };
  }
  public visitRecord(
    t: IDL.RecordClass,
    _fields: Array<[string, IDL.Type]>,
    l?: string,
  ): ExtractedField {
    const { fields, defaultValues } = _fields.reduce(
      (acc, [key, type]) => {
        const field = type.extractField(key);
        acc.fields.push(field);
        acc.defaultValues[key] = field.defaultValues;
        return acc;
      },
      { fields: [] as ExtractedField[], defaultValues: {} as Record<string, any> },
    );

    return {
      component: 'fieldset',
      type: 'record',
      label: l ?? t.name,
      validate: validateError(t.covariant),
      fields,
      defaultValues,
    };
  }
  public visitTuple<T extends any[]>(
    t: IDL.TupleClass<T>,
    components: IDL.Type[],
    l?: string,
  ): ExtractedField {
    const { fields, defaultValues } = components.reduce(
      (acc, type) => {
        const field = type.extractField();
        acc.fields.push(field);
        acc.defaultValues.push(field.defaultValues);
        return acc;
      },
      { fields: [] as ExtractedField[], defaultValues: [] as any[] },
    );

    return {
      component: 'fieldset',
      type: 'tuple',
      label: l ?? t.name,
      validate: validateError(t.covariant),
      fields,
      defaultValues,
    };
  }
  public visitVariant(
    t: IDL.VariantClass,
    _fields: Array<[string, IDL.Type]>,
    l?: string,
  ): ExtractedField {
    const { fields, defaultValues, options } = _fields.reduce(
      (acc, [label, type]) => {
        const field = type.extractField(label) as ExtractedField;

        acc.fields.push(field);
        acc.options.push(label);
        acc.defaultValues[label] = field.defaultValues;

        return acc;
      },
      {
        fields: [] as ExtractedField[],
        defaultValues: {} as Record<string, any>,
        options: [] as string[],
      },
    );

    return {
      component: 'fieldset',
      type: 'variant',
      fields,
      options,
      defaultValues,
      label: l ?? t.name,
      validate: validateError(t.covariant),
    };
  }

  public visitOpt<T>(t: IDL.OptClass<T>, ty: IDL.Type<T>, l?: string): ExtractedField {
    return {
      component: 'span',
      type: 'optional',
      validate: validateError(t.covariant),
      label: l ?? t.name,
      fields: [ty.extractField(l)],
      defaultValues: [],
    };
  }

  public visitVec<T>(t: IDL.VecClass<T>, ty: IDL.Type<T>, l?: string): ExtractedField {
    return {
      component: 'span',
      type: 'vector',
      validate: validateError(t.covariant),
      label: l ?? t.name,
      fields: [ty.extractField(l)],
      defaultValues: [],
    };
  }

  public visitRec<T>(t: IDL.RecClass<T>, ty: IDL.ConstructType<T>, l?: string): ExtractedField {
    return {
      component: 'fieldset',
      type: 'recursive',
      label: l ?? t.name,
      validate: validateError(t.covariant),
      extract: () => ty?.extractField(l),
      fields: [],
      defaultValues: undefined,
    };
  }
}

class Parse extends IDL.Visitor<string, any> {
  public visitNull(t: IDL.NullClass, v: string): null {
    return null;
  }
  public visitBool(t: IDL.BoolClass, v: string): boolean {
    if (v === 'true') {
      return true;
    }
    if (v === 'false') {
      return false;
    }
    throw new Error(`Cannot parse ${v} as boolean`);
  }
  public visitText(t: IDL.TextClass, v: string): string {
    return v;
  }
  public visitFloat(t: IDL.FloatClass, v: string): number {
    return parseFloat(v);
  }
  public visitFixedInt(t: IDL.FixedIntClass, v: string): number | bigint {
    if (t._bits <= 32) {
      return parseInt(v, 10);
    } else {
      return BigInt(v);
    }
  }
  public visitFixedNat(t: IDL.FixedNatClass, v: string): number | bigint {
    if (t._bits <= 32) {
      return parseInt(v, 10);
    } else {
      return BigInt(v);
    }
  }
  public visitNumber(t: IDL.PrimitiveType, v: string): bigint {
    return BigInt(v);
  }
  public visitPrincipal(t: IDL.PrincipalClass, v: string): Principal {
    return Principal.fromText(v);
  }
  public visitService(t: IDL.ServiceClass, v: string): Principal {
    return Principal.fromText(v);
  }
  public visitFunc(t: IDL.FuncClass, v: string): [Principal, string] {
    const x = v.split('.', 2);
    return [Principal.fromText(x[0]), x[1]];
  }
}

class Random extends IDL.Visitor<string, any> {
  public visitNull(t: IDL.NullClass, v: string): null {
    return null;
  }
  public visitBool(t: IDL.BoolClass, v: string): boolean {
    return Math.random() < 0.5;
  }
  public visitText(t: IDL.TextClass, v: string): string {
    return Math.random().toString(36).substring(6);
  }
  public visitFloat(t: IDL.FloatClass, v: string): number {
    return Math.random();
  }
  public visitInt(t: IDL.IntClass, v: string): bigint {
    return BigInt(this.generateNumber(true));
  }
  public visitNat(t: IDL.NatClass, v: string): bigint {
    return BigInt(this.generateNumber(false));
  }
  public visitFixedInt(t: IDL.FixedIntClass, v: string): number | bigint {
    const x = this.generateNumber(true);
    if (t._bits <= 32) {
      return x;
    } else {
      return BigInt(v);
    }
  }
  public visitFixedNat(t: IDL.FixedNatClass, v: string): number | bigint {
    const x = this.generateNumber(false);
    if (t._bits <= 32) {
      return x;
    } else {
      return BigInt(v);
    }
  }
  private generateNumber(signed: boolean): number {
    const num = Math.floor(Math.random() * 100);
    if (signed && Math.random() < 0.5) {
      return -num;
    } else {
      return num;
    }
  }
}

function parsePrimitive(t: IDL.Type, config: UI.ParseConfig, d: string) {
  if (config.random && d === '') {
    return t.accept(new Random(), d);
  } else {
    return t.accept(new Parse(), d);
  }
}

interface ValueConfig {
  input: InputBox;
  value: any;
}

/**
 *
 * @param t an IDL Type
 * @param input an InputBox
 * @param value any
 * @returns rendering that value to the provided input
 */
export function renderValue(t: IDL.Type, input: InputBox, value: any) {
  return t.accept(new RenderValue(), { input, value });
}

class RenderValue extends IDL.Visitor<ValueConfig, void> {
  public visitType<T>(t: IDL.Type<T>, d: ValueConfig) {
    (d.input.ui.input as HTMLInputElement).value = t.valueToString(d.value);
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public visitNull(t: IDL.NullClass, d: ValueConfig) {}
  public visitText(t: IDL.TextClass, d: ValueConfig) {
    (d.input.ui.input as HTMLInputElement).value = d.value;
  }
  public visitRec<T>(t: IDL.RecClass<T>, ty: IDL.ConstructType<T>, d: ValueConfig) {
    renderValue(ty, d.input, d.value);
  }
  public visitOpt<T>(t: IDL.OptClass<T>, ty: IDL.Type<T>, d: ValueConfig) {
    if (d.value.length === 0) {
      return;
    } else {
      const form = d.input.ui.form!;
      const open = form.ui.open as HTMLInputElement;
      open.checked = true;
      open.dispatchEvent(new Event(form.ui.event!));
      renderValue(ty, form.form[0], d.value[0]);
    }
  }
  public visitRecord(t: IDL.RecordClass, fields: Array<[string, IDL.Type]>, d: ValueConfig) {
    const form = d.input.ui.form!;
    fields.forEach(([key, type], i) => {
      renderValue(type, form.form[i], d.value[key]);
    });
  }
  public visitTuple<T extends any[]>(t: IDL.TupleClass<T>, components: IDL.Type[], d: ValueConfig) {
    const form = d.input.ui.form!;
    components.forEach((type, i) => {
      renderValue(type, form.form[i], d.value[i]);
    });
  }
  public visitVariant(t: IDL.VariantClass, fields: Array<[string, IDL.Type]>, d: ValueConfig) {
    const form = d.input.ui.form!;
    const selected = Object.entries(d.value)[0];
    fields.forEach(([key, type], i) => {
      if (key === selected[0]) {
        const open = form.ui.open as HTMLSelectElement;
        open.selectedIndex = i;
        open.dispatchEvent(new Event(form.ui.event!));
        renderValue(type, form.form[0], selected[1]);
      }
    });
  }
  public visitVec<T>(t: IDL.VecClass<T>, ty: IDL.Type<T>, d: ValueConfig) {
    const form = d.input.ui.form!;
    const len = d.value.length;
    const open = form.ui.open as HTMLInputElement;
    open.value = len;
    open.dispatchEvent(new Event(form.ui.event!));
    d.value.forEach((v: T, i: number) => {
      renderValue(ty, form.form[i], v);
    });
  }
}
