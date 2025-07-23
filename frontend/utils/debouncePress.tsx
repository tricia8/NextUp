let lastPressTime = 0;

export const debouncePress = (callback: () => void, delay: number = 800) => {
  return () => {
    const now = Date.now();
    if (now - lastPressTime > delay) {
      lastPressTime = now;
      callback();
    }
  };
};
