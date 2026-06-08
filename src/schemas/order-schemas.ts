import { array, check, InferOutput, instance, number, object, pipe, string, transform, union } from "valibot";

const salesSchema = object({
    productId: string(),
    buyerEmail: string(),
    product: string(),
    price: number(),
    amount: number(),
    discount: number(),
    subtotal: number()
}); 
export type SalesSchema = InferOutput<typeof salesSchema>;

const dateSchema = pipe(
    union([string(), instance(Date)]),
    transform((value) => (value instanceof Date ? value : new Date(value))),
    check((date) => !isNaN(date.getTime()), 'Invalid date')
);

const partialOrderSchema = object({
    id: string(),
    total: number(),
    shippingAddress: string(),
    created: dateSchema
});
export type PartialOrderSchema = InferOutput<typeof partialOrderSchema>;

const orderItemsSchema = object({
    productId: string(),
    seller: string(),
    product: string(),
    price: number(),
    amount: number(),
    discount: number(),
    subtotal: number()
});

const orderSchema = object({
    ...partialOrderSchema.entries,
    items: array(orderItemsSchema)
});
export type OrderSchema = InferOutput<typeof orderSchema>;

const balaneVariationSchema = object({
    since: dateSchema, 
    until: dateSchema,
    total: number()
});
export type BalanceVariationSchema = InferOutput<typeof balaneVariationSchema>;