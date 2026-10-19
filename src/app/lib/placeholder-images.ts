import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl?: string;
  imageHint: string;
  reelUrl?: string;
  permalink?: string;
  price?: string | number | null;
};

export const PlaceHolderImages: ImagePlaceholder[] = data?.placeholderImages || [];
