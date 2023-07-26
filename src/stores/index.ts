import { useCounter as _useCounter } from './countStore';
import { useText as _useText } from './textStore';
import { toReadonlyStoreDefinition } from './storeHelper';

export const useCounter = toReadonlyStoreDefinition(_useCounter);
export const useText = toReadonlyStoreDefinition(_useText);
