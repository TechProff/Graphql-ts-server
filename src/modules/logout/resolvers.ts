import { resolverMap } from "../../types/graphql-utils";
import { removeAllUserSessions } from "../../utils/removeAllUserSessions";


export const resolvers: resolverMap = {
    Mutation: {
        logout: async (_, __, { session, redis }) => {
            const { userId } = session;
            if (userId) {
                session.destroy(err => {
                    if (err) {
                        console.log(err)
                    }
                })
                removeAllUserSessions(userId, redis)
                return true
            }

            return false
        }
    }
}