import * as React from 'react';
import { IStrings, DEFAULT_STRINGS } from './strings';

const StringsContext = React.createContext<IStrings>(DEFAULT_STRINGS);

export const StringsProvider = StringsContext.Provider;

/** Consume localized strings anywhere in the component tree. */
export const useStrings = (): IStrings => React.useContext(StringsContext);
