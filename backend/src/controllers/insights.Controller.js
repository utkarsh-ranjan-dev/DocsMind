import { asyncHandler } from "../utils/AsyncHandler.js";
import { getAllDocuments, getStorageStats, getChatSessions } from "../model/documentModel.js";

const getInsights = asyncHandler(async (req, res) => {
    const docs = await getAllDocuments();
    const stats = await getStorageStats();
    const sessions = await getChatSessions();

    res.status(200).json({
        success: true,
        data: {
            totalDocuments: docs.length,
            totalQueries: sessions.reduce((acc, sess) => acc + (sess.messages?.length || 0)/2, 0),
            storageUsedMB: (stats.usedBytes / (1024 * 1024)).toFixed(2),
            recentActivity: "Active"
        }
    });
});

export { getInsights };
