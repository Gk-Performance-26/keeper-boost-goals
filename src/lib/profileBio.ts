export const BIO_MAX_LENGTH = 500;
export const bioLength = (bio: string) => Array.from(bio).length;
export const limitBio = (bio: string) => Array.from(bio).slice(0, BIO_MAX_LENGTH).join("");