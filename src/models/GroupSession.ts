import { Schema, model } from "mongoose";

export type GroupSessionType = {
  groupId: string;
  operators: string[];
  rate: number;
  fee: number;
  funds: { value: number; rate: number; fee: number }[];
  usdt: { value: number; rate: number; fee: number }[];
  language: "en" | "zh";
};

const TransactionSchema = new Schema(
  {
    value: { type: Number, required: true },
    rate: { type: Number, default: 1 },
    fee: { type: Number, default: 0 },
  },
  { _id: false, timestamps: true }, // Disable _id for subdocuments to keep arrays clean
);

const GroupSessionSchema = new Schema({
  groupId: { type: String, required: true, unique: true },
  operators: { type: [String], default: [] },
  rate: { type: Number, default: 1 },
  fee: { type: Number, default: 0 },
  funds: { type: [TransactionSchema], default: [] },
  usdt: { type: [TransactionSchema], default: [] },
  language: {
    type: String,
    enum: ["en", "zh"],
    default: "en",
  },
});

export default model("GroupSession", GroupSessionSchema);
