import * as React from 'react'
import { useMutation as useConvexMutation } from 'convex/react'
import type {
  FunctionReference,
  FunctionReturnType,
  OptionalRestArgs,
} from 'convex/server'
import { ConvexError } from 'convex/values'

type UseMutationBase<Mutation extends FunctionReference<'mutation'>> = {
  mutate: (...args: OptionalRestArgs<Mutation>) => void
  mutateAsync: (
    ...args: OptionalRestArgs<Mutation>
  ) => Promise<FunctionReturnType<Mutation>>
  reset: () => void
}

type IdleState = {
  status: 'idle'
  data: undefined
  error: undefined
}

type PendingState = {
  status: 'pending'
  data: undefined
  error: undefined
}

type ErrorState<Mutation extends FunctionReference<'mutation'>> = {
  status: 'error'
  data: undefined
  error: ConvexError<Awaited<FunctionReturnType<Mutation>>>
}

type SuccessState<Mutation extends FunctionReference<'mutation'>> = {
  status: 'success'
  data: Awaited<FunctionReturnType<Mutation>>
  error: undefined
}

type MutationState<Mutation extends FunctionReference<'mutation'>> =
  | IdleState
  | PendingState
  | ErrorState<Mutation>
  | SuccessState<Mutation>

export const useMutation = <Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation,
): UseMutationBase<Mutation> & MutationState<Mutation> => {
  const [state, setState] = React.useState<MutationState<Mutation>>({
    status: 'idle',
    data: undefined,
    error: undefined,
  })

  const requestCount = React.useRef(0)

  const originalMutation = useConvexMutation(mutation)

  const mutateAsync = async (...args: OptionalRestArgs<Mutation>) => {
    requestCount.current += 1
    const currentCount = requestCount.current

    setState({ status: 'pending', data: undefined, error: undefined })
    try {
      const data = await originalMutation(...args)

      if (currentCount === requestCount.current) {
        setState({ status: 'success', data, error: undefined })
      }
      return data
    } catch (err) {
      if (currentCount === requestCount.current) {
        const error =
          err instanceof ConvexError
            ? err
            : new ConvexError('An error occurred')
        setState({ status: 'error', data: undefined, error })
      }
    }
  }

  const mutate = (...args: OptionalRestArgs<Mutation>) => {
    mutateAsync(...args)
  }

  const reset = () => {
    setState({ status: 'idle', data: undefined, error: undefined })
  }

  return {
    mutate,
    mutateAsync,
    reset,
    ...state,
  }
}
