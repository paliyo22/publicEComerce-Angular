import { check, InferOutput, instance, object, optional, partial, pipe, safeParse, string, transform, union } from "valibot";

const dateSchema = pipe(
    union([string(), instance(Date)]),
    transform((value) => (value instanceof Date ? value : new Date(value))),
    check((date) => !isNaN(date.getTime()), 'Invalid date')
);

const newAccountSchema = object({
    email: string(),
    username: string()
});

const businessSchema = object({
    ...newAccountSchema.entries,
    title: string(),
    bio: optional(string()),
    phone: string(),
    cbu: optional(string())
});
const newBusinessSchema = object({
    ...businessSchema.entries,
    password: string()
})
export type NewBusinessSchema = InferOutput<typeof newBusinessSchema>;
export const validateNewBusiness = (input: unknown) => {
    return safeParse(newBusinessSchema, input);
};

const userSchema = object({
    ...newAccountSchema.entries,
    firstname: string(),
    lastname: string(),
    birth: optional(dateSchema),
    phone: optional(string()),
    cbu: optional(string())
});
const newUserSchema = object({
    ...userSchema.entries,
    password: string()
})
export type NewUserSchema = InferOutput<typeof newUserSchema>;
export const validateNewUser = (input: unknown) => {
    return safeParse(newUserSchema, input);
};

const partialBusiness = partial(businessSchema);
export type UpdateBusinessSchema = InferOutput<typeof partialBusiness>;
export const validateUpdateBusinessSchema = (input: unknown) => {
    return safeParse(partialBusiness, input);
};

const partialUser = partial(userSchema);
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
    address: newAddressSchema,
    phone: string(),
});
export type NewStoreSchema = InferOutput<typeof newStoreSchema>;
export const validateNewStoreSchema = (input: unknown) => {
    return safeParse(newStoreSchema, input);
};