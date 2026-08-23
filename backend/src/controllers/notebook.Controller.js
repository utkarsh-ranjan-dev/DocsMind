import { asyncHandler } from "../utils/AsyncHandler.js";
import { createNotebook, getNotebooks } from "../model/documentModel.js";
import { toggleNotebookVisibility, getNotebookById } from "../model/documentModel.js";

const toggleShare = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isPublic } = req.body;
    const userId = req.auth.userId;
    await toggleNotebookVisibility(id, userId, isPublic);
    res.status(200).json({ success: true, isPublic });
});

const getPublicNotebook = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const notebook = await getNotebookById(id);
    if (!notebook) return res.status(404).json({ success: false, message: "Notebook not found" });
    if (!notebook.isPublic) return res.status(403).json({ success: false, message: "This workspace is private" });
    
    // Return basic info safely
    res.status(200).json({ success: true, notebook: { id: notebook.id, name: notebook.name, owner: notebook.userId } });
});


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

export { addNotebook, listNotebooks, toggleShare, getPublicNotebook };

