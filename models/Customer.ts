import mongoose, { Schema, Document } from "mongoose";
import { ADDRESS_LABELS, type AddressLabel } from "@/lib/address-constants";

/**
 * A saved delivery address.
 *
 * `addressLine1`/`addressLine2` are intentionally NOT stored here: the address
 * book keeps the structured parts (`house`, `building`, `locality`, `landmark`)
 * and the server composes the two free-text lines only when snapshotting onto an
 * order. New fields default to `""` and are validated in the service layer, so
 * no destructive migration is needed for existing customer documents.
 */
export interface ICustomerAddress {
  _id?: mongoose.Types.ObjectId;
  label: AddressLabel;
  fullName: string;
  phone: string;
  house: string;
  building: string;
  locality: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface ICustomer extends Document {
  email: string;
  /** bcrypt hash. `select: false` keeps it out of every query by default. */
  passwordHash: string;
  phone: string;
  /**
   * Always false at this stage: SMS OTP verification is not implemented, so a
   * stored phone number must never be treated as proven.
   */
  phoneVerified: boolean;
  fullName: string;
  addresses: ICustomerAddress[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerAddressSchema = new Schema<ICustomerAddress>({
  label: { type: String, enum: [...ADDRESS_LABELS], default: "Home" },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  house: { type: String, default: "" },
  building: { type: String, default: "" },
  locality: { type: String, default: "" },
  landmark: { type: String, default: "" },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: "India" },
  isDefault: { type: Boolean, default: false },
});

const CustomerSchema = new Schema<ICustomer>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      default: "",
      select: false,
    },
    phone: { type: String, default: "" },
    phoneVerified: { type: Boolean, default: false },
    fullName: { type: String, default: "", trim: true },
    addresses: [CustomerAddressSchema],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);
