import React, { Component } from 'react';
import Enumerable from '../node_modules/linq';
import './DistributionPage.css';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TextField from 'material-ui/TextField';
import Button from './Button';
import SimpleTable from './SimpleTable';
import DeleteIcon from 'react-material-icons/icons/action/delete';
import EditIcon from 'react-material-icons/icons/image/edit';
import ReactDOMServer from 'react-dom/server';
import Paper from 'material-ui/Paper';
import openSocket from 'socket.io-client';
import $ from 'jquery';


class Distribution extends Component {
    constructor(prop) {
        super(prop);
        const socket = prop.socket;
        this.userId = prop.userId
        socket.on("refreshDistribution", (data) => {
            this.refreshDistribution(JSON.parse(data));
        });

        this.state = {
            showAddDistributionDialog: false,
            nameErrorText: '',
            amountErrorText: '',
            showConfirmationDialog: false,
            dialogTitle: "",
            distributionName: "",
            totalExpense: "",
            buttonName: "Save",
            isMultiLine: false,
            numberOfRows: 2,
            buttonClick: () => { this.addDistribution() }
        };

        this.expenses = [];
        const deleteIcon = <MuiThemeProvider><DeleteIcon className="delete-icon" /></MuiThemeProvider>;
        const editIcon = <MuiThemeProvider><EditIcon /></MuiThemeProvider>;

        this.populateDistributionTable = () => {
            const totalExpense = Enumerable.from(this.expenses).select(x => x.totalExpense).sum();
            const distributionContainer = document.getElementById('distributionTable');
            this.expenses.forEach((element, index) => {
                let lastColumnClass = '';
                if (this.expenses.length == index + 1) {
                    lastColumnClass = "last-column";
                }
                distributionContainer.innerHTML += `               
                <div class='expense-area ${lastColumnClass}'>${element.expenseArea}</div>
                <div class='total-expense ${lastColumnClass}'>${element.totalExpense}</div>
                <div class='${lastColumnClass}'>${((element.totalExpense * 100) / totalExpense).toFixed(2)}%</div>  
                <div id='iconsContainer' class='icons-container ${lastColumnClass}'> 
                <a class='edit-icon material-icons' expenseArea='${element.expenseArea}' totalExpense='${element.totalExpense}' expenseId='${element.id}'>               
                ${ReactDOMServer.renderToStaticMarkup(editIcon)}  
                </a>
                <a id='deleteIcon' class='material-icons' expenseId='${element.id}'>   
                ${ReactDOMServer.renderToStaticMarkup(deleteIcon)} 
                </a>   
                </div>          
                `;
            });
        }

        this.onClick = (event) => {
            let isDeleteAction = event.path.filter(function (n) { if (n.id == "deleteIcon") return n; });
            if (isDeleteAction.length) {
                const id = isDeleteAction[0].getAttribute("expenseId")
                this.deleteDistribution(id);
            }

            let isEditIcon = event.path.filter(function (n) { if (Enumerable.from(n.classList).any(x => x == "edit-icon")) return n; });
            if (isEditIcon.length) {
                const name = isEditIcon[0].getAttribute("expenseArea");
                const totalExpense = isEditIcon[0].getAttribute("totalExpense")
                const id = isEditIcon[0].getAttribute("expenseId")
                this.editDistribution(name, totalExpense, id);
            }
        }

        this.deleteDistribution = (id) => {
            this.setState({
                showConfirmationDialog: true, buttonName: "Delete", buttonClick: () => {
                    socket.emit("deleteDistribution", { id: id, userId: this.userId });
                    this.closeDialog();
                }
            });
        }

        this.editDistribution = (expenseArea, totalExpense, id) => {
            this.setState({
                numberOfRows: 1, isMultiLine: false, showAddDistributionDialog: true, dialogTitle: "Edit Distribution", distributionName: expenseArea, totalExpense: totalExpense, buttonName: "Save", buttonClick: () => {
                    const distributions = document.getElementById('distributionName').value;
                    const amounts = document.getElementById('amountValue').value;
                    socket.emit("editDistribution", { id: id, expenseArea: distributions, allocatedAmount: amounts, userId: this.userId });
                    this.closeDialog();
                }
            });
        }

        this.addNewDistribution = () => {
            this.setState({ numberOfRows: 2, isMultiLine: true, showAddDistributionDialog: true, dialogTitle: "Add Distribution", distributionName: "", totalExpense: "", buttonName: "Add", buttonClick: () => { this.addDistribution() } });
        }
        this.closeDialog = () => {
            this.setState({ showAddDistributionDialog: false, nameErrorText: '', amountErrorText: '', showConfirmationDialog: false });
        }

        this.addDistribution = () => {
            const isValid = this.validate();
            if (isValid) {
                const distributions = document.getElementById('distributionName').value.split("\n");
                const amounts = document.getElementById('amountValue').value.split("\n");
                socket.emit("addDistribution", {
                    distributions: distributions,
                    amounts: amounts,
                    userId: this.userId
                });
                this.closeDialog();
            }
        }

        this.refreshDistribution = (distributions) => {
            const distributionTable = document.getElementById('distributionTable');
            distributionTable.innerHTML = "";
            this.expenses = [];
            distributions.forEach((distribution) => {
                this.expenses.push({ id: distribution.id, expenseArea: distribution.expense_area, totalExpense: distribution.allocated_expense_amount });
            });
            this.populateDistributionTable();
            distributionTable.onclick = this.onClick.bind(this);
        }

        this.validate = () => {
            const distributionNameText = document.getElementById('distributionName').value;
            const amountValue = parseFloat(document.getElementById('amountValue').value);
            let isValid = distributionNameText && amountValue;
            if (!distributionNameText) {
                this.setState({ nameErrorText: 'Distribution name must be specified.' });
            }
            else {
                const distributions = distributionNameText.split("\n");
                const duplicateDistributions = distributions.filter((value) => {
                    const expense= Enumerable.from(this.expenses).where(x=>x.expenseArea==value).firstOrDefault(null);
                    if (expense!=null) return expense.expenseArea;
                });
                if (duplicateDistributions.length) {
                    this.setState({ nameErrorText: `${duplicateDistributions.join(',')} already exits.` });
                    isValid = false;
                }
            }
            if (!amountValue)
                this.setState({ amountErrorText: 'Amount must be specified.' });

            return isValid;
        }

    }

