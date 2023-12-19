/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable jsdoc/require-jsdoc */
export interface JsonArray extends Array<JsonValue> {}

export interface JsonObject extends Record<string, JsonValue> {}

export type JsonValue = boolean | string | number | JsonArray | JsonObject;

export type FieldComponent = 'form' | 'input' | 'select' | 'option' | 'span';

export type FieldType =
  | 'text'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'textarea'
  | 'reserved'
  | 'null'
  | 'empty'
  | 'principal'
  | 'unknown';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyValue = any;

export type FormFields = Partial<{
  required: boolean;
  min: number | string;
  max: number | string;
  maxLength: number;
  minLength: number;
  validate: (value: AnyValue) => boolean | string;
  value: AnyValue;
  setValueAs: (value: AnyValue) => AnyValue;
  shouldUnregister?: boolean;
  onChange?: (event: Event) => void;
  onBlur?: (event: Event) => void;
  disabled: boolean;
  deps: AnyValue | AnyValue[];
}> & {
  [key: string]: AnyValue;
};

export interface ExtractFields extends FormFields {
  label: string;
  type: FieldType;
  parent: string;
  parentName?: string;
  options?: string[];
  optional?: boolean;
  component?: FieldComponent;
}

export type ExtractFieldsArgs = {
  label?: string;
  parent: string;
  parentName?: string;
  recursive?: boolean;
  optional?: boolean;
};
