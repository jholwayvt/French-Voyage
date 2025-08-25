export const setItem = <T,>(key: string, value: T): void => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Error setting item in localStorage for key "${key}":`, error);
  }
};

export const getItem = <T,>(key:string): T | null => {
  try {
    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) {
      return null;
    }
    return JSON.parse(serializedValue) as T;
  } catch (error) {
    console.error(`Error getting item from localStorage for key "${key}":`, error);
    return null;
  }
};

export const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item from localStorage for key "${key}":`, error);
  }
};

const COOLDOWN_TIMESTAMP_KEY = 'french-verb-voyage-cooldown-ts';

export const getCooldownRemaining = (): number => {
  const expiryTimestamp = getItem<number>(COOLDOWN_TIMESTAMP_KEY);
  if (!expiryTimestamp) {
    return 0;
  }

  const now = Date.now();

  if (now >= expiryTimestamp) {
    removeItem(COOLDOWN_TIMESTAMP_KEY);
    return 0;
  }

  return Math.ceil((expiryTimestamp - now) / 1000);
};

export const setCooldownTimestamp = (durationInSeconds: number): void => {
  // Set cooldown only if it's longer than the existing one.
  // This prevents a short cooldown from overwriting a longer, more critical one.
  const existingRemaining = getCooldownRemaining();
  if (durationInSeconds > existingRemaining) {
    const expiryTimestamp = Date.now() + durationInSeconds * 1000;
    setItem(COOLDOWN_TIMESTAMP_KEY, expiryTimestamp);
  }
};