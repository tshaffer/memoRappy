import mongoose from 'mongoose';
import { ItemOrdered } from '../types/entities';

const ItemOrderedSchema = new mongoose.Schema({
  inputName: { type: String, required: true },
  standardizedName: { type: String, required: true },
  embedding: { type: [Number], required: false },
}, { collection: "itemsOrdered" });

const ItemOrderedModel = mongoose.model<ItemOrdered>("ItemOrdered", ItemOrderedSchema);

export default ItemOrderedModel;
