import { array, check, email, enum_, InferOutput, instance, object, optional, pipe, safeParse, string, transform, union } from "valibot";
import { ERole } from "../enum/role";
import { partialProductSchema } from "./product-schemas";

const dateSchema = pipe(
    union([string(), instance(Date)]),
    transform((value) => (value instanceof Date ? value : new Date(value))),
    check((date) => !isNaN(date.getTime()), 'Invalid date')
);

const authSchema = object({
    username: string(),
    role: enum_(ERole),
    status: string()
});
export type AuthSchema = InferOutput<typeof authSchema>;
export const validateAuth = (imput: unknown) => {
    return safeParse(authSchema, imput);
};

const logSchema = object({
    account: union([string(), pipe(string(), email())]), 
    password: string()
});
export type LogSchema = InferOutput<typeof logSchema>;
export const validateLog = (imput: unknown) => {
    return safeParse(logSchema, imput);
};

const metaSchema = object({
    created: dateSchema,
    updated: dateSchema
});

const addressSchema = object({
    id: string(),
    address: string(),
    apartment: optional(string()),
    city: string(),
    zip: string(),
    country: string()  
});
export type AddressSchema = InferOutput<typeof addressSchema>;
export const validateAddressSchema = (input: unknown) => {
    return safeParse(addressSchema, input);
};

const storeSchema = object({
    id: string(),
    address: addressSchema,
    phone: string(),
});
export type StoreSchema = InferOutput<typeof storeSchema>;

const userProfileSchema = object({
    firstname: string(),
    lastname: string(),
    birth: optional(dateSchema),
    phone: optional(string()),
    cbu: optional(string())
});

const businessProfileSchema = object({
    title: string(),
    bio: optional(string()),
    phone: string(),
    cbu: optional(string())
});

const accountSchema = object({
    ...authSchema.entries,
    email: string(),
    meta: metaSchema,
    userProfile: optional(userProfileSchema),
    businessProfile: optional(businessProfileSchema),
    address: array(addressSchema),
    store: array(storeSchema)
});
export type AccountSchema = InferOutput<typeof accountSchema>;
export const validateAccountSchema = (input: unknown) => {
    return safeParse(accountSchema, input);
};

const publicAccountSchema = object({
    username: string(),
    accountName: string(),
    contactPhone: string(),
    bio: optional(string()),
    meta: metaSchema,
    store: array(object({
        address: string(),
        city: string(),
        country: string(),
        phone: string(),
    })), 
    products: array(partialProductSchema)
});
export type PublicAccountSchema = InferOutput<typeof publicAccountSchema>;
export const validatePublicAccountSchema = (input: unknown) => {
    return safeParse(publicAccountSchema, input);
};