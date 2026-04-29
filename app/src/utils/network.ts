/**
 * Network detection utility.
 * Checks if the device has an active internet connection.
 */
import NetInfo from '@react-native-community/netinfo';

/**
 * Returns true if the device currently has internet connectivity.
 */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Subscribe to network state changes.
 * Returns an unsubscribe function.
 */
export function onNetworkChange(
  callback: (isConnected: boolean) => void
): () => void {
  return NetInfo.addEventListener((state) => {
    callback(state.isConnected === true && state.isInternetReachable !== false);
  });
}
