import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const playerSchema = new Schema(
  {
    gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
    nickname: { type: String, required: true, trim: true },
    // Persistent per-device identity used to resume after a refresh/disconnect.
    playerToken: { type: String, required: true, index: true },
    socketId: { type: String, required: true },
    connected: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type PlayerDoc = HydratedDocument<InferSchemaType<typeof playerSchema>>;

export const Player = model('Player', playerSchema);
