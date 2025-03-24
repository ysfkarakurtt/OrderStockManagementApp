const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const { Mutex } = require('async-mutex');

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', methods: ["GET", "POST"], allowedHeaders: ["Content-Type"], credentials: true }));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'order_stock_management_app'
});

db.connect((err) => {
    if (err) {
        console.error("Database connection error: " + err.stack);
        return;
    }
    console.log("Connected to DB successful");
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../frontend/public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
    const imageUrl = req.file.filename;
    res.status(200).json({ imageUrl });
});

app.use('/upload', express.static(path.join(__dirname, '../frontend/public/uploads')));


// === Customer Operations ===

app.get('/customers', (req, res) => {
    db.query("SELECT * FROM customers", (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).json(results);
    });
});

app.post('/fetch-customer', (req, res) => {
    db.query("SELECT * FROM customers WHERE id=?", [req.body.id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).json(results);
    });
});

app.post('/delete-customers', (req, res) => {
    db.query('DELETE FROM customers', (err) => {
        if (err) {
            console.error('Customers delete  error:', err);
            return res.status(500).send('Customers undeleted.');
        }
        res.status(200).send('Customers deleted.');
    });
});

app.post('/customers', (req, res) => {
    const customers = req.body;
    let insertedCount = 0;

    customers.forEach((customer, index) => {
        const { name, budget, type, totalSpent, password } = customer;
        const query = 'INSERT INTO customers (name, budget, type, total_spent, password) VALUES (?, ?, ?, ?, ?)';

        db.query(query, [name, budget, type, totalSpent, password], (err) => {
            if (err) {
                console.error('Customer add error:', err);
                return res.status(500).send('Customers unsaved');
            }

            insertedCount++;

            if (insertedCount === customers.length) {
                return res.status(201).send('Customers saved.');
            }
        });
    });
});

app.post('/customer', (req, res) => {
    const sql = "SELECT * FROM customers WHERE name= ? AND password = ? ";
    db.query(sql, [req.body.name, req.body.password], (err, data) => {
        if (err) {
            return res.status(500).json({ message: "Server error!" });
        }

        if (data.length > 0) {
            const userId = data[0].id;
            return res.json({ message: "login success", id: userId });
        }
        else {
            return res.json({ message: "login failed" });
        }
    })
})

// === Product Operations ===

app.get('/products', (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).json(results);
    });
});

app.post('/products', (req, res) => {
    db.query(
        "INSERT INTO products (name, stock, price) VALUES (?, ?, ?)",
        [req.body.name, req.body.stock, req.body.price],
        (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(201).send("Product added.");
        }
    );
});

app.post('/remove-product', (req, res) => {
    db.query(
        "DELETE FROM products WHERE id =?",
        [req.body.id],
        (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            return res.json({ process: true, message: "Product deleted." });
        }
    );
});

app.post('/add-product', (req, res) => {
    db.query(
        "INSERT INTO products (name,stock,price) VALUES(?,?,?)",
        [req.body.name, req.body.stock, req.body.price],
        (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            return res.json({ process: true, message: "Product added." });
        }
    );
});

app.post('/update-product', (req, res) => {
    db.query(
        "UPDATE  products SET stock = ? WHERE id = ?",
        [req.body.stock, req.body.id],
        (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            return res.json({ process: true, message: "Product stock updated." });
        }
    );
});

const stockMutex = new Mutex();

app.put('/products', async (req, res) => {
    const release = await stockMutex.acquire();
    try {
        await db.promise().query("UPDATE products SET stock =stock-? WHERE id = ?", [req.body.count, req.body.id]);
        res.status(200).send("Stock updated.");
    } catch (err) {
        console.error("Stock update error:", err);
        res.status(500).send("Stock don't updated.");
    } finally {
        release();
    }
});

// === Order Operations ===

const promiseDb = db.promise();
const { Sema } = require('async-sema');
const processSemaphore = new Sema(1);

