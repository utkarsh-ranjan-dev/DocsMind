import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiEror.js"
import { processDocument } from "../services/loader.Services.js"
import { getVectorStore, addChunk, getAllDocuments, deleteDocument, addDocumentMetadata, getStorageStats } from "../model/documentModel.js"

const feedDocument = asyncHandler(async(req, res) => {
    if (!req.file) throw new ApiError(400, "Please upload the file");
    
    const { notebookId } = req.body;
    const userId = req.auth.userId;
    if (!notebookId) throw new ApiError(400, "notebookId is required");

    const { path, mimetype, originalname, size } = req.file;
    const chunk = await processDocument(path, mimetype, originalname);

    chunk.forEach(c => {
        c.metadata = { ...c.metadata, notebookId, userId };
    });

    await addChunk(chunk);

    await addDocumentMetadata({
        fileName: originalname,
        mimetype: mimetype,
        size: size || chunk.length * 100,
        uploadedAt: new Date(),
        status: 'Indexed',
        notebookId: notebookId,
        userId: userId
    });

    res.status(200).json({ success: true, message: "file uploaded", fileName: originalname });
});

const listDocuments = asyncHandler(async(req, res) => {
    const { notebookId } = req.query;
    const userId = req.auth.userId;
    const docs = await getAllDocuments(notebookId, userId);
    res.status(200).json({ success: true, document: docs });
});

const removeDocument = asyncHandler(async(req, res) => {
    const { fileName, notebookId } = req.body;
    const userId = req.auth.userId;
    if (!fileName || !notebookId) throw new ApiError(400, "Missing parameters");
    await deleteDocument(fileName, notebookId, userId);
    res.status(200).json({ success: true, message: `${fileName} deleted` });
});

const getStats = asyncHandler(async(req, res) => {
    const userId = req.auth.userId;
    const stats = await getStorageStats(userId);
    res.status(200).json({ success: true, stats });
});

export { feedDocument, listDocuments, removeDocument, getStats }
