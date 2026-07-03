import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { MAX_STARS, MIN_STARS } from '@blind/shared';

const ratingSchema = new Schema(
  {
    gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
    sampleId: { type: String, required: true },
    guessedItemId: { type: Schema.Types.ObjectId, default: null },
    stars: { type: Number, required: true, min: MIN_STARS, max: MAX_STARS },
  },
  { timestamps: true },
);

// One rating per player per sample — re-submitting updates the existing row.
ratingSchema.index({ playerId: 1, sampleId: 1 }, { unique: true });

export type RatingDoc = HydratedDocument<InferSchemaType<typeof ratingSchema>>;

export const Rating = model('Rating', ratingSchema);