app.post('/orders', async (req, res) => {
    const { customer_id, date, products } = req.body;
    let insertedCount = 0;
    const orderIds = [];

    for (const product of products) {
        const release = await stockMutex.acquire();

        try {
            const totalPrice = product.count * product.price;
            const result = await promiseDb.query(
                "INSERT INTO orders (customer_id, product_id, quantity, total_price, date, status) VALUES (?, ?, ?, ?, ?, 'waiting')",
                [customer_id, product.id, product.count, totalPrice, date]
            );

            insertedCount++;
            orderIds.push(result[0].insertId);
        } catch (err) {
            console.error("Orders adding error:", err);
            return res.status(500).json({ process: false, message: "order not created" });
        } finally {
            release();
        }
    }

    if (insertedCount === products.length) {
        return res.json({ process: true, orderIds, message: "All orders created successful" });
    } else {
        return res.status(500).json({ process: false, message: "Some orders not created." });
    }
});

app.get('/orders', (req, res) => {
    const sql = "SELECT * FROM orders WHERE status = ?";
    db.query(sql, ['waiting'], (err, results) => {
        if (err) {
            console.error('siparişler listelenirken   hata oluştu:', err);
        }
        res.status(200).json({ results, process: true, message: "Wait for approve orders listed successful " });

    })
});

app.get('/approved-orders', (req, res) => {
    const sql = "SELECT * FROM orders WHERE status = ?";
    db.query(sql, ['approved'], (err, results) => {
        if (err) {
            console.error('siparişler listelenirken   hata oluştu:', err);
        }
        res.status(200).json({ results, process: true, message: "Approve orders listed successful " });
    })
});

app.post('/my-orders', (req, res) => {
    const sql = "SELECT * FROM orders WHERE customer_id = ? ORDER BY date DESC";
    db.query(sql, [req.body.logID], (err, results) => {
        if (err) {
            console.error('siparişlerim listelenirken hata oluştu:', err);
            return res.status(500).json({ process: false, message: "My orders listed unsuccessful" });
        }

        if (results.length > 0) {
            return res.status(200).json({ results, process: true, message: "My orders listed successful " });
        }

        return res.status(200).json({ results, process: false, message: "Dont have a order." });

    });
});

app.get('/product', (req, res) => {
    const sql = "SELECT * FROM products WHERE id = ?";
    db.query(sql, [req.body.product_id], (err, results) => {
        if (err) {
            console.error('Product listed error', err);
        }
        res.status(200).json({ results, process: true, message: "Product listed. " });

    })
});

app.post('/stocks', (req, res) => {
    const products = req.body;
    let insertedCount = 0;

    products.forEach((product, index) => {
        const sql = "SELECT *  FROM products WHERE id=?";
        db.query(sql, [product.id], (err, results) => {
            if (err) {
                console.error('Stok  hatası:', err);
                return res.json({ process: false, message: "Stock control error: " });
            }

            const result = results[0];
            if (!result || result.stock < product.count) {
                return res.json({ process: false, message: "Products  stock and price insufficient", product: result });
            }

            insertedCount++;

            if (insertedCount === products.length) {
                return res.json({ process: true, message: "Products  stock and price okey." });
            }
        });
    });

})

// === Customer Queue ===
const PriorityQueue = require('priorityqueuejs');
const customerQueue = new PriorityQueue((a, b) => b.priority - a.priority);

app.post('/process-orders', async (req, res) => {
    while (!customerQueue.isEmpty()) {
        const customer = customerQueue.deq();
        console.log(`Customer ${customer.id} processing.`);
    }

    res.status(200).send("All orders processed.");
});

// === Budget Management ===
const budgetMutex = new Mutex();

app.post('/process-payment', async (req, res) => {
    const { customer_id, totalPrice } = req.body;
    const release = await budgetMutex.acquire();

    try {
        const [rows] = await db.promise().query("SELECT budget FROM customers WHERE id = ?", [customer_id]);
        const customer = rows[0];

        if (!customer || customer.budget < totalPrice) {

            return res.json({ process: false, message: "Insufficient Budget" });
        }

        const newBudget = customer.budget - totalPrice;
        await db.promise().query("UPDATE customers SET budget = ? WHERE id = ?", [newBudget, customer_id]);
        res.status(200).json({ process: true, message: "Payment received succesful." });
    } catch (err) {
        console.error("Budget processing error:", err);
        res.status(500).send("An error occurred while updating the budget.");
    } finally {
        release();
    }
});

