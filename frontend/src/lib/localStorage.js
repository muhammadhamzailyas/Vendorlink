export const getLocalStorageItem = (key, defaultValue = null) => {
  try {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
  console.error(`Error reading localStorage key "${key}":`, error);
  return defaultValue;
  }
};

export const getLocalStorageString = (key, defaultValue = null) => {
  try {
  return localStorage.getItem(key) || defaultValue;
  } catch (error) {
  console.error(`Error reading localStorage key "${key}":`, error);
  return defaultValue;
  }
};

export const getUserData = () => {
  return getLocalStorageItem("user", {});
};
