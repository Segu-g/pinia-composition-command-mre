import { StateTree } from 'pinia';

import {
  Command,
  CommandDispatch,
  CommandableState,
  defSingleStateCommand,
  unwrapCommand,
} from './command-interface';
import { useSingleStateContext, useStateContext } from './definition';
import { Action, Dispatch } from './interface';

export { defineHistory, defineCommandableStateStore } from './command-history';

const templateNonRecordCommandDispatch =
  (dispatch: Dispatch): CommandDispatch =>
  <Payloads extends unknown[], Ret>(
    command: Command<Payloads, Ret>,
    ...payloads: Payloads
  ): Ret => {
    return dispatch(asNonRecordAct(command), ...payloads);
  };
const asNonRecordAct = <Payloads extends unknown[], Ret>(
  command: Command<Payloads, Ret>,
) => {
  return Action<Payloads, Ret>((ctx, ...payloads) =>
    unwrapCommand(command)(
      {
        ...ctx,
        record: ctx.commit,
        commandDispatch: templateNonRecordCommandDispatch(ctx.dispatch),
      },
      ...payloads,
    ),
  );
};

function useCommandUtil() {
  return {
    asNonRecordAct: <Payloads extends unknown[], Ret>(
      command: Command<Payloads, Ret>,
    ) => {
      return Action<Payloads, Ret>((ctx, ...payloads) =>
        unwrapCommand(command)(
          {
            ...ctx,
            record: ctx.commit,
            commandDispatch: templateNonRecordCommandDispatch(ctx.dispatch),
          },
          ...payloads,
        ),
      );
    },
  };
}

export function useCommandContext() {
  return {
    defCmd: Command,
    ...useStateContext(),
    ...useCommandUtil(),
  };
}

export function useSingleCommandContext<Id extends string, S extends StateTree>(
  state: CommandableState<Id, S>,
) {
  return {
    defCmd: defSingleStateCommand(state),
    ...useSingleStateContext(state),
    ...useCommandUtil(),
  };
}
