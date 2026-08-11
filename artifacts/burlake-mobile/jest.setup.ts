// React 18+ requires this global flag to be set to `true` for act() and
// waitFor() to work correctly in the test environment.
// @ts-ignore — IS_REACT_ACT_ENVIRONMENT is not in the TS types
global.IS_REACT_ACT_ENVIRONMENT = true;
