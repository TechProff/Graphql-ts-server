import { resolverMap } from "../../types/graphql-utils";
import { getAllCategory, getCategoryById } from "../../func/CategoryFunc/getAllCategory.Query.ts";
import { createCategoryFunc } from "../../func/CategoryFunc/createCategory.Mutation";
import { createMiddleware } from "../../MiddlewareFunc/createMiddleware";
import { requiresAuth, requiresAuth_AdminAccess } from "../../MiddlewareFunc/middlewareFunc";
import { updateCategoryMutation } from "../../func/CategoryFunc/updateCategory.Mutation";


export const resolvers: resolverMap = {
    Query: {
        categories: createMiddleware(requiresAuth, async (_, __, { session }) => {
            const { userId } = session;

            if (!userId) return null;
            return await getAllCategory()
        }),
        category: createMiddleware(requiresAuth, async (_, args, { session }) => {
            const { id } = args;
            const { userId } = session;

            if (!userId) return null;
            return await getCategoryById(id)
        }),
    },

    Mutation: {
        AddCategory: createMiddleware(requiresAuth_AdminAccess, async (_: any, args: { input: any; }, { session }) => {
            const { userId, userType } = session;
            const { input } = args;

            if (!userId) return null;
            if (userType !== "ADMIN") return null;

            const name = input?.name
            return await createCategoryFunc(name)
        }),
        updateCategory: createMiddleware(requiresAuth_AdminAccess, async (_, args: { id: any, input: any }) => {
            const { input, id } = args;

            return await updateCategoryMutation(id, input);
        })
    }
}