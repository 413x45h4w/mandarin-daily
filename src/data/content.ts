import type { Sentence, Word } from '../types';
import lexiconJson from './lexicon.json';
import sentenceJson from './sentences.json';

export const LEXICON = lexiconJson as Word[];
export const SENTENCES = sentenceJson as Sentence[];

export const sentenceById = new Map(SENTENCES.map((sentence) => [sentence.id, sentence]));
