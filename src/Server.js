const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 8080;
const sql = require('mssql');
const uuid = require('uuid/v1');
const nodemailer = require('nodemailer');
const Deferred = require('node-defer');
const Enumerable = require('../node_modules/linq')

const config = {
    user: 'sa',
    password: 'admin123',
    server: 'DESKTOP-LR002GL',
    database: 'Expense Manager'
};

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/expenseDistribution', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        console.error("userId is not found in request query string.");
        res.send(null);
    } else {
        getDistributionWithUserId(userId).then((record) => {
            res.send(JSON.stringify(record));
        });

    }
});

app.get('/getHistory', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        console.error("userId is not found in request query string.");
        res.send(null);
    } else {
        const selectQuery = `select* from expense_manager where user_id='${userId}'`;
        executeQuery(selectQuery).then((record) => {
            const months = Enumerable.from(record).select(x => x.month_name).distinct().toArray();
            const years = Enumerable.from(record).select(x => x.year).distinct().toArray();
            const expenses = Enumerable.from(record).where(x => x.month_name == currentMonth() && x.year == currentYear() && x.total_expense_amount != null).toArray();
            res.send(JSON.stringify({ months: months, years: years, expenses: expenses }));
        });
    }
});

app.get('/getHistoryForMonthAndYear', (req, res) => {
    const userId = req.query.userId;
    const month = req.query.month || currentMonth();
    const year = req.query.year || currentYear();
    if (!userId) {
        console.error("userId is not found in request query string.");
        res.send(null);
    } else {
        const selectQuery = `select* from expense_manager where user_id='${userId}' and month_name='${month.toLowerCase()}' 
        and year=${year}`;
        executeQuery(selectQuery).then((record) => {
            res.send(JSON.stringify(Enumerable.from(record).where(x => x.total_expense_amount != null).toArray()));
        });
    }
});

app.get('/getOverview', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        console.error("userId is not found in request query string.");
        res.send(null);
    } else {
        const selectQuery = `select* from expense_manager where user_id='${userId}' and month_name='${currentMonth().toLowerCase()}' 
        and year=${currentYear()}`;
        executeQuery(selectQuery).then((record) => {
            res.send(JSON.stringify(record));
        });
    }
})

