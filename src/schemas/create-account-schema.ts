import { check, InferOutput, instance, object, optional, partial, pipe, safeParse, string, transform, union } from "valibot";

const dateSchema = pipe(
    union([string(), instance(Date)]),
    transform((value) => {
        if (value === '' || value === null || value === undefined) return undefined;
        return value instanceof Date ? value : new Date(value)
    }),
    check((date) => date === undefined || !isNaN((date as Date).getTime()), 'Invalid date')
);

const businessAccountSchema = object({
    title: string(),
    bio: optional(pipe(string(), transform((v) => v.length ? v : undefined))),
    phone: string(),
    cbu: optional(string())
});
const newBusinessSchema = object({
    email: string(),
    username: string(),
    password: string(),
    businessAccount: businessAccountSchema
});
export type NewBusinessSchema = InferOutput<typeof newBusinessSchema>;
export const validateNewBusiness = (input: unknown) => {
    return safeParse(newBusinessSchema, input);
};

const userAccountSchema = object({
    firstname: string(),
    lastname: string(),
    birth: optional(dateSchema),
    phone: optional(pipe(string(), transform((v) => v.length ? v : undefined))),
    cbu: optional(pipe(string(), transform((v) => v.length ? v : undefined)))
});
const newUserSchema = object({
    email: string(),
    username: string(),
    password: string(),
    userAccount: userAccountSchema
});
export type NewUserSchema = InferOutput<typeof newUserSchema>;
export const validateNewUser = (input: unknown) => {
    return safeParse(newUserSchema, input);
};

const partialBusiness = object({
    email: optional(string()),
    username: optional(string()),
    businessAccount: optional(partial(businessAccountSchema))
});
export type UpdateBusinessSchema = InferOutput<typeof partialBusiness>;
export const validateUpdateBusinessSchema = (input: unknown) => {
    return safeParse(partialBusiness, input);
};

const partialUser = object({
    email: optional(string()),
    username: optional(string()),
    userAccount: optional(partial(userAccountSchema))
});
export type UpdateUserSchema = InferOutput<typeof partialUser>;
export const validateUpdateUserSchema = (input: unknown) => {
    return safeParse(partialUser, input);
};

const newAddressSchema = object({
    address: string(),
    apartment: optional(string()),
    city: string(),
    zip: string(),
    country: string()  
});
export type NewAddressSchema = InferOutput<typeof newAddressSchema>;
export const validateNewAddressSchema = (input: unknown) => {
    return safeParse(newAddressSchema, input);
};

const newStoreSchema = object({
    ...newAddressSchema.entries,
    phone: optional(pipe(string(), transform((v) => v.length ? v : undefined))),
});
export type NewStoreSchema = InferOutput<typeof newStoreSchema>;
export const validateNewStoreSchema = (input: unknown) => {
    return safeParse(newStoreSchema, input);
};