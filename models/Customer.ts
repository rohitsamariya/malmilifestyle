import mongoose, { Schema, Document } from "mongoose";

export interface ICustomerAddress {
  _id?: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
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
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: "" },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
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
