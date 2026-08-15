export type IProductFilterRequest = {
  searchTerm?: string;
  categoryId?: string;
  categorySlug?: string;
  category?: string;
  brandId?: string;
  brand?: string;
  variants?: any;
  isPublished?: string | boolean;
  isFeatured?: string | boolean;
  status?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
};
