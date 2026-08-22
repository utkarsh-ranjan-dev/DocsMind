import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiEror.js"
import { processDocument } from "../services/loader.Services.js"
import { getVectorStore, addChunk, getAllDocuments, deleteDocument, addDocumentMetadata, getStorageStats } from "../model/documentModel.js"

const feedDocument = asyncHandler(async(req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Please upload the file");
    };

    const { path, mimetype, originalname, size } = req.file;

    const chunk = await processDocument(path, mimetype, originalname);

    await addChunk(chunk);

    // Save to metadata collection
    await addDocumentMetadata({
        fileName: originalname,
        mimetype: mimetype,
        size: size || chunk.length * 100, // fallback if size missing
        uploadedAt: new Date(),
        status: 'Indexed'
    });

    res.status(200).json({
        success: true,
        message: "file uploaded successfully",
        fileName: originalname,
        totalChunk: chunk.length
    });
});

const listDocuments = asyncHandler(async(req, res) => {
    const docs = await getAllDocuments();

    res.status(200).json({
        success: true,
        document: docs
    });
});

const removeDocument = asyncHandler(async(req, res) => {
    const { fileName } = req.body;

    if (!fileName) {
        throw new ApiError(400, "Enter valid File Name");
    }

    await deleteDocument(fileName);

    res.status(200).json({
        success: true,
        message: `${fileName} deleted successfully`
    });
});

const getStats = asyncHandler(async(req, res) => {
    const stats = await getStorageStats();
    res.status(200).json({
        success: true,
        stats
    });
});

export { feedDocument, listDocuments, removeDocument, getStats }
