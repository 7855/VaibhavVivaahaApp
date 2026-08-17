// ─────────────────────────────────────────────────────────────
//  uploadFile.ts — building a multipart file part from an
//  expo-image-picker asset, correctly.
// ─────────────────────────────────────────────────────────────

/**
 * Minimal shape we need from an `ImagePicker.ImagePickerAsset`.
 */
export type PickedAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

/** Extensions we accept. Anything else is rejected before it reaches the network. */
const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
} as const;

/**
 * Resolve an asset to a safe { uri, type, name } triple for FormData.
 *
 * Callers used to do `uri.split('.').pop()` and interpolate the result into the MIME type.
 * That breaks whenever the picked URI has no extension — Android frequently hands back a
 * `content://media/external/images/media/1234` URI, where `split('.')` returns the WHOLE string,
 * producing `type: "image/content://media/..."` and a matching garbage filename. The server then
 * rejects the part and the upload silently fails. The asset already carries `mimeType` and
 * `fileName`; use those and only fall back to sniffing.
 *
 * @returns null when the file isn't an accepted image type (caller should surface an error).
 */
export function buildImageFilePart(
  asset: PickedAsset,
  namePrefix: string
): { uri: string; type: string; name: string } | null {
  const fromMime = asset.mimeType?.toLowerCase().split(';')[0].trim();

  // fileName is the next best source — it's a real name, unlike the URI on Android.
  const fromName = asset.fileName?.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  // Only trust the URI's extension when it actually looks like one (short, alphanumeric).
  const fromUri = asset.uri.toLowerCase().match(/\.([a-z0-9]{2,5})(?:\?|$)/)?.[1];

  const extGuess = fromName || fromUri;
  const mime =
    (fromMime && fromMime in ALLOWED && fromMime) ||
    (extGuess === 'png' && 'image/png') ||
    (extGuess === 'webp' && 'image/webp') ||
    (extGuess === 'heic' && 'image/heic') ||
    (extGuess === 'heif' && 'image/heif') ||
    (extGuess === 'jpg' || extGuess === 'jpeg' ? 'image/jpeg' : null);

  if (!mime || !(mime in ALLOWED)) return null;

  const ext = ALLOWED[mime as keyof typeof ALLOWED];
  return { uri: asset.uri, type: mime, name: `${namePrefix}_${Date.now()}.${ext}` };
}

/**
 * Downscale + recompress a picked image before upload.
 *
 * Phone cameras produce 4000px / 5–12MB files, and `launchImageLibraryAsync({ quality: 1 })`
 * hands them over untouched. nginx's default `client_max_body_size` is 1MB, so those uploads
 * came back as a raw **HTTP 413 "Request Entity Too Large"** HTML page — not a JSON error, so
 * the app couldn't even surface a useful message. 1600px at quality 0.7 lands around 150–400KB,
 * which is still far more resolution than any avatar or gallery tile renders at.
 *
 * `manipulateAsync` is deprecated in expo-image-manipulator 14 in favour of `useImageManipulator`,
 * but that replacement is a React hook and cannot be called from an event handler, so the
 * deprecated function is the correct choice here.
 *
 * Falls back to the original asset if manipulation fails — a compression problem should not
 * block the upload outright.
 */
export async function prepareImageForUpload(
  asset: PickedAsset,
  namePrefix: string,
  maxDimension: number = 1600,
  compress: number = 0.7
): Promise<{ uri: string; type: string; name: string } | null> {
  // Reject unsupported types up-front, before spending time on manipulation.
  if (!buildImageFilePart(asset, namePrefix)) return null;

  try {
    const ImageManipulator = await import('expo-image-manipulator');
    const result = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: maxDimension } }],
      { compress, format: ImageManipulator.SaveFormat.JPEG }
    );
    return { uri: result.uri, type: 'image/jpeg', name: `${namePrefix}_${Date.now()}.jpg` };
  } catch {
    return buildImageFilePart(asset, namePrefix);
  }
}
