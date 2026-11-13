
import { MongoClient, ObjectId } from 'mongodb';
import express from 'express'
// const cors = require("cors");
import cors from 'cors'
import 'dotenv/config'
const app = express();
const PORT = 8000

// Middleware
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_DB_URI);

let booksCollection;
let borrowsCollection;

export async function connectToMongoDB() {

    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        // return client;
        const db = client.db("book-club");

        booksCollection = db.collection("books");
        borrowsCollection = db.collection("borrows");

        return db;
    } catch (err) {
        console.dir('MongoDB Connection error', err);
        throw err;
    }
}

connectToMongoDB();

// Get all books
app.get("/books", async (req, res) => {
    try {
        const books = await booksCollection
            .find()
            .sort({ addedDate: -1 })
            .limit(6)
            .toArray();

        res.send(books);

    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).send({
            message: "Failed to fetch books"
        });
    }
});

// Add a new book
app.post("/books", async (req, res) => {
    try {
        const newBook = {
            ...req.body,
            addedDate: new Date()
        };

        const result = await booksCollection.insertOne(newBook);

        res.status(201).send({
            message: "Book added successfully!",
            insertedId: result.insertedId
        });

    } catch (error) {
        console.error("Error adding book:", error);

        res.status(500).send({
            message: "Failed to add book"
        });
    }
});

// Get a single book
app.get("/books/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid book ID"
            });
        }

        const book = await booksCollection.findOne({
            _id: new ObjectId(id)
        });

        // Check whether the book exists
        if (!book) {
            return res.status(404).send({
                message: "Book not found"
            });
        }

        res.send(book);

    } catch (error) {
        console.error("Error fetching single book:", error);

        res.status(500).send({
            message: "Failed to fetch book"
        });
    }
});

// Update a book
app.patch("/books/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const filter = { _id: new ObjectId(id) };

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid book ID"
            });
        }
        const updatedBook = {
            $set: req.body
        };

        const result = await booksCollection.updateOne(filter, updatedBook);
        if (result.matchedCount === 0) {
            return res.status(404).send({
                message: "Book not found"
            });
        }
        res.send({
            message: "Book updated successfully!",
            result
        });

    } catch (error) {
        console.error("Error updating book:", error);

        res.status(500).send({
            message: "Failed to update book"
        });
    }
});

// Delete a book
app.delete("/books/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const query = { _id: new ObjectId(id) };

        const result = await booksCollection.deleteOne(query);

        res.send({
            message: "Book deleted successfully!",
            result
        });

    } catch (error) {
        console.error("Error deleting book:", error);

        res.status(500).send({
            message: "Failed to delete book"
        });
    }
});

// Borrow a book
app.post("/borrows", async (req, res) => {
    try {
        const { bookId, userEmail } = req.body;

        const book = await booksCollection.findOne({
            _id: new ObjectId(bookId)
        });

        if (!book) {
            return res.status(404).send({
                message: "Book not found"
            });
        }
        if (book.totalCopies <= 0) {
            return res.status(400).send({
                message: "Book is not available"
            });
        }

        const alreadyBorrowed = await borrowsCollection.findOne({
            bookId: bookId,
            userEmail: userEmail
        });

        if (alreadyBorrowed) {
            return res.status(400).send({
                message: "You have already borrowed this book"
            });
        }
        // res.send(book);
        const borrowInfo = {
            bookId,
            bookTitle: book.title,
            bookImage: book.image,
            userEmail,
            borrowDate: req.body.borrowDate,
            returnDate: req.body.returnDate
        };

        const result = await borrowsCollection.insertOne(borrowInfo);

        await booksCollection.updateOne(
            { _id: new ObjectId(bookId) },
            { $inc: { totalCopies: -1 } }
        );

        res.status(201).send({
            message: "Book borrowed successfully!",
            insertedId: result.insertedId
        });

    } catch (error) {
        console.error("Error borrowing book:", error);

        res.status(500).send({
            message: "Failed to borrow book"
        });
    }
});

// Get all borrow records
app.get("/borrows", async (req, res) => {
    try {
        const borrows = await borrowsCollection.find().toArray();

        res.send(borrows);

    } catch (error) {
        console.error("Error fetching borrow records:", error);

        res.status(500).send({
            message: "Failed to fetch borrow records"
        });
    }
});

// Return a book
app.delete("/borrows/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Find the borrow record
        const borrow = await borrowsCollection.findOne({
            _id: new ObjectId(id)
        });

        if (!borrow) {
            return res.status(404).send({
                message: "Borrow record not found"
            });
        }

        // Delete the borrow record
        await borrowsCollection.deleteOne({
            _id: new ObjectId(id)
        });

        // Increase available copies
        await booksCollection.updateOne(
            { _id: new ObjectId(borrow.bookId) },
            { $inc: { totalCopies: 1 } }
        );

        res.send({
            message: "Book returned successfully!"
        });

    } catch (error) {
        console.error("Error returning book:", error);

        res.status(500).send({
            message: "Failed to return book"
        });
    }
});

// async function startServer() {
//     try {
//         await connectToMongoDB();

//         app.listen(PORT, () => {
//             console.log(`BookNook Server is running on port ${PORT}`);
//         });
//     } catch (error) {
//         console.error("Failed to start server.");
//         process.exit(1);
//     }
// }



// Root route
app.get("/", (req, res) => {
    res.send("BookNook Server is Running!");
});

// Start Server
app.listen(PORT, () => {
    console.log(`BookNook Server is running on port ${PORT}`);
});
