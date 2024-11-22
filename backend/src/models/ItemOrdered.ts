import mongoose, { Schema, Document, Model } from 'mongoose';
import { ItemOrdered } from '../types/entities';

// export interface IItemOrdered extends Omit<ItemOrdered, "_id">, Document {}

// export type ItemOrderedModel = Model<IItemOrdered>;

// const ItemOrderedSchema: Schema = new Schema({
//   inputName: { type: String, required: true },
//   standardizedName: { type: String, required: true },
// });

// const ItemOrdered: ItemOrderedModel = mongoose.model<IItemOrdered>('ItemOrdered', ItemOrderedSchema);

// export default ItemOrdered;

// import { Document, Model, Schema, model } from 'mongoose';

// Define the TypeScript interface for the schema
// export interface IItemOrdered {
//   inputName: string;
//   standardizedName: string;
// }

// // Extend the interface with Mongoose Document
// export interface IItemOrderedDocument extends IItemOrdered, Document {}

// // Create the schema
// const ItemOrderedSchema: Schema = new Schema({
//   inputName: { type: String, required: true },
//   standardizedName: { type: String, required: true },
// });

// // Create the Mongoose model
// const ItemOrdered: Model<IItemOrderedDocument> = mongoose.model<IItemOrderedDocument>('ItemOrdered', ItemOrderedSchema);

// export default ItemOrdered;
// // Query with the correct type
// // const itemOrderedDocument: IItemOrderedDocument[] = await ItemOrdered.find({ inputName }).exec();

const ItemOrderedModel = mongoose.model<ItemOrdered>("ItemOrdered", new mongoose.Schema({
  inputName: { type: String, required: true },
  standardizedName: { type: String, required: true },
  embedding: { type: [Number], required: false },
}));

export default ItemOrderedModel;
