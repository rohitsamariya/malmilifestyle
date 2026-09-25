import mongoose, { Document, Schema } from "mongoose";

export interface IProductVariant {
  variantId: string;
  size: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  image: string | null;
  imagePublicId: string | null;
}

export interface IProduct extends Document {
  productId: string;
  name: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  category: string;
  description: string;
  variants: IProductVariant[];
  rating: number | null;
  reviewCount: number | null;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    variantId: { type: String, required: true },
    size: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 100 },
    isActive: { type: Boolean, default: true },
    image: { type: String, default: null },
    imagePublicId: { type: String, default: null },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    categoryId: { type: String, required: true, index: true },
    categorySlug: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    description: { type: String, required: true, trim: true },
    variants: { type: [ProductVariantSchema], default: [] },
    rating: { type: Number, default: null },
    reviewCount: { type: Number, default: null },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null, min: 0 },
    badge: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, strict: true }
);

export default mongoose.models.Product ||
  mongoose.model<IProduct>("Product", ProductSchema);
