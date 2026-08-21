import fs from "fs";

async function runTests() {
    console.log("--- STARTING TESTS ---");
    
    // 1. Check Server
    try {
        const res = await fetch("http://localhost:3000/test");
        const data = await res.json();
        console.log("1. Health Check:", data);
    } catch (e) {
        console.error("Server not running. Please start it.");
        process.exit(1);
    }

    // 2. Upload Document
    console.log("\n2. Uploading test.txt...");
    fs.writeFileSync("test.txt", "The secret password for the mainframe is 'PINEAPPLE'. It was established in 2024 by Dr. Smith.");
    
    const fileContent = fs.readFileSync("test.txt");
    const blob = new Blob([fileContent], { type: "text/plain" });
    const formData = new FormData();
    formData.append("document", blob, "test.txt");
    
    const uploadRes = await fetch("http://localhost:3000/api/documents/feed", {
        method: "POST",
        body: formData
    });
    const uploadData = await uploadRes.json();
    console.log("Upload Response:", uploadData);

    // Wait a couple seconds for MongoDB Atlas to index the new vectors
    console.log("Waiting 5 seconds for Atlas Vector Search to index...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. List Documents
    console.log("\n3. Listing Documents...");
    const listRes = await fetch("http://localhost:3000/api/documents");
    const listData = await listRes.json();
    console.log("List Response:", listData);

    // 4. Query
    console.log("\n4. Querying Vector DB...");
    const queryRes = await fetch("http://localhost:3000/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "What is the secret password and who established it?" })
    });
    const queryData = await queryRes.json();
    console.log("Query Response:", queryData);

    // 5. Delete Document
    console.log("\n5. Deleting Document...");
    const delRes = await fetch("http://localhost:3000/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceName: "test.txt" })
    });
    const delData = await delRes.json();
    console.log("Delete Response:", delData);
    
    fs.unlinkSync("test.txt");
    console.log("\n--- TESTS COMPLETED ---");
}

runTests();