io.on('connection', (client) => {
    console.log('listening on port ', port);
    client.on("dologin", function (data) {
        sql.close();//close existing connection
        sql.connect(config, function (err) {
            if (err) console.log(err);
            else {
                console.log("connected to mssql.");
                // create Request object
                var request = new sql.Request();

                // query to the database and get the records
                const query = `select * from users_info where email='${data.username}' OR username='${data.userName}' AND pass='${data.password}'`;
                request.query(query, function (err, recordset) {
                    if (err) console.log(err)
                    else {
                        if (recordset.recordset.length > 0) {
                            client.emit("validUser", recordset.recordset);
                        } else {
                            client.emit("loginFailed");
                            console.log("login failed");
                        }

                        // socket.emit('updateActiveusers', { activeUsers: activeUsers });
                    }

                    sql.close();

                });
            }
        });
    });

    client.on("signin", function (data) {
        console.log(data);
        sql.connect(config, function (err) {
            if (err) console.log(err);
            else {
                console.log("connected to mssql.");
                // create Request object
                const request = new sql.Request();
                const id = uuid();
                console.log(id);
                // query to the database and get the records
                const query = `insert into users_info values('${id}', '${data.email}', '${data.userName}', '${data.fullName}', ${data.mobileNumber}, '${data.password}')`
                request.query(query, function (err, recordSet) {
                    if (!err) {
                        client.emit("signedUpSuccessfully");
                        console.log("sing up successfully")
                    }
                    else {
                        //need to handle this on client side.
                        client.emit("signUpFailed");
                        console.log(err);
                    }
                    sql.close();
                });
            }


        })

    });

    client.on('sendOtp', (emailAddress) => {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',

            auth: {
                user: 'expense.manager94@gmail.com',
                pass: 'expense@007'
            },
            tls: {
                rejectUnauthorized: false
            }
        });


        const mailOptions = {
            from: 'expense.manager94@gmail.com',
            to: `${emailAddress}`,
            subject: 'Sending Email using Node.js',
            text: 'That was easy!'
        };

        transporter.sendMail(mailOptions, function (error, info) {
            /**Need to generate otp send it and update database for it. */
            if (error) {
                client.emit('emailSendingFailed');
                console.log(error);
            } else {
                client.emit('emailSendSuccessfully');
                console.log('Email sent: ' + info.response);
            }
        });
    });

    client.on("editDistribution", (data) => {
        getDistributionWithId(data.id).then((distribution) => {
            const expenseArea = distribution[0].expense_area;
            const queryForExpenseDistribution = `update expense_distribution set expense_area='${data.expenseArea}' ,allocated_expense_amonut=${data.allocatedAmount} 
        where id='${data.id}'`;
            const queryForExpenseManager = `update expense_manager set expense_area='${data.expenseArea}' ,allocated_expense_amount=${data.allocatedAmount} 
        where expense_area='${expenseArea}' and month_name='${currentMonth()}' and year=${currentYear()}`;
            const query = `BEGIN TRAN T2;        
            ${queryForExpenseDistribution};
            ${queryForExpenseManager};
           COMMIT TRAN T2;`;
            connectSql().then((request) => {
                request.query(query, (err, record) => {
                    sql.close();
                    if (err) console.log(err);
                    else {
                        getDistributionWithUserId(data.userId).then((records) => {
                            client.emit("refreshDistribution", JSON.stringify(records));
                        });
                    }
                })
            })
        })
    });

    client.on("deleteDistribution", (data) => {
        const queryForExpenseDistribution = `delete from expense_distribution where id='${data.id}'`;
        getDistributionWithId(data.id).then((distribution) => {
            const expenseArea = distribution[0].expense_area;
            const queryForExpenseManager = `delete from expense_manager where expense_area='${expenseArea}' 
            and month_name='${currentMonth()}' and year=${currentYear()}`;
            let query = `BEGIN TRAN T2;        
            ${queryForExpenseDistribution};
            ${queryForExpenseManager};
           COMMIT TRAN T2;`;
            connectSql().then((request) => {
                request.query(query, (err, record) => {
                    if (err) console.log(err);
                    else {
                        getDistributionWithUserId(data.userId).then((records) => {
                            client.emit("refreshDistribution", JSON.stringify(records));
                        });
                    }
                })
            });
        });
    })

    client.on("addDistribution", (data) => {
        const distributions = data.distributions;
        const amounts = data.amounts;
        let queryForExpenseDistribution = "insert into expense_distribution values";
        let queryForExpenseManager = 'insert into expense_manager(id,expense_area,allocated_expense_amount,user_id,month_name,year) values';

        for (let i = 0; i < distributions.length; i++) {
            const id = uuid();
            if (i != distributions.length - 1) {
                queryForExpenseDistribution = `${queryForExpenseDistribution}('${id}','${data.userId}','${distributions[i]}',${amounts[i]}),`;
                queryForExpenseManager = `${queryForExpenseManager}('${id}','${distributions[i]}',${amounts[i]},'${data.userId}','${currentMonth()}',${currentYear()}),`;
            }
            else {
                queryForExpenseDistribution = `${queryForExpenseDistribution}('${id}','${data.userId}','${distributions[i]}',${amounts[i]})`;
                queryForExpenseManager = `${queryForExpenseManager}('${id}','${distributions[i]}',${amounts[i]},'${data.userId}','${currentMonth()}',${currentYear()})`;
            }
        }
        let query = `BEGIN TRAN T2;        
        ${queryForExpenseDistribution};
        ${queryForExpenseManager};
       COMMIT TRAN T2;`;
        connectSql().then((request) => {
            request.query(query, function (err, recordSet) {
                sql.close();
                if (!err) {
                    getDistributionWithUserId(data.userId).then((record) => {
                        client.emit("refreshDistribution", JSON.stringify(record));
                    });
                    console.log("distribution Added successfully")
                }
                else {
                    //need to handle this on client side.
                    client.emit("distributionAdditionFailed");
                    console.log(err);
                }
            });

        });

    });

    client.on("addExpense", (data) => {
        const selectQuery = `select* from expense_manager where expense_area='${data.expenseArea}' and month_name='${currentMonth()}' and year=${currentYear()}`;
        executeQuery(selectQuery).then((expense) => {
            const id = expense[0].id;
            let totalExpense = expense[0].total_expense_amount;
            if (totalExpense) totalExpense = parseFloat(totalExpense) + parseFloat(data.amount);
            else totalExpense = parseFloat(data.amount);
            const updateQuery = `update expense_manager set total_expense_amount=${totalExpense} where id='${id}'`;
            executeQuery(updateQuery).then(() => {
                client.emit("expenseAdded");
            })
        })
    });
});

const getDistributionWithUserId = (userId) => {
    const selectQuery = `select* from expense_distribution where user_id='${userId}'`;
    return executeQuery(selectQuery);
}

const getDistributionWithId = (id) => {
    const selectQuery = `select* from expense_distribution where id='${id}'`;
    return executeQuery(selectQuery);
}

const connectSql = () => {
    const sqlDef = new Deferred();
    sql.connect(config, function (err) {
        if (err) {
            console.log(err);
            sqlDef.reject();
        }
        else {
            console.log("connected to mssql.");
            // create Request object
            const request = new sql.Request();
            sqlDef.resolve(request);
        }
    });
    return sqlDef;
}

const executeQuery = (query) => {
    const def = new Deferred();
    //close any existing connection.
    sql.close();
    connectSql().then((request) => {
        request.query(query, function (err, recordSet) {
            sql.close();
            if (err) console.log(err);
            else {
                def.resolve(recordSet.recordset)
            }
        });
    });
    return def;
}

const currentMonth = () => {
    var objDate = new Date();
    var locale = "en-us";
    return objDate.toLocaleString(locale, { month: "long" }).toLowerCase();
}

const currentYear = () => {
    const date = new Date();
    return date.getFullYear();
}


http.listen(port);
