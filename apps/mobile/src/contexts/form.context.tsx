import { createContext, PropsWithChildren, useContext } from "react";
import {
    type Control,
    type DefaultValues,
    type FieldValues,
    type Resolver,
    type UseFormGetValues,
    type UseFormReset,
    type UseFormSetValue,
    useForm
} from "react-hook-form";

export interface FormContextValue<T extends FieldValues> {
    control: Control<T>;
    isValid: boolean;
    submit: () => void;
    getValues: UseFormGetValues<T>;
    setValue: UseFormSetValue<T>;
    reset: UseFormReset<T>;
    values: T;
}

export const FormContext = createContext<FormContextValue<any> | undefined>(undefined);

interface FormProviderProps<T extends FieldValues> extends PropsWithChildren {
    onSubmit: (data: T) => void;
    resolver: Resolver<T>;
    defaultValues?: DefaultValues<T>;
}

export const AppFormProvider = <T extends FieldValues>({
    children,
    onSubmit,
    resolver,
    defaultValues,
}: FormProviderProps<T>) => {
    const {
        handleSubmit,
        control,
        formState: { isValid },
        getValues,
        setValue,
        reset,
        watch,
    } = useForm<T>({ resolver, mode: "onChange", defaultValues });


    const values = watch();
    return (
        <FormContext.Provider
            value={{
                control: control as Control<any>,
                isValid,
                submit: handleSubmit(onSubmit),
                getValues,
                setValue,
                reset,
                values,
            }}
        >
            {children}
        </FormContext.Provider>
    );
};

export const useAppFormContext = <T extends FieldValues>() => {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error("useAppFormContext must be used within a FormProvider");
    }
    return context as FormContextValue<T>;
};
