import { configureStore, createSlice } from '@reduxjs/toolkit';
import {
	createPatchedAction,
	createPatchActionMiddleware,
	createPatchedPayloadAction,
} from './';

interface RootState {
	amount: number;
	extra: number;
}

describe('patchActionMiddleware', () => {
	const createAppPatchedAction = createPatchedAction<RootState>();
	const createAppPatchedPayloadAction =
		createPatchedPayloadAction<RootState>();
	const patchedAppIncrement = createAppPatchedAction<{ amount: number }>(
		'test/app-increment',
		(action, state) => ({
			...action,
			payload: {
				amount: action.payload.amount + state.extra + state.amount,
			},
		}),
	);
	const patchedIncrement = createPatchedAction<RootState, { amount: number }>(
		'test/increment',
		(action, state) => ({
			...action,
			payload: {
				amount: action.payload.amount + state.extra + state.amount,
			},
		}),
	);
	const payloadPatchedAppIncrement = createAppPatchedPayloadAction<{
		amount: number;
	}>('test/app-payload-increment', (payload, state) => ({
		amount: payload.amount + state.extra + state.amount,
	}));
	const payloadPatchedIncrement = createPatchedPayloadAction<
		RootState,
		{ amount: number }
	>('test/payload-increment', (payload, state) => ({
		amount: payload.amount + state.extra + state.amount,
	}));

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
					state.amount = action.payload.amount;
				})
				.addCase(patchedIncrement, (state, action) => {
					state.amount = action.payload.amount;
				})
				.addCase(payloadPatchedAppIncrement, (state, action) => {
					state.amount = action.payload.amount;
				})
				.addCase(payloadPatchedIncrement, (state, action) => {
					state.amount = action.payload.amount;
				});
		},
	});
	const store = configureStore({
		reducer: testSlice.reducer,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware().concat(createPatchActionMiddleware()),
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
});
