import { array, boolean, check, enum_, InferInput, instance, number, object, 
    optional, pipe, safeParse, string, transform, union } from "valibot";
import { EProductStatus } from "../enum/product-status";
import { ECategory } from "../enum/category";

const dateSchema = pipe(
    union([string(), instance(Date)]),
    transform((value) => (value instanceof Date ? value : new Date(value))),
    check((date) => !isNaN(date.getTime()), 'Invalid date')
);

export const partialProductSchema = object({
    id: string(),
    title: string(),
    description: string(),
    category: enum_(ECategory),
    price: number(),
    discountPercentage: number(),
    stock: number(),
    brand: optional(string()),
    tags: array(string()),
    images: array(string()), 
    thumbnail: optional(string()),
    ratingAvg: number(),
    status: enum_(EProductStatus)
});
export type PartialProductSchema = InferInput<typeof partialProductSchema>;
export const validatePartialProductSchema = (imput: unknown) => {
    return safeParse(partialProductSchema, imput);
};

const reviewSchema = object({
    username: string(),
    productId: string(),
    rating: number(),
    comment: optional(string()),
    created: dateSchema
});
export type ReviewSchema = InferInput<typeof reviewSchema>;
export const validateReviewSchema = (imput: unknown) => {
    return safeParse(reviewSchema, imput);
};

const productSchema = object({
    ...partialProductSchema.entries,
    accountUsername: string(),
    meta: object({
        created: dateSchema,
        updated: dateSchema
    }),
    weight: number(),  
    physical: boolean(),
    accountName: string(),
    contactPhone: string(),
    contactEmail: string(),
    accountBio: optional(string()),
    store: array(object({
        address: string(),
        city: string(),
        country: string(),
        phone: string(),
    })),
    reviews: array(reviewSchema),
    warrantyInfo: optional(string()),
    shippingInfo: optional(string()),
});
export type ProductSchema = InferInput<typeof productSchema>;
export const validateProductSchema = (imput: unknown) => {
    return safeParse(productSchema, imput);
};
