import {
	AnyAction,
	createAction,
	PayloadAction,
	MiddlewareAPI,
	Dispatch,
	ActionCreatorWithPreparedPayload,
} from '@reduxjs/toolkit';

export type ActionPatcher<S, IP, OP> = (
	action: PayloadAction<IP>,
	state: S,
) => Omit<PayloadAction<OP>, 'type'>;

const actionPatchers = new Map<string, ActionPatcher<any, any, any>>();

export function createPatchedAction<S>(): <
	IP,
	OP = IP,
	T extends string = string,
>(
	type: T,
	actionPatcher: ActionPatcher<S, IP, OP>,
) => ActionCreatorWithPreparedPayload<[payload: IP], OP, T>;

export function createPatchedAction<S, IP, OP = IP, T extends string = string>(
	type: T,
	actionPatcher: ActionPatcher<S, IP, OP>,
): ActionCreatorWithPreparedPayload<[payload: IP], OP, T>;

export function createPatchedAction<S, IP, OP = IP, T extends string = string>(
	typeOrUndefined?: T,
	actionPatcher?: ActionPatcher<S, IP, OP>,
) {
	if (!typeOrUndefined || !actionPatcher) {
		return <IP2, OP2 = IP2, T2 extends string = string>(
			type: T2,
			actionPatcher: ActionPatcher<S, IP2, OP2>,
		) => {
			actionPatchers.set(type, actionPatcher);
			return createAction(type) as ActionCreatorWithPreparedPayload<
				[payload: IP2],
				OP2,
				T2
			>;
		};
	}
	actionPatchers.set(typeOrUndefined, actionPatcher);
	return createAction(typeOrUndefined) as ActionCreatorWithPreparedPayload<
		[payload: IP],
		OP,
		T
	>;
}

export function createPatchedPayloadAction<S>(): <
	IP,
	OP = IP,
	T extends string = string,
>(
	type: T,
	payloadPatcher: (payload: IP, state: S) => OP,
) => ActionCreatorWithPreparedPayload<[payload: IP], OP, T>;

export function createPatchedPayloadAction<
	S,
	IP,
	OP = IP,
	T extends string = string,
>(
	type: T,
	payloadPatcher: (payload: IP, state: S) => OP,
): ActionCreatorWithPreparedPayload<[payload: IP], OP, T>;

export function createPatchedPayloadAction<
	S,
	IP,
	OP = IP,
	T extends string = string,
>(typeOrUndefined?: T, payloadPatcher?: (payload: IP, state: S) => OP) {
	if (!typeOrUndefined || !payloadPatcher) {
		return <IP2, OP2 = IP2, T2 extends string = string>(
			type: T2,
			payloadPatcher: (payload: IP2, state: S) => OP2,
		) => {
			actionPatchers.set(type, (action, state) => ({
				...action,
				payload: payloadPatcher(action.payload, state),
			}));
			return createAction(type) as ActionCreatorWithPreparedPayload<
				[payload: IP2],
				OP2,
				T2
			>;
		};
	}
	actionPatchers.set(typeOrUndefined, (action, state) => ({
		...action,
		payload: payloadPatcher(action.payload, state),
	}));
	return createAction(typeOrUndefined) as ActionCreatorWithPreparedPayload<
		[payload: IP],
		OP,
		T
	>;
}

export function createPatchActionMiddleware<S>() {
	return (api: MiddlewareAPI<Dispatch<AnyAction>, S>) =>
		(next: Dispatch<AnyAction>) =>
		(action: PayloadAction<any>) => {
			const patcher = actionPatchers.get(action.type);
			if (patcher) {
				const patchedFields = patcher(action, api.getState());
				action = {
					...patchedFields,
					type: action.type,
				};
			}
			return next(action);
		};
}
