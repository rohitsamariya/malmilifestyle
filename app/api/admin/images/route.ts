import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminApiAuth";
import cloudinary from "@/lib/cloudinary";
import {
  deleteManagedProductAsset,
  isManagedProductAsset,
} from "@/lib/cloudinary-assets";

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

function pathPart(value: FormDataEntryValue | null, fallback: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  return text.replace(/[^a-zA-Z0-9_-]/g, "-") || fallback;
}

async function getFileBuffer(file: File): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer());
}

export async function POST(request: Request) {
  try {
    const authResponse = await requireAdminSession();
    if (authResponse) return authResponse;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 },
      );
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 5MB limit." }, { status: 400 });
    }

    const productSlug = pathPart(formData.get("productSlug"), "product");
    const variantId = pathPart(formData.get("variantId"), "variant");
    const buffer = await getFileBuffer(file);
    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `malmi/products/${productSlug}/${variantId}` },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary returned no upload result."));
            return;
          }
          resolve(result as CloudinaryUploadResult);
        },
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json(
      {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResponse = await requireAdminSession();
    if (authResponse) return authResponse;

    const { publicId } = await request.json();
    if (typeof publicId !== "string" || !publicId) {
      return NextResponse.json({ error: "No publicId provided" }, { status: 400 });
    }
    if (!isManagedProductAsset(publicId)) {
      return NextResponse.json({ success: true, skipped: true });
    }

    await deleteManagedProductAsset(publicId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
