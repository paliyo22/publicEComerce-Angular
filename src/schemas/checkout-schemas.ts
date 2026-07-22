import { forward, InferInput, intersect, number, object, optional, partialCheck, pipe, 
    safeParse, string, transform, union } from "valibot";

const checkoutCartSchema = pipe(
  object({
    cartId: optional(string()),
    cartProductId: optional(string())
  }),
  forward(
    partialCheck(
      [['cartId'], ['cartProductId']],
      (input) => {
        const filled = [input.cartId, input.cartProductId].filter(Boolean).length;
        return filled === 1;
      },
      'Exactly one of cartId or cartProductId is required'
    ),
    ['cartId']
  )
);
    
const checkoutProductSchema = object({
    productId: pipe(string()),
    amount: number()
});

const orderSourceSchema = union([
    object({ fromCart: checkoutCartSchema }),
    object({ fromProduct: checkoutProductSchema})
]);
    
const addressSchema = object({
    address: string(),
    apartment: optional(pipe(string(), transform((v) => v.length ? v : undefined))),
    city: string(),
    zip: string(),
    country: string()
});

const newDraftOrderSchema = intersect([orderSourceSchema, addressSchema]);

export type NewDraftOrderSchema = InferInput<typeof newDraftOrderSchema>;
export const validateNewDraftOrderSchema = (input: unknown) => {
    return safeParse(newDraftOrderSchema, input);
};
 
const unavailableProductSchema = object({
    id: string(),
    title: string(),
    reason: string()
});
export type UnavailableProductSchema = InferInput<typeof unavailableProductSchema>;
export const validateUnavailableProductSchema = (input: unknown) => {
    return safeParse(unavailableProductSchema, input);
};

const draftOrderSchema = object({
    id: string(),
    total: number(),
    shippingAddress: string()
});
export type DraftOrderSchema = InferInput<typeof draftOrderSchema>;
export const validateDraftOrderSchema = (input: unknown) => {
    return safeParse(draftOrderSchema, input);
};