import * as React from 'react';
import {
    ChangeEvent,
    createContext,
    isValidElement,
    ReactElement,
    useContext,
    useState,
} from 'react';
import { Identifier, useTranslate } from 'ra-core';

/**
 * This hook provides support for suggestion creation in inputs which have choices.
 *
 * @param options The hook option
 * @param {ReactElement} options.create A react element which will be rendered when users choose to create a new choice. This component must call the `useCreateSuggestion` hook which provides `onCancel`, `onCreate` and `filter`. See the examples.
 * @param {String} options.createLabel Optional. The label for the choice item allowing users to create a new choice. Can be a translation key. Defaults to `ra.action.create`.
 * @param {String} options.createItemLabel Optional. The label for the choice item allowing users to create a new choice when they already entered a filter. Can be a translation key. The translation will receive an `item` parameter. Defaults to `ra.action.create_item`.
 * @param {any} options.createValue Optional. The value for the choice item allowing users to create a new choice. Defaults to `@@ra-create`.
 * @param {String} options.filter Optional. The filter users may have already entered. Useful for autocomplete inputs for example.
 * @param {OnCreateHandler} options.onCreate Optional. A function which will be called when users choose to create a new choice, if the `create` option wasn't provided.
 * @param handleChange: a function to pass to the input. Receives the same parameter as the original event handler and an additional newItem parameter if a new item was create.
 * @returns {UseSupportCreateValue} An object with the following properties:
 * - getCreateItem: a function which will return the label of the choice for create a new choice.
 * - createElement: a React element to render after the input. It will be rendered when users choose to create a new choice. It renders null otherwise.
 */
export const useSupportCreateSuggestion = (
    options: SupportCreateSuggestionOptions
): UseSupportCreateValue => {
    const {
        create,
        createLabel = 'ra.action.create',
        createItemLabel = 'ra.action.create_item',
        createValue = '@@ra-create',
        filter,
        handleChange,
        onCreate,
    } = options;
    const translate = useTranslate();
    const [renderOnCreate, setRenderOnCreate] = useState(false);

    const context = {
        filter,
        onCancel: () => setRenderOnCreate(false),
        onCreate: (value, item) => {
            setRenderOnCreate(false);
            handleChange(undefined, item);
        },
    };

    return {
        getCreateItem: () => {
            return {
                id: createValue,
                name:
                    filter && createItemLabel
                        ? translate(createItemLabel, {
                              item: filter,
                              _: createItemLabel,
                          })
                        : translate(createLabel, { _: createLabel }),
            };
        },
        handleChange: async eventOrValue => {
            const value = eventOrValue.target?.value || eventOrValue;
            if (value?.id === createValue || value === createValue) {
                if (!isValidElement(create)) {
                    const newSuggestion = await onCreate(filter);

                    if (newSuggestion) {
                        handleChange(eventOrValue, newSuggestion);
                        return;
                    }
                } else {
                    setRenderOnCreate(true);
                    return;
                }
            }
            handleChange(eventOrValue, undefined);
        },
        createElement:
            renderOnCreate && isValidElement(create) ? (
                <CreateSuggestionContext.Provider value={context}>
                    {create}
                </CreateSuggestionContext.Provider>
            ) : null,
    };
};

export interface SupportCreateSuggestionOptions {
    create?: ReactElement;
    createValue?: string;
    createLabel?: string;
    createItemLabel?: string;
    filter?: string;
    handleChange: (value: any, newChoice: any) => void;
    onCreate?: OnCreateHandler;
}

export interface UseSupportCreateValue {
    getCreateItem: () => { id: Identifier; name: string };
    handleChange: (eventOrValue: ChangeEvent | any) => Promise<void>;
    createElement: ReactElement | null;
}

const CreateSuggestionContext = createContext<CreateSuggestionContextValue>(
    undefined
);

interface CreateSuggestionContextValue {
    filter?: string;
    onCreate: (value: any, choice: any) => void;
    onCancel: () => void;
}
export const useCreateSuggestion = () => useContext(CreateSuggestionContext);

export type OnCreateHandler = (filter?: string) => any | Promise<any>;