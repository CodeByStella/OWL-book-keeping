import { Schema, model } from "mongoose";

const GroupSessionSchema = new Schema({
  groupId: { type: String, required: true, unique: true },
  operators: { type: [String], default: [] },
  rate: { type: Number, default: 1 },
  fee: {
    type: Number,
    default: 0,
  },
  funds: { type: [Number], default: [] }, // { amount, time }
  usdt: { type: [Number], default: [] }, // { amount, time }
  language: {
    type: String,
    enum: ["en", "zh"],
    default: "en",
  },
});

export default model("GroupSession", GroupSessionSchema);
