/**
 * Everything a successful login stores (2026-10-16). Shared by the PIN login
 * (LoginScreen) and the WhatsApp-code login (OTPValidationScreen, purpose
 * "start"), so the two can never drift in what they persist.
 *
 * `data` is the /user/login (or /user/login-with-otp) payload. `authLogin` is
 * useAuth().login — AuthContext reads AsyncStorage once at boot, so a same-
 * session login must tell it directly (see the 2026-07-20 landmine).
 * Returns the approval status the caller should route on.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { webSocketService } from '../services/webSocketService';
import { saveDeviceInfo } from '../../../utils/deviceInfo';

export async function persistLoginSession(
  data: any,
  authLogin: (userId: string) => Promise<unknown>,
): Promise<string> {
  if (data.token) await AsyncStorage.setItem('authToken', data.token);
  if (data.refreshToken) await AsyncStorage.setItem('refreshToken', data.refreshToken);
  await AsyncStorage.setItem('userId', data.userId);
  await AsyncStorage.setItem('mobileNumber', String(data.mobile ?? ''));
  await authLogin(data.userId).catch(() => {});
  if (data.profileImage) await AsyncStorage.setItem('profileImage', data.profileImage);
  await AsyncStorage.setItem('firstName', data.firstName || '');
  await AsyncStorage.setItem('lastName', data.lastName || '');
  await AsyncStorage.setItem('gender', data.gender || '');
  await AsyncStorage.setItem('location', data.location || '');
  if (data.casteId) await AsyncStorage.setItem('casteId', data.casteId.toString());
  await AsyncStorage.setItem('isUser', data.isUser || '');
  await AsyncStorage.setItem('userRole', data.role || 'USER');
  if (data.familyLoginId) {
    await AsyncStorage.setItem('familyLoginId', String(data.familyLoginId));
    await AsyncStorage.setItem('parentName', data.parentName || '');
    await AsyncStorage.setItem('relationship', data.relationship || '');
  } else {
    await AsyncStorage.multiRemove(['familyLoginId', 'parentName', 'relationship']);
  }
  await AsyncStorage.setItem('hasStarted', 'true');
  const userStatus = data.userStatus || 'APPROVED';
  await AsyncStorage.setItem('userStatus', userStatus);
  if (data.rejectionReason) await AsyncStorage.setItem('rejectionReason', data.rejectionReason);
  else await AsyncStorage.removeItem('rejectionReason');
  // Remember the number for next time (the phone-first screen prefills it).
  if (data.mobile) await AsyncStorage.setItem('lastLoginMobile', String(data.mobile));

  try {
    if (!webSocketService.socket) await webSocketService.connect(data.userId);
  } catch (e) {
    console.error('Error initializing WebSocket connection:', e);
  }
  saveDeviceInfo(data.userId).catch((e) => console.warn('Push: saveDeviceInfo failed at login', e));
  return userStatus;
}

/** Where a freshly logged-in member goes. */
export function routeAfterLogin(userStatus: string): string {
  return userStatus === 'PENDING' || userStatus === 'REJECTED'
    ? '/(root)/(main)/ProfileUnderVerificationScreen'
    : '/(root)/(tabs)';
}
