# redux-patch-action-middleware

[![npm version](https://badge.fury.io/js/redux-patch-action-middleware.svg)](https://badge.fury.io/js/redux-patch-action-middleware)

A Redux middleware that allows you to patch action payloads based on the current state before they reach reducers. This solves the common problem of accessing data from one reducer in another reducer, without breaking the Redux pattern or creating complex selector chains.

For example, you can modify an action's payload based on the current state of any slice before it reaches its target reducer. This is particularly useful when you need to:
- Validate or transform data using state from other reducers
- Enforce business rules that depend on multiple parts of your state
- Maintain reducer independence while still allowing cross-slice data access

## Features

- Patch action payloads using the current state
- TypeScript support with full type inference
- Works with Redux Toolkit
- Minimal boilerplate
- Flexible API supporting both curried and direct usage
- Access any part of the state when handling actions

## Installation

```bash
npm install redux-patch-action-middleware
```

## Usage

### Basic Setup

First, add the middleware to your Redux store:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { createPatchActionMiddleware } from 'redux-patch-action-middleware';

export const patchActionMiddleware = createPatchActionMiddleware<RootState>();

const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware()
                .concat(patchActionMiddleware.middleware)
});
```

### Creating Patched Actions

There are two main ways to create patched actions:

#### 1. Using Instance-Specific Action Creators

The middleware instance provides its own action creators that are scoped to that instance:

```typescript
// These actions will only work with this specific middleware instance
const incrementByAmount = patchActionMiddleware.createPatchedAction(
    'counter/incrementByAmount',
    (action: PayloadAction<{ amount: number }>, state) => ({
        ...action,
        payload: {
            amount: Math.min(action.payload.amount, state.counter.maxIncrement)
        }
    })
);

// Similarly for payload-only patching
const updateUser = patchActionMiddleware.createPatchedPayloadAction(
    'users/update',
    (payload: { id: string; data: UserData }, state) => ({
        id: payload.id,
        data: {
            ...payload.data,
            lastModified: state.app.currentTimestamp
        }
    })
);
```

#### 2. Using Global Action Creators


```typescript
import { createPatchedAction, createPatchedPayloadAction } from 'redux-patch-action-middleware';
import { PayloadAction } from '@reduxjs/toolkit';

const incrementByAmount = createPatchedAction(
    'counter/incrementByAmount',
    (action: PayloadAction<{ amount: number }>, state: RootState) => ({
        ...action,
        payload: {
            amount: Math.min(action.payload.amount, state.counter.maxIncrement)
        }
    })
);

const incrementByAmount = createPatchedPayloadAction(
    'counter/incrementByAmount',
    (payload: { amount: number }, state: RootState) => ({
        amount: Math.min(payload.amount, state.counter.maxIncrement)
    })
);
```

### Dispatching Actions

Use the created action creators like any other Redux action:

```typescript
// Dispatch the action
dispatch(incrementByAmount({ amount: 10 }));
```

### Working with Redux

The middleware integrates seamlessly with Redux and Redux Toolkit. Here's how to use it with different Redux patterns:

#### With createSlice

```typescript
import { createSlice } from '@reduxjs/toolkit';

// Create your patched action
const incrementByAmount = patchActionMiddleware.createPatchedAction(
    'counter/incrementByAmount',
    (action: PayloadAction<number>, state) => ({
        ...action,
        payload: Math.min(action.payload, state.settings.maxIncrement)
    })
);

// Use it in your slice
const counterSlice = createSlice({
    name: 'counter',
    initialState: { value: 0 },
    reducers: {
        // Regular reducers here
    },
    extraReducers: (builder) => {
        builder.addCase(incrementByAmount, (state, action) => {
            // action.payload is already patched here
            state.value += action.payload;
        });
    }
});
```

#### With Redux Thunks

```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';

const updateUserData = patchActionMiddleware.createPatchedPayloadAction(
    'users/updateData',
    (payload: UserData, state: RootState) => ({
        ...payload,
        lastModified: state.app.timestamp
    })
);

