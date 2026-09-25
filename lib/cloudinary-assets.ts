import cloudinary from "@/lib/cloudinary";

const PRODUCT_ASSET_PREFIXES = ["malmi/products/", "malmi-lifestyle/products/"];

export function isManagedProductAsset(publicId: string | null | undefined): publicId is string {
  return Boolean(publicId && PRODUCT_ASSET_PREFIXES.some((prefix) => publicId.startsWith(prefix)));
}

export async function deleteManagedProductAsset(publicId: string | null | undefined): Promise<boolean> {
  if (!isManagedProductAsset(publicId)) return false;
  const result = await cloudinary.uploader.destroy(publicId);
  return result.result === "ok" || result.result === "not found";
}
