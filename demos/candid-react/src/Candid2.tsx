import { Actor } from '@dfinity/agent';
import { createActor } from './small';
import {
  Control,
  UseFormTrigger,
  UseFormResetField,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import React from 'react';
import { ExtractFields, FieldInputs, FieldType } from '@dfinity/candid';
import { Principal } from '@dfinity/principal';

const actor = createActor('xeka7-ryaaa-aaaal-qb57a-cai', {
  agentOptions: {
    host: 'https://ic0.app',
  },
});

const fields = Actor.interfaceOf(actor as Actor).extractFields();
const args = Actor.interfaceOf(actor as Actor)._fields;
console.log({ args });
interface CandidProps {}

const Candid2: React.FC<CandidProps> = () => {
  return (
    <div
      style={{
        maxWidth: 700,
        width: '100%',
        margin: 'auto',
      }}
    >
      {fields.map(({ functionName, fieldNames, inputs, fields, ...rest }) => {
        console.log({ functionName, fieldNames, inputs, fields, ...rest });
        return (
          <Form key={functionName} inputs={inputs} fields={fields} functionName={functionName} />
        );
      })}
    </div>
  );
};

export default Candid2;

const Form = ({
  fields,
  inputs,
  functionName,
}: {
  inputs:
    | FieldInputs
    | {
        [name: string]: FieldInputs;
      };
  fields: ExtractFields[];
  functionName: string;
}) => {
  const [setSubmitedData, setSubmitedDataState] = React.useState<any>(null);
  const {
    formState: { errors },
    control,
    handleSubmit,
    resetField,
    trigger,
  } = useForm({
    shouldUseNativeValidation: true,
    reValidateMode: 'onChange',
    mode: 'onChange',
    values: {},
  });

  return (
    <form onSubmit={handleSubmit(data => setSubmitedDataState(Object.values(data)[0]))}>
      <div
        style={{
          border: '1px solid black',
          padding: 10,
          marginTop: 10,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <h1>{functionName}</h1>
        {fields.map((field, index) => (
          <div
            key={index}
            style={{
              marginTop: 10,
              border: '1px solid black',
              padding: 10,
            }}
          >
            <FormField
              control={control}
              field={field}
              inputs={inputs}
              resetField={resetField}
              trigger={trigger}
              error={errors[functionName as never]?.[index]}
              registerName={`${functionName}.[${index}]`}
            />
          </div>
        ))}
        {setSubmitedData && (
          <div style={{ marginTop: 10 }}>
            <pre>{JSON.stringify(setSubmitedData, null, 2)}</pre>
          </div>
        )}
        <Button
          type="submit"
          style={{
            marginTop: 10,
            padding: 10,
            fontSize: 15,
          }}
        >
          Submit
        </Button>
      </div>
    </form>
  );
};

const FormField = ({
  field,
  error,
  fieldLabel,
  registerName,
  recursiveNumber = 1,
  ...rest
}: {
  fieldLabel?: string;
  inputs?:
    | FieldInputs
    | {
        [name: string]: FieldInputs;
      };
  recursiveNumber?: number;
  field: ExtractFields;
  registerName: string;
  control: Control<any, any>;
  onRemove?: () => void;
  resetField: UseFormResetField<{}>;
  trigger: UseFormTrigger<{}>;
  error?: any;
}) => {
  switch (field.fieldNames[recursiveNumber]) {
    case 'vector':
      return (
        <ArrayField
          field={field}
          recursiveNumber={recursiveNumber + 1}
          registerName={registerName}
          error={error}
          fieldLabel={fieldLabel}
          {...rest}
        />
      );
    case 'optional':
      return (
        <OptionalField
          field={field}
          fieldLabel={field.fieldNames[recursiveNumber]}
          recursiveNumber={recursiveNumber + 1}
          registerName={registerName}
          error={error}
          {...rest}
        />
      );
    case 'recursive':
      console.log('recursive', registerName, field.fields);
      return (
        <fieldset>
          <legend>{field.label}</legend>
          {field.fields?.map((field, index) => (
            <FormField
              key={index}
              fieldLabel={field.fieldNames[recursiveNumber]}
              registerName={`${registerName}.${field.label}`}
              field={field}
              error={error?.[field.label]}
              {...rest}
            />
          ))}
        </fieldset>
      );
    case 'record':
      return (
        <fieldset>
          <legend>{field.label}</legend>
          {field.fields?.map((field, index) => (
            <FormField
              key={index}
              fieldLabel={field.fieldNames[recursiveNumber]}
              registerName={`${registerName}.${field.label}`}
              field={field}
              error={error?.[field.label]}
              {...rest}
            />
          ))}
        </fieldset>
      );
    case 'tuple':
      return (
        <fieldset>
          <legend>{field.label}</legend>
          {field.fields?.map((field, index) => (
            <FormField
              key={index}
              fieldLabel={field.fieldNames[recursiveNumber]}
              registerName={`${registerName}.[${index}]`}
              field={field}
              error={error?.[index]}
              {...rest}
            />
          ))}
        </fieldset>
      );
    case 'variant':
      return <SelectForm registerName={registerName} fields={field} error={error} {...rest} />;
    default:
      // console.log({ registerName }, rest.inputs);
      return (
        <Input
          {...rest}
          {...rest.control.register(registerName, field)}
          type={field.type}
          label={field.label}
          error={error?.message?.toString()}
          isError={!!error}
          required={field.required}
        />
      );
  }
};

const ArrayField = ({
  control,
  field,
  error,
  registerName,
  recursiveNumber = 1,
  fieldLabel,
  ...rest
}: {
  recursiveNumber?: number;
  control: Control<any, any>;
  registerName: string;
  field: ExtractFields;
  resetField: UseFormResetField<{}>;
  trigger: UseFormTrigger<{}>;
  fieldLabel?: string;
  error?: any;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: registerName as never,
  });

  return (
    <div>
      <label>{fieldLabel}</label>
      <Button style={{ marginBottom: 5, marginTop: 5 }} onClick={() => append('')}>
        +
      </Button>
      {fields.map((item, index) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'start',
            border: '1px dashed black',
            justifyContent: 'space-between',
            marginBottom: 5,
          }}
          key={item.id}
        >
          <FormField
            field={field}
            error={error?.[index]}
            control={control}
            registerName={`${registerName}.[${index}]`}
            recursiveNumber={recursiveNumber}
            {...rest}
          />
          <Button
            style={{
              height: 35,
              width: 35,
              marginLeft: 10,
            }}
            onClick={() => remove(index)}
          >
            x
          </Button>
        </div>
      ))}
    </div>
  );
};