// === Order Approve ===
const { Worker } = require('worker_threads');

app.post('/approve-orders', async (req, res) => {
    await processSemaphore.acquire();

    try {
        db.query(
            `SELECT o.*, c.type AS customer_type, c.priority_score, c.waiting_time 
             FROM orders o 
             JOIN customers c ON o.customer_id = c.id 
             WHERE o.status = 'waiting'`,
            (err, ordersResult) => {
                if (err) {
                    console.error("DB query error:", err);
                    processSemaphore.release();
                    return res.status(500).send("DB query error.");
                }

                const orders = Array.isArray(ordersResult) ? ordersResult : [];
                if (orders.length === 0) {
                    console.log("No orders pending approval.");
                    processSemaphore.release();
                    return res.status(200).send("No orders pending approval");
                }

                const worker = new Worker(path.resolve(__dirname, './workers/orderProcessingWorker.js'), {
                    workerData: {
                        task: 'approveOrders',
                        data: orders,
                    },
                });

                worker.on('message', result => {
                    if (!result.success) {
                        console.error("Thread working error:", result.error);
                        processSemaphore.release();
                        return res.status(500).send("Thread working error.");
                    }

                    const updatedOrders = result.processedOrders;
                    updatedOrders.sort((a, b) => b.priority_score - a.priority_score);
                    let processedCount = 0;
                    let errorOccurred = false;

                    updatedOrders.forEach(order => {
                        if (errorOccurred) return;

                        db.query("SELECT stock FROM products WHERE id = ?", [order.product_id], (err, rows) => {
                            if (err) {
                                console.error("Stock query error:", err);
                                errorOccurred = true;
                                processSemaphore.release();
                                return res.status(500).send("Stock query error.");
                            }

                            if (!rows.length || rows[0].stock < order.quantity) {
                                console.log(`Insufficient stock: Order ${order.id}`);
                                processedCount++;
                                if (processedCount === updatedOrders.length) {
                                    processSemaphore.release();
                                    res.status(200).send("All process completed.");
                                }
                                return;
                            }

                            const newStock = rows[0].stock - order.quantity;
                            db.query("UPDATE products SET stock = ? WHERE id = ?", [newStock, order.product_id], (err) => {
                                if (err) {
                                    console.error("Stock update error:", err);
                                    errorOccurred = true;
                                    processSemaphore.release();
                                    return res.status(500).send("Stok update error.");
                                }

                                db.query("SELECT budget FROM customers WHERE id = ?", [order.customer_id], (err, customerRows) => {
                                    if (err) {
                                        console.error("Customer query error:", err);
                                        errorOccurred = true;
                                        processSemaphore.release();
                                        return res.status(500).send("Customer query error.");
                                    }

                                    const newBudget = customerRows[0].budget - order.total_price;
                                    db.query("UPDATE customers SET budget = ? WHERE id = ?", [newBudget, order.customer_id], (err) => {
                                        if (err) {
                                            console.error("Budget update error:", err);
                                            errorOccurred = true;
                                            processSemaphore.release();
                                            return res.status(500).send("Budget update error.");
                                        }

                                        db.query("SELECT type FROM customers WHERE id = ?", [order.customer_id], (err, customerRows) => {
                                            if (err) {
                                                console.error("Customer type query error:", err);
                                                errorOccurred = true;
                                                processSemaphore.release();
                                                return res.status(500).send("Customer type query error.");
                                            }

                                            const customerType = customerRows[0]?.type;

                                            if (!customerType) {
                                                console.error("Customer type not found, id:", order.customer_id);
                                                errorOccurred = true;
                                                processSemaphore.release();
                                                return res.status(500).send("Customer type not found.");
                                            }

                                            const waitingTime = calculateNewWaitingTime(order);
                                            const priorityScore = calculateNewPriorityScore(order, waitingTime, customerType);

                                            db.query("UPDATE customers SET waiting_time = ?, priority_score = ? WHERE id = ?", [waitingTime, priorityScore, order.customer_id], (err) => {
                                                if (err) {
                                                    console.error("Customer data not updated:", err);
                                                    errorOccurred = true;
                                                    processSemaphore.release();
                                                    return res.status(500).send("Customer data not updated.");
                                                }

                                                db.query("UPDATE orders SET status = 'approved' WHERE id = ?", [order.id], (err) => {
                                                    if (err) {
                                                        console.error("Order update error:", err);
                                                        errorOccurred = true;
                                                        processSemaphore.release();
                                                        return res.status(500).send("Order update error.");
                                                    }

                                                    console.log(`Order ${order.id} approved and customer data updated.`);
                                                    processedCount++;

                                                    if (processedCount === updatedOrders.length) {
                                                        processSemaphore.release();
                                                        res.status(200).send("All orders approved.");
                                                    }
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

                worker.on('error', err => {
                    console.error("Thread working error:", err);
                    processSemaphore.release();
                    res.status(500).send("Thread working error.");
                });

                worker.on('exit', code => {
                    if (code !== 0) {
                        console.error(`Thread ended unexpected: ${code}`);
                        processSemaphore.release();
                        res.status(500).send("Thread ended unexpected.");
                    }
                });
            }
        );
    } catch (err) {
        console.error("Order approve error:", err);
        processSemaphore.release();
        res.status(500).send("Order approve error.");
    }
});

function calculateNewWaitingTime(order) {
    const currentTime = new Date();
    const orderTime = new Date(order.date);

    if (isNaN(orderTime.getTime())) {
        console.error("Invalid created_at value:", order.date);
        return 0;
    }

    const waitingTime = Math.floor((currentTime - orderTime) / (1000 * 60));
    return waitingTime;
}

function calculateNewPriorityScore(order, waitingTime, customerType) {
    let priorityScore = 0;

    if (customerType === 'premium') {
        priorityScore += 15;
    } else if (customerType === 'standart') {
        priorityScore += 10;
    }

    priorityScore += waitingTime / 10;
    return priorityScore;
}

// === Log Operations ===
const logQueue = [];

app.post('/log', (req, res) => {
    const log = {
        type: req.body.type,
        customerId: req.body.customerId,
        details: req.body.details,
        timestamp: new Date(),
    };

    logQueue.push(log);
    res.status(200).send("Log added to queue.");
});

setInterval(async () => {
    while (logQueue.length > 0) {
        const log = logQueue.shift();
        await db.promise().query(
            "INSERT INTO logs (type, customer_id, details, date) VALUES (?, ?, ?, ?)",
            [log.type, log.customerId, log.details, log.timestamp]
        );
    }
}, 1000);

app.get('/logs', (req, res) => {
    db.query("SELECT * FROM logs ORDER BY id DESC", (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).json(results);
    });
});

app.post('/logs', (req, res) => {
    const { customer_id, date, order_ids, type, details, product_id, option } = req.body;
   
    if (option == 1) {
        const sql = "INSERT INTO logs (customer_id,order_id,date, type, details) VALUES (?, ?, ?, ?, ?)";
        db.query(sql, [customer_id, order_ids, date, type, details], (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(200).json(results);
        });
    }
    else if (option == 2) {
        const sql = "INSERT INTO logs (customer_id,product_id,date, type, details) VALUES (?, ?, ?, ?, ?)";
        db.query(sql, [customer_id, product_id, date, type, details], (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(200).json(results);
        });
    }
    if (option == 3) {
        const sql = "INSERT INTO logs (customer_id,date, type, details) VALUES (?, ?, ?, ?)";
        db.query(sql, [customer_id, date, type, details], (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(200).json(results);
        });
    }
});

// Server Begin
const server = app.listen(8081, () => { console.log("Listening on port 8081..."); });
app.use(cors({ origin: 'http://localhost:3000', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ message: "Connected." }));
    app.post('/update-stock', (req, res) => {
        const stockInfo = { productId: req.body.id, newStock: req.body.stock };
        ws.send(JSON.stringify(stockInfo));
        res.status(200).send("Sent Stock info ");
    });
});