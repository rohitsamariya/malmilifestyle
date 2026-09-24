import { getProducts } from "@/data/products";
import AdminProductsClient from "./AdminProductsClient";

export default function AdminProductsPage() {
  const products = getProducts();
  return <AdminProductsClient products={products} />;
}