const OptionalField = ({
  control,
  field,
  error,
  recursiveNumber = 1,
  registerName,
  fieldLabel,
  ...rest
}: {
  recursiveNumber?: number;
  control: Control<any, any>;
  field: ExtractFields;
  registerName: string;
  resetField: UseFormResetField<{}>;
  trigger: UseFormTrigger<{}>;
  fieldLabel: string;
  error?: any;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: registerName as never,
  });

  return (
    <div>
      <label htmlFor={registerName}>{fieldLabel}</label>
      <input
        type="checkbox"
        id={registerName}
        onChange={e => (e.target.checked ? append('') : remove(0))}
      />
      {fields.length > 0 && (
        <FormField
          field={field}
          error={error?.[0]}
          control={control}
          registerName={`${registerName}.[0]`}
          recursiveNumber={recursiveNumber}
          {...rest}
        />
      )}
    </div>
  );
};

const SelectForm = ({
  fields,
  registerName,
  control,
  resetField,
  error,
  ...rest
}: {
  registerName: string;
  fields: ExtractFields;
  resetField: UseFormResetField<{}>;
  trigger: UseFormTrigger<{}>;
  control: Control<any, any>;
  error?: any;
}) => {
  const [value, setValue] = React.useState(fields.options?.[0]);

  const field = fields.fields?.find(({ label }) => label === value) as ExtractFields;
  console.log({ error });
  return (
    <div>
      <label>Variant</label>
      <select
        onChange={e => {
          resetField(`${registerName}.${value}` as never);
          control.unregister(registerName);
          setValue(e.target.value);
        }}
      >
        {fields.options?.map((label, index) => (
          <option key={index} value={label}>
            {label}
          </option>
        ))}
      </select>
      <FormField
        fieldLabel={field.label}
        registerName={`${registerName}.${value}`}
        field={field}
        resetField={resetField}
        control={control}
        error={error?.[value as never]}
        {...rest}
      />
    </div>
  );
};

interface MyComponentProps {
  label: string;
  type: FieldType;
  name: string;
  required?: boolean;
  isError?: boolean;
  error?: string;
  trigger: UseFormTrigger<{}>;
  resetField: UseFormResetField<{}>;
}

const Input: React.FC<MyComponentProps> = React.forwardRef(
  ({ label, resetField, trigger, isError, name, type, required, error, ...rest }, ref) => {
    return (
      <div style={{ width: '100%', padding: 5 }}>
        <label htmlFor={name}>
          {label}
          {required && <span style={{ color: 'red' }}>*</span>}
          {error && <span style={{ color: 'red', margin: 0, fontSize: 8 }}>({error})</span>}
        </label>
        <div
          style={{
            position: 'relative',
          }}
        >
          <input
            style={{
              width: '100%',
              height: 30,
              paddingLeft: 10,
              paddingRight: 30,
              border: !!isError ? '1px solid red' : '1px solid black',
              boxSizing: 'border-box',
            }}
            id={name}
            name={name}
            type={type}
            placeholder={type}
            ref={ref as never}
            {...rest}
          />
          {type !== 'checkbox' && (
            <Button
              style={{
                position: 'absolute',
                right: 0,
                top: '40%',
                transform: 'translateY(-50%)',
                height: 30,
                width: 30,
                background: 'transparent',
                color: 'red',
              }}
              onClick={() => {
                resetField(name as never);
                trigger(name as never, { shouldFocus: true });
              }}
            >
              x
            </Button>
          )}
        </div>
      </div>
    );
  },
);

interface ButtonProps {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  background?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  style,
  children,
  type = 'button',
  background = 'black',
}) => (
  <button
    type={type}
    style={{
      padding: 5,
      paddingBottom: 10,
      width: '100%',
      borderRadius: 0,
      background,
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontSize: 20,
      fontFamily: 'monospace',
      ...style,
    }}
    onClick={onClick}
  >
    {children}
  </button>
);
