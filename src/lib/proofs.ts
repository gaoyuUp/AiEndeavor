export const MAX_PROOF_REJECTIONS = 3;

export function proofSrc(imagePath: string) {
  if (imagePath.startsWith("/uploads/")) return `/api${imagePath}`;
  return imagePath;
}
