export const debouncePress = (callback: () => void, delay: number = 800) => {
  let lastPressTime = 0;

  return () => {
    const now = Date.now();
    if (now - lastPressTime > delay) {
      lastPressTime = now;
      callback();
    }
  };
};
