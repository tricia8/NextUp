/* export const debouncePress = (callback: () => void, delay: number = 800) => {
  let lastPressTime = 0;

  return () => {
    const now = Date.now();
    if (now - lastPressTime > delay) {
      lastPressTime = now;
      callback();
    }
  };
}; */

export const debouncePress = <T extends any[]>(
  callback: (...args: T) => Promise<void> | void,
  delay: number = 800
) => {
  let lastPressTime = 0;

  return (...args: T) => {
    const now = Date.now();
    if (now - lastPressTime > delay) {
      lastPressTime = now;
      return callback(...args);
    }
  };
};
