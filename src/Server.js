const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 8080;
const sql = require('mssql');
const uuid = require('uuid/v1');
const nodemailer = require('nodemailer');
const Deferred = require('node-defer');
const Enumerable = require('../node_modules/linq');
const passwordGenerator = require('generate-password');

const config = {
    user: 'sa',
    password: 'admin123',
    server: 'DESKTOP-LR002GL',
    database: 'Expense Manager'
};

const configForDynamicQuery = {
    user: 'sa',
    password: 'admin123',
    server: 'DESKTOP-LR002GL',
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
            console.log(record);
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
            //make sure current month is present in months array.
            if (months.indexOf(currentMonth()) == -1) months.push(currentMonth());
            const years = Enumerable.from(record).select(x => x.year).distinct().toArray();
            if (years.indexOf(currentYear()) == -1) years.push(currentYear());
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
    client.on("doLogin", function (data) {
        makeSureDatabaseAndTablesExists().then(() => {
            const query = `select * from users_info where email='${data.username}' OR username='${data.userName}' AND pass='${data.password}'`;
            executeQuery(query).then((record) => {
                if (record.length > 0) {
                    client.emit("validUser", record);
                } else {
                    client.emit("loginFailed");
                    console.log("login failed");
                }
            })
        });

    });

    client.on("signIn", function (data) {
        console.log(data);
        makeSureDatabaseAndTablesExists().then(() => {
            const id = uuid();
            const query = `insert into users_info values('${id}', '${data.email}', '${data.userName}', '${data.fullName}', ${data.mobileNumber}, '${data.password}')`
            executeQuery(query).then((recordSet) => {
                client.emit("signedUpSuccessfully");
                console.log("sing up successfully");
                //need to handle this on client side.
                //client.emit("signUpFailed");
                //console.log(err);               
            })
        });

    });

    client.on("changePassword", (data) => {
        const userId = data.userId;
        if (!userId) {
            console.error("userId is not found.");
            res.send(null);
        } else {
            const passwordQuery = `select pass from users_info where id='${userId}'`;
            executeQuery(passwordQuery).then((password) => {
                console.log(password);
                if (password[0].pass != data.oldPassword) client.emit("incorrectOldPassword");
                else {
                    const updateQuery = `update users_info set pass='${data.newPassword}' where id='${userId}'`;
                    executeQuery(updateQuery).then(() => {
                        client.emit("passwordChangedSuccessfully");
                    })
                }
            });
        }
    })

    client.on('sendOtp', (emailAddress) => {
        let isRegisteredEmail = false;
        const selectQuery = `select * from users_info where email='${emailAddress}'`;
        executeQuery(selectQuery).then((record) => {
            if (record.length > 0) {
                const password = passwordGenerator.generate({
                    length: 6,
                    numbers: true
                });
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
                    subject: 'password',
                    text: `Your password is ${password}`
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    /**Need to generate otp send it and update database for it. */
                    if (error) {
                        client.emit('emailSendingFailed');
                        console.log(error);
                    } else {
                        const updateQuery = `update users_info set pass='${password}' where email='${emailAddress}'`;
                        executeQuery(updateQuery).then(() => {
                            client.emit('emailSendSuccessfully');
                            console.log('Email sent: ' + info.response);
                        });
                    }
                });
            } else {
                client.emit('emailNotRegistered');
            }
        })

    });

    client.on("editDistribution", (data) => {
        getDistributionWithId(data.id).then((distribution) => {
            const expenseArea = distribution[0].expense_area;
            const queryForExpenseDistribution = `update expense_distribution set expense_area='${data.expenseArea}' ,allocated_expense_amount=${data.allocatedAmount} 
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
                            client.emit("distributionDeleted");
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
            const def = new Deferred();
            if (!expense[0]) {
                getDistributionWithUserId(data.userId).then((record) => {
                    let queryForExpenseManager = 'insert into expense_manager(id,expense_area,allocated_expense_amount,user_id,month_name,year) values';
                    for (let i = 0; i < record.length; i++) {
                        if (i != record.length - 1) {
                            queryForExpenseManager = `${queryForExpenseManager}('${record[i].id}','${record[i].expense_area}',${record[i].allocated_expense_amount},'${record[i].user_id}','${currentMonth()}',${currentYear()}),`;
                        }
                        else {
                            queryForExpenseManager = `${queryForExpenseManager}('${record[i].id}','${record[i].expense_area}',${record[i].allocated_expense_amount},'${record[i].user_id}','${currentMonth()}',${currentYear()})`;
                        }
                    }
                    executeQuery(queryForExpenseManager).then(() => {
                        executeQuery(selectQuery).then((exp) => {
                            def.resolve(exp)
                        })
                    })
                });

            } else {
                def.resolve(expense);
            }
            def.then((expense) => {
                const id = expense[0].id;
                let totalExpense = expense[0].total_expense_amount;
                if (totalExpense) totalExpense = parseFloat(totalExpense) + parseFloat(data.amount);
                else totalExpense = parseFloat(data.amount);
                addExpense(totalExpense, id, data.userId, client);
            });
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

const connectSql = (conf) => {
    const sqlDef = new Deferred();
    sql.connect(conf || config, function (err) {
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

const addExpense = (totalExpense, id, userId, client) => {
    const updateQuery = `update expense_manager set total_expense_amount=${totalExpense} where id='${id}'`;
    executeQuery(updateQuery).then(() => {
        const query = `select* from expense_manager where user_id='${userId}' and month_name='${currentMonth().toLowerCase()}' 
        and year=${currentYear()}`
        executeQuery(query).then((record) => {
            client.emit("expenseAdded", JSON.stringify(record));
        });
    })
}

const executeQuery = (query, conf) => {
    const def = new Deferred();
    //close any existing connection.
    sql.close();
    connectSql(conf).then((request) => {
        request.query(query, function (err, recordSet) {
            sql.close();
            if (err) {
                console.log(err);
                def.reject(err);
            }
            else {
                def.resolve(recordSet.recordset)
            }
        });
    });
    return def;
}

const makeSureDatabaseAndTablesExists = () => {
    const query = `DECLARE @createDatabaseQuery NVARCHAR(MAX)=N'IF  NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = ''Expense Manager'')
    BEGIN
        CREATE DATABASE [Expense Manager]		
    END;'
	EXEC Sp_executesql @createDatabaseQuery

    DECLARE @createTablesQuery NVARCHAR(MAX)=N'USE [Expense Manager];
    IF  NOT EXISTS (SELECT * FROM sys.objects 
    WHERE object_id = OBJECT_ID(''[dbo].[expense_distribution]'') AND type in (''U''))
    BEGIN
        CREATE TABLE [dbo].[expense_distribution](
	        [id] [nvarchar](255) NULL,
	        [user_id] [nvarchar](255) NULL,
	        [expense_area] [nvarchar](255) NULL,
	        [allocated_expense_amount] [int] NULL
        )
    END
    IF  NOT EXISTS (SELECT * FROM sys.objects 
    WHERE object_id = OBJECT_ID(''[dbo].[users_info]'') AND type in (''U''))
    BEGIN
        CREATE TABLE [dbo].[users_info](
	        [id] [nvarchar](255) NULL,
	        [email] [nvarchar](255) NULL,
	        [username] [nvarchar](255) NULL,
	        [full_name] [nvarchar](255) NULL,
	        [mobile_number] [nvarchar](255) NULL,
	        [pass] [nvarchar](255) NULL
        )
    END
    IF  NOT EXISTS (SELECT * FROM sys.objects 
    WHERE object_id = OBJECT_ID(''[dbo].[expense_manager]'') AND type in (''U''))
    BEGIN
        CREATE TABLE [dbo].[expense_manager](
	        [id] [nvarchar](255) NULL,
	        [expense_area] [nvarchar](255) NULL,
	        [allocated_expense_amount] [decimal](38, 2) NULL,
	        [total_expense_amount] [decimal](38, 2) NULL,
	        [user_id] [nvarchar](255) NULL,
	        [month_name] [varchar](255) NULL,
	        [year] [int] NULL
        )
    END
    '
    EXEC Sp_executesql @createTablesQuery
    `
    return executeQuery(query, configForDynamicQuery);
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
