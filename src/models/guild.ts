import { Schema, model, Document } from 'mongoose'

export const guildSchema = new Schema({
  guildID: {
    type: String,
    required: true,
    unique: true,
  },
  gameCompletionTimes: {
    type: Map,
    of: [Number],
    default: new Map(),
  },
})

export const Guild = model('Guild', guildSchema)

export interface IGuild extends Document {
  guildID: string
  gameCompletionTimes: Map<string, number[]>
}
