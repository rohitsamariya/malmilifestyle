import mongoose, { Schema, Document } from "mongoose";

export interface IProductVariant {
  variantId: string;
  size: string; // Display size, e.g. "500 ML", "1 L", "1 kg"
  price: number; // Selling price in INR
  compareAtPrice: number | null; // MRP / strikethrough price in INR
  stock: number;
  isActive: boolean;
}

export interface IProduct extends Document {
  productId: string; // Unique base product identifier, e.g. "wp-oil-001"
  name: string;
  slug: string;
  category: "wood-pressed-oils" | "wheat-atta" | "multigrain-atta" | "millet-atta";
  description: string;
  images: string[];
  variants: IProductVariant[];
  rating: number | null;
  reviewCount: number | null;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  madeWith: "Wood-Pressed" | "Stone-Ground";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    variantId: { type: String, required: true },
    size: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number, default: null },
    stock: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ["wood-pressed-oils", "wheat-atta", "multigrain-atta", "millet-atta"],
      index: true,
    },
    description: { type: String, required: true },
    images: { type: [String], required: true },
    variants: [ProductVariantSchema],
    rating: { type: Number, default: null },
    reviewCount: { type: Number, default: null },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number, default: null },
    badge: { type: String, default: null },
    madeWith: {
      type: String,
      required: true,
      enum: ["Wood-Pressed", "Stone-Ground"],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model<IProduct>("Product", ProductSchema);
