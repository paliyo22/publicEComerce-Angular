import { array, boolean, enum_, InferOutput, minValue, number, object, optional, partial, pipe, safeParse, string, transform } from "valibot";
import { ECategory } from "../enum/category";

const newProductSchema = object({
    title: string(),
    description: string(),
    category: enum_(ECategory),
    price: pipe(number(), transform((input) => Math.trunc(input * 100) / 100), minValue(0)),
    discountPercentage: optional(pipe(number(), transform((input) => Math.trunc(input * 100) / 100), minValue(0))),
    stock: pipe(number(), transform((input) => Number(input.toFixed(0))), minValue(0)),
    brand: string(),
    weight: pipe(number(), transform((input) => Math.trunc(input * 100) / 100), minValue(0)),
    physical: boolean(),
    warrantyInfo: optional(string()),
    shippingInfo: optional(string()),
    tags: optional(array(string())),
    images: optional(array(string())),
    thumbnail: optional(string())
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