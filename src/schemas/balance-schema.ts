import { check, enum_, InferOutput, instance, number, object, pipe, safeParse, string, transform, union } from "valibot";
import { EStateStatus } from "../enum/state-status";

const dateSchema = pipe(
    union([string(), instance(Date)]),
    transform((value) => (value instanceof Date ? value : new Date(value))),
    check((date) => !isNaN(date.getTime()), 'Invalid date')
);

const withdrawalSchema = object({
    amount: number(),
    status: enum_(EStateStatus),
    cbu: string(),
    created: dateSchema
});
export type WithdrawalSchema = InferOutput<typeof withdrawalSchema>;
export const validateWithdrawalSchema = (input: unknown) => {
    return safeParse(withdrawalSchema, input);
};

const incomeSchema = object({
    amount: number(),
    orderId: string(),
    created: dateSchema
});
export type IncomeSchema = InferOutput<typeof incomeSchema>;
export const validateIncomeSchema = (input: unknown) => {
    return safeParse(incomeSchema, input);
};