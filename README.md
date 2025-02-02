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

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(createPatchActionMiddleware<RootState>())
});
```

### Creating Patched Actions

There are two main ways to create patched actions:

#### 1. Using `createPatchedAction`

This method gives you full control over the action object:

```typescript
import { createPatchedAction } from 'redux-patch-action-middleware';

// Curried usage
const createPatchedActionWithState = createPatchedAction<RootState>();

const incrementByAmount = createPatchedActionWithState<{ amount: number }>(
  'counter/incrementByAmount',
  (action, state) => ({
    ...action,
    payload: {
      amount: Math.min(action.payload.amount, state.counter.maxIncrement)
    }
  })
);

// Direct usage
const incrementByAmount = createPatchedAction<RootState, { amount: number }>(
  'counter/incrementByAmount',
  (action, state) => ({
    ...action,
    payload: {
      amount: Math.min(action.payload.amount, state.counter.maxIncrement)
    }
  })
);
```

#### 2. Using `createPatchedPayloadAction`

This is a simplified version that only focuses on patching the payload:

```typescript
import { createPatchedPayloadAction } from 'redux-patch-action-middleware';

// Curried usage
const createPatchedPayloadActionWithState = createPatchedPayloadAction<RootState>();

const incrementByAmount = createPatchedPayloadActionWithState<{ amount: number }>(
  'counter/incrementByAmount',
  (payload, state) => ({
    amount: Math.min(payload.amount, state.counter.maxIncrement)
  })
);

// Direct usage
const incrementByAmount = createPatchedPayloadAction<RootState, { amount: number }>(
  'counter/incrementByAmount',
  (payload, state) => ({
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
const updateUser = createAppPatchedAction<{ id: string; data: Partial<User> }, { id: string; data: User }>(
  'users/update',
  (action, state) => ({
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
const updateCounter = createAppPatchedPayloadAction<{ value: number }>(
  'counter/update',
  (payload, state) => ({
    value: Math.min(payload.value, state.counter.maxValue)
  })
);
```

### Using with Redux Toolkit Reducers

The patched actions work seamlessly with Redux Toolkit's `createSlice` and builder pattern. You can use them in both `reducers` and `extraReducers`:

```typescript
import { createSlice } from '@reduxjs/toolkit';
import { createPatchedPayloadAction } from 'redux-patch-action-middleware';

// Create a patched action
const incrementByAmount = createPatchedPayloadAction<RootState, { amount: number }>(
  'counter/incrementByAmount',
  (payload, state) => ({
    amount: Math.min(payload.amount, state.settings.maxIncrement)
  })
);

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    // Regular reducers here
  },
  extraReducers: (builder) => {
    // Add the patched action using builder
    builder.addCase(incrementByAmount, (state, action) => {
      // action.payload.amount will already be patched here
      state.value += action.payload.amount;
    });
  }
});
```

The middleware will process the action before it reaches the reducer, so your reducer will receive the patched payload. This allows you to:
- Keep your reducers focused on state updates
- Handle cross-slice logic in the action patcher
- Maintain clean separation of concerns

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
