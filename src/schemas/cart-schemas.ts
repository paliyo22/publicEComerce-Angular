import { array, check, InferInput, instance, number, object, pipe, string, transform, union } from "valibot";

const dateSchema = pipe(
    union([string(), instance(Date)]),
    transform((value) => (value instanceof Date ? value : new Date(value))),
    check((date) => !isNaN(date.getTime()), 'Invalid date')
);

const productSchema = object({
    cartProductId: string(),
    productId: string(),
    title: string(),
    price: number(),
    amount: number(),
    discount: number()
});
export type CartProductSchema =InferInput<typeof productSchema>;

const cartSchema = object({
    id: string(),
    created: dateSchema,
    updated: dateSchema,
    products: array(productSchema)
});
export type CartSchema = InferInput<typeof cartSchema>;