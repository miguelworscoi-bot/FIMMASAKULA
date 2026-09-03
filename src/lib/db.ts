import Dexie, { type Table } from "dexie";

export interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  deleted_at?: string | null;
  _synced?: boolean;
}

export class WorscoiPOSDatabase extends Dexie {
  products!: Table<Product, string>;

  constructor() {
    super("WorscoiPOSDB");
    this.version(1).stores({
      products: "id, name, barcode, deleted_at, _synced",
    });
  }
}

export const db = new WorscoiPOSDatabase();
