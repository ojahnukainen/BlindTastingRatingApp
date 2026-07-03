import { customAlphabet, nanoid } from 'nanoid';
import { ROOM_CODE_LENGTH } from '@blind/shared';

// Exclude visually ambiguous characters (0/O, 1/I/L) from room codes.
const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const makeRoomCode = customAlphabet(ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH);

export const generateRoomCode = (): string => makeRoomCode();

export const generateHostToken = (): string => nanoid(32);
