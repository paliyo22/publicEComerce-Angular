import { array, boolean, enum_, InferOutput, minValue, number, object, optional, partial, pipe, safeParse, string, transform } from "valibot";
import { ECategory } from "../enum/category";

const newProductSchema = object({
    title: string(),
    description: string(),
    category: enum_(ECategory),
    price: pipe(number(), transform((input) => Math.trunc(input * 100) / 100), minValue(0)),
    discountPercentage: optional(pipe(number(), transform((input) => Math.trunc(input * 100) / 100), minValue(0))),
    stock: pipe(number(), transform((input) => Number(input.toFixed(0))), minValue(0)),
    brand: optional(pipe(string(), transform((v) => v.length ? v : undefined))),
    weight: pipe(number(), transform((input) => Math.trunc(input * 100) / 100), minValue(0)),
    physical: boolean(),
    warrantyInfo: optional(pipe(string(), transform((v) => v.length ? v : undefined))),
    shippingInfo: optional(pipe(string(), transform((v) => v.length ? v : undefined))),
    tags: pipe(array(string()), transform((v) => v.length ? v : [])),
    images: pipe(array(string()), transform((v) => v.length ? v : [])),
    thumbnail: optional(pipe(string(), transform((v) => v.length ? v : undefined)))
});

export type NewProductSchema = InferOutput<typeof newProductSchema>;
export const validateNewProduct = (input: unknown) => {
    return safeParse(newProductSchema, input);
};

const updateProduct = partial(newProductSchema);

export type UpdateProductSchema = InferOutput<typeof updateProduct>;
export const validateUpdateProductSchema = (input: unknown) => {
    return safeParse(updateProduct, input);
};