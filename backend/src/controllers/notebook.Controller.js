import { asyncHandler } from "../utils/AsyncHandler.js";
import { createNotebook, getNotebooks } from "../model/documentModel.js";

const addNotebook = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const userId = req.auth.userId;
    if (!name) return res.status(400).json({ success: false, message: "Name required" });
    const notebook = await createNotebook(name, userId);
    res.status(201).json({ success: true, notebook });
});

const listNotebooks = asyncHandler(async (req, res) => {
    const userId = req.auth.userId;
    const notebooks = await getNotebooks(userId);
    res.status(200).json({ success: true, notebooks });
});

export { addNotebook, listNotebooks };
