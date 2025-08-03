// Mock lodash.debounce so it calls immediately
jest.mock("lodash.debounce", () => {
  const mockDebounce = (fn) => {
    const debouncedFn = (...args) => fn(...args);
    debouncedFn.cancel = jest.fn();
    debouncedFn.flush = jest.fn();
    return debouncedFn;
  };
  return mockDebounce;
});

require("react-native-reanimated").setUpTests();
