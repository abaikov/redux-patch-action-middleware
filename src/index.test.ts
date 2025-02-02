import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
	createPatchedAction,
	createPatchActionMiddleware,
	createPatchedPayloadAction,
	ActionPatcher,
	createActionPatcher,
	createPayloadPatcher,
	PayloadPatcher,
} from './';

interface RootState {
	amount: number;
	extra: number;
}

const createAppActionPatcher: <P, IP>(
	actionPatcher: ActionPatcher<RootState, P, IP>,
) => ActionPatcher<RootState, P, IP> = createActionPatcher;

const createAppPayloadActionPatcher: <P, IP>(
	payloadPatcher: PayloadPatcher<RootState, P, IP>,
) => PayloadPatcher<RootState, P, IP> = createPayloadPatcher;

describe('patchActionMiddleware', () => {
	const patchActionMiddleware = createPatchActionMiddleware<RootState>();
	const createAppPatchedAction = createPatchedAction<RootState>();
	const createAppPatchedPayloadAction =
		createPatchedPayloadAction<RootState>();
	const amountPatcher = createAppActionPatcher(
		(action: PayloadAction<{ amount: number }>, state) => {
			return {
				...action,
				payload: {
					patchedAmount:
						action.payload.amount + state.extra + state.amount,
				},
			};
		},
	);
	const amountPayloadPatcher = createAppPayloadActionPatcher(
		(payload: { amount: number }, state) => {
			return {
				patchedAmount: payload.amount + state.extra + state.amount,
			};
		},
	);

	const patchedAppIncrement = createAppPatchedAction(
		'test/app-increment',
		(action: PayloadAction<{ amount: number }>, state) => {
			return {
				...action,
				payload: {
					patchedAmount:
						action.payload.amount + state.extra + state.amount,
				},
			};
		},
	);
	const patchedIncrement = createPatchedAction(
		'test/increment',
		amountPatcher,
	);
	const payloadPatchedAppIncrement = createAppPatchedPayloadAction(
		'test/app-payload-increment',
		(payload: { amount: number }, state) => ({
			patchedAmount: payload.amount + state.extra + state.amount,
		}),
	);
	const payloadPatchedIncrement = createPatchedPayloadAction(
		'test/payload-increment',
		amountPayloadPatcher,
	);
	const localPatchedIncrement = patchActionMiddleware.createPatchedAction(
		'test/local-increment',
		amountPatcher,
	);
	const localPatchedPayloadIncrement =
		patchActionMiddleware.createPatchedPayloadAction(
			'test/local-payload-increment',
			amountPayloadPatcher,
		);

	const testSlice = createSlice({
		name: 'test',
		initialState: { amount: 0, extra: 2 },
		reducers: {
			reset: (state) => {
				state.amount = 0;
				state.extra = 2;
			},
		},
		extraReducers: (builder) => {
			builder
				.addCase(patchedAppIncrement, (state, action) => {
					state.amount = action.payload.patchedAmount;
				})
				.addCase(patchedIncrement, (state, action) => {
					state.amount = action.payload.patchedAmount;
				})
				.addCase(payloadPatchedAppIncrement, (state, action) => {
					state.amount = action.payload.patchedAmount;
				})
				.addCase(localPatchedIncrement, (state, action) => {
					state.amount = action.payload.patchedAmount;
				})
				.addCase(localPatchedPayloadIncrement, (state, action) => {
					state.amount = action.payload.patchedAmount;
				})
				.addCase(payloadPatchedIncrement, (state, action) => {
					state.amount = action.payload.patchedAmount;
				});
		},
	});
	const store = configureStore({
		reducer: testSlice.reducer,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware().concat(patchActionMiddleware.middleware),
	});

	beforeEach(() => {
		store.dispatch(testSlice.actions.reset());
		expect(store.getState().extra).toBe(2);
		expect(store.getState().amount).toBe(0);
	});

	it('test patchedAppIncrement', () => {
		store.dispatch(patchedAppIncrement({ amount: 2 }));
		expect(store.getState().amount).toBe(4);
		expect(store.getState().extra).toBe(2);
		store.dispatch(patchedAppIncrement({ amount: 2 }));
		expect(store.getState().amount).toBe(8);
		expect(store.getState().extra).toBe(2);
	});

	it('test patchedIncrement', () => {
		store.dispatch(patchedIncrement({ amount: 2 }));
		expect(store.getState().amount).toBe(4);
		expect(store.getState().extra).toBe(2);
		store.dispatch(patchedIncrement({ amount: 2 }));
		expect(store.getState().amount).toBe(8);
		expect(store.getState().extra).toBe(2);
	});

	it('test payloadPatchedAppIncrement', () => {
		store.dispatch(payloadPatchedAppIncrement({ amount: 2 }));
		expect(store.getState().amount).toBe(4);
		expect(store.getState().extra).toBe(2);
		store.dispatch(payloadPatchedAppIncrement({ amount: 2 }));
		expect(store.getState().amount).toBe(8);
		expect(store.getState().extra).toBe(2);
	});

	it('test payloadPatchedIncrement', () => {
		store.dispatch(payloadPatchedIncrement({ amount: 2 }));
		expect(store.getState().amount).toBe(4);
		expect(store.getState().extra).toBe(2);
		store.dispatch(payloadPatchedIncrement({ amount: 2 }));
		expect(store.getState().amount).toBe(8);
		expect(store.getState().extra).toBe(2);
	});

	it('test localPatchedIncrement', () => {
		store.dispatch(localPatchedIncrement({ amount: 2 }));
		expect(store.getState().amount).toBe(4);
		expect(store.getState().extra).toBe(2);
	});

	it('test localPatchedPayloadIncrement', () => {
		store.dispatch(localPatchedPayloadIncrement({ amount: 2 }));
		expect(store.getState().amount).toBe(4);
		expect(store.getState().extra).toBe(2);
	});
});