    render() {
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onClick={this.closeDialog}
            />,
            <FlatButton
                label={this.state.buttonName}
                primary={true}
                onClick={this.state.buttonClick}
            />,
        ];

        const customContentStyle = {
            width: '500px',
            maxWidth: 'none',
        };

        const style = {
            height: '60%',
            width: '40%',
            margin: 20,
            textAlign: 'left',
            display: 'inline-block',
        };

        const onDistributionNameChange = (event, newValue) => {
            if (newValue) {
                this.setState({ nameErrorText: '' })
            }
        }
        const onDistributionAmountChange = (event, newValue) => {
            if (newValue) {
                this.setState({ amountErrorText: '' })
            }
        };

        return (
            <div id="distributionContainer" className="distribution-container" >
                <MuiThemeProvider>
                    <Paper style={style} zDepth={4} rounded={false}>
                        <div id="distributionTable" className="distribution-table">

                        </div>


                        <div className="add-new-link">
                            <FlatButton label="Add Distributions" primary={true} onClick={() => {
                                this.addNewDistribution();
                            }} />
                        </div>
                    </Paper>
                </MuiThemeProvider>

                <MuiThemeProvider>

                    <Dialog
                        title={this.state.dialogTitle}
                        actions={actions}
                        modal={true}
                        open={this.state.showAddDistributionDialog}
                        contentStyle={customContentStyle}>

                        <TextField id="distributionName" multiLine={this.state.isMultiLine} rows={this.state.numberOfRows} defaultValue={this.state.distributionName} errorStyle={{ fontFamily: 'verdana' }} onChange={onDistributionNameChange}
                            floatingLabelText="Distributions" hintText="Put one distribution name per line" errorText={this.state.nameErrorText} />
                        <br />
                        <br />
                        <TextField id="amountValue" multiLine={this.state.isMultiLine} rows={this.state.numberOfRows} defaultValue={this.state.totalExpense} errorStyle={{ fontFamily: 'verdana' }} type="number" onChange={onDistributionAmountChange}
                            floatingLabelText="Distributions amount" hintText="Put one distribution amount per line" errorText={this.state.amountErrorText} />

                    </Dialog>
                </MuiThemeProvider>
                <MuiThemeProvider>
                    <Dialog
                        actions={actions}
                        modal={false}
                        open={this.state.showConfirmationDialog}
                        onRequestClose={this.handleClose}
                        contentStyle={customContentStyle}>

                        Are you sure you want to delete this distribution?
                    </Dialog>

                </MuiThemeProvider>
            </div>
        )
    }

    componentDidMount() {
        $.ajax({
            url: "http://127.0.0.1:8080/expenseDistribution",
            cache: false,
            data: { userId: this.userId },
            success: (data) => {
                this.refreshDistribution(JSON.parse(data));
                console.log(data)
            },
            error: (xhr, status, err) => {
                console.error(this.props.url, status, err.toString());
            }
        });
    }
}


export default Distribution;