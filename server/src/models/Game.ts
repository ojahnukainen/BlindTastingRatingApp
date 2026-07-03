import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

/** One item the host enters — the true identity behind a blind sample. */
const itemSchema = new Schema({
  name: { type: String, required: true, trim: true },
  order: { type: Number, required: true },
});

/**
 * The answer key built when a game starts: maps an anonymized sample
 * (shown to players) back to the real item. Never sent to players.
 */
const sampleSchema = new Schema(
  {
    sampleId: { type: String, required: true },
    itemId: { type: Schema.Types.ObjectId, required: true },
    label: { type: String, required: true },
  },
  { _id: false },
);

const gameSchema = new Schema(
  {
    roomCode: { type: String, required: true, unique: true },
    hostToken: { type: String, required: true },
    status: {
      type: String,
      enum: ['lobby', 'active', 'finished'],
      default: 'lobby',
      required: true,
    },
    items: { type: [itemSchema], default: [] },
    samples: { type: [sampleSchema], default: [] },
    startedAt: { type: Date },
    finishedAt: { type: Date },
  },
  { timestamps: true },
);

export type GameDoc = HydratedDocument<InferSchemaType<typeof gameSchema>>;

export const Game = model('Game', gameSchema);
