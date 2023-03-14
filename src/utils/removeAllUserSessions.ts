import { Redis } from "ioredis";
import { userSessionIdPrefix, redisSessionPrefix } from "../constants";

export const removeAllUserSessions = async (userId: string, redis: Redis) => {
    const sessionIds = await redis.lrange(`${userSessionIdPrefix}${userId}`, 0, -1)
    console.log(sessionIds)

    const promises = [];

    for (var i = 0; i < sessionIds.length; i += 1) {
        promises.push(await redis.del(`${redisSessionPrefix}${sessionIds[i]}`))
    }

    console.log(promises)
    await Promise.all(promises)
}