// Use in thunks
const saveUser = createAsyncThunk(
    'users/save',
    async (userData: UserData, { dispatch }) => {
        // The action will be patched before reaching reducers
        dispatch(updateUserData(userData));
        // ... rest of thunk logic
    }
);
```

## API Reference

### `createPatchActionMiddleware<S>()`

Creates the middleware instance for your store.

- `S`: The type of your root state

### `createPatchedAction<S>()`

Creates an action creator with full action patching capabilities.

- `S`: The type of your root state
- Returns a function that accepts:
  - `type`: The action type string
  - `actionPatcher`: A function that receives the original action and state, and returns the patched action

### `createPatchedPayloadAction<S>()`

Creates an action creator with simplified payload-only patching.

- `S`: The type of your root state
- Returns a function that accepts:
  - `type`: The action type string
  - `payloadPatcher`: A function that receives the original payload and state, and returns the patched payload

## TypeScript Support

The library is written in TypeScript and provides full type inference. Generic type parameters allow you to specify:

- Your root state type
- Input payload type
- Output payload type (if different from input)
- Action type string

### TypeScript Usage Examples

Create reusable patched action creators for your app:

```typescript
// Create app-wide patched action creators
const createAppPatchedAction = createPatchedAction<RootState>();
const createAppPatchedPayloadAction = createPatchedPayloadAction<RootState>();

// Use them throughout your app with full type inference
const updateUser = createAppPatchedAction(
    'users/update',
    (action: PayloadAction<{ id: string; data: Partial<User> }>, state) => ({
        ...action,
        payload: {
            id: action.payload.id,
            data: {
                ...state.users[action.payload.id],
                ...action.payload.data
            }
        }
    })
);

// Simplified payload-only version
const updateCounter = createAppPatchedPayloadAction(
    'counter/update',
    (payload: { value: number }, state) => ({
        value: Math.min(payload.value, state.counter.maxValue)
    })
);
```

### Creating App-Wide Action Patchers

You can create a strongly-typed `AppActionPatcher` for your application by providing your `RootState` type:

```typescript
// Define your app-specific ActionPatcher type
type AppActionPatcher<P, IP> = ActionPatcher<RootState, P, IP>;

const createAppActionPatcher: <P, IP>(
	actionPatcher: AppActionPatcher<P, IP>,
) => AppActionPatcher<P, IP> = createActionPatcher;

// Or you can use the simpler PayloadPatcher type
const createAppPayloadActionPatcher: <P, IP>(
	payloadPatcher: PayloadPatcher<RootState, P, IP>,
) => AppActionPatcher<P, IP> = createPayloadPatcher;

// Then you can use these patchers in your actions

const amountPatcher = createAppActionPatcher(
    (action: PayloadAction<{ amount: number }>, state) => {
        return {
            ...action,
            payload: {
                patchedAmount:
                    action.payload.amount + state.amount,
            },
        };
    },
);
const amountPayloadPatcher = createAppPayloadActionPatcher(
    (payload: { amount: number }, state) => {
        return {
            patchedAmount: payload.amount + state.amount,
        };
    },
);

// Or just create reusable action patchers with proper typing
const validateAmount = (action: PayloadAction<{ amount: number }>, state: RootState) => ({
    ...action,
    payload: {
        amount: Math.min(action.payload.amount, state.settings.maxAmount)
    }
});

const ensureUserExists = (action: PayloadAction<{ userId: string; data: Partial<User> }>, state: RootState) => ({
    ...action,
    payload: {
        userId: action.payload.userId,
        data: {
            ...action.payload.data,
            user: state.users[action.payload.userId] ?? 
                { id: action.payload.userId }
        }
    }
});

// Use these typed patchers across your application
const incrementCounter = createPatchedAction(
    'counter/increment', 
    validateAmount
);
const addToBalance = createPatchedAction(
    'wallet/add', 
    validateAmount
);
const updateUserProfile = createPatchedAction(
    'users/updateProfile', 
    ensureUserExists
);
const updateUserSettings = createPatchedAction(
    'users/updateSettings', 
    ensureUserExists
);
```

This approach provides several benefits:
- Full type inference for state access
- Consistent typing across all action patchers
- Reduced type declaration boilerplate
- Better IDE support and type checking


## Future Plans

### Planned Features

#### Action Creator Integration
- Allow passing action creators directly to patchers for tighter integration
- Add utilities to patch actions directly in middleware configuration without component awareness

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
