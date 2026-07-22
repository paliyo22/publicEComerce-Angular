import { array, check, InferOutput, instance, number, object, pipe, safeParse, string, transform, union } from "valibot";

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
export const validateSalesSchema = (input: unknown) => {
    return safeParse(salesSchema, input);
};

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
export const validatePartialOrderSchema = (input: unknown) => {
    return safeParse(partialOrderSchema, input);
};

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
export const validateOrderSchema = (input: unknown) => {
    return safeParse(orderSchema, input);
};

const balanceVariationSchema = object({
    since: dateSchema, 
    until: dateSchema,
    total: number()
});
export type BalanceVariationSchema = InferOutput<typeof balanceVariationSchema>;
export const validateBalanceVariationSchema = (input: unknown) => {
    return safeParse(balanceVariationSchema, input);
};