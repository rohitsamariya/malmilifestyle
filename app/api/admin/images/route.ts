import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminApiAuth";
import cloudinary from "@/lib/cloudinary";

// Helper to convert Web Stream to Buffer
async function getFileBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: Request) {
  try {
    // 1. Verify Admin Session
    const authResponse = await requireAdminSession();
    if (authResponse) return authResponse;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type (basic)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
    }

    // Validate size (e.g. 5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit." }, { status: 400 });
    }

    const buffer = await getFileBuffer(file);

    // Upload to Cloudinary using a Promise wrapper
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "malmi-lifestyle/products",
          // You could add transformations here if needed
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const result = uploadResult as any;

    return NextResponse.json(
      {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // 1. Verify Admin Session
    const authResponse = await requireAdminSession();
    if (authResponse) return authResponse;

    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json({ error: "No publicId provided" }, { status: 400 });
    }

    // Do not delete existing static image URLs (they won't have a typical Cloudinary public ID in our format or we don't want to touch them if they are local)
    // Cloudinary public IDs from our uploads will likely start with "malmi-lifestyle/products/"
    if (!publicId.startsWith("malmi-lifestyle/")) {
        // Just return success if it's not a Cloudinary image we manage, so the frontend can still remove it from the DB
        return NextResponse.json({ success: true, message: "Skipped deletion of non-cloudinary asset." }, { status: 200 });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok' && result.result !== 'not found') {
        console.error("Cloudinary deletion unexpected result:", result);
         // We might still want to return 200 so the frontend can remove it from DB, but let's log it.
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
