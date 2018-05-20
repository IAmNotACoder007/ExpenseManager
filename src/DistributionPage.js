import React, { Component } from 'react';
import Enumerable from '../node_modules/linq';
import './DistributionPage.css';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TextField from 'material-ui/TextField';
import DeleteIcon from 'react-material-icons/icons/action/delete';
import EditIcon from 'react-material-icons/icons/image/edit';
import Paper from 'material-ui/Paper';
import $ from 'jquery';
import toastr from "toastr";
import './toastr.css'


class Distribution extends Component {
    constructor(prop) {
        super(prop);
        const socket = prop.socket;
        this.userId = prop.userId
        socket.on("refreshDistribution", (data) => {
            this.refreshDistribution(JSON.parse(data));
        });
        toastr.options = { closeButton: true, positionClass: "toast-top-right", preventDuplicates: true };
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
            buttonClick: () => { this.addDistribution() },           
            expenses: [],
        };

        this.expenses = [];        
        this.populateDistributionTable = () => {
            const expense = this.state.expenses;
            const totalExpense = Enumerable.from(expense).select(x => x.totalExpense).sum();
            let expenseJsx = []
            expense.forEach((element, index) => {
                let lastColumnClass = '';
                if (expense.length === index + 1) {
                    lastColumnClass = "last-column";
                }

                expenseJsx.push(<div key={element.id} className={`expense-row ${lastColumnClass}`}>
                    <div className='expense-area' style={{ flex: '1' }}>{element.expenseArea}</div>
                    <div className='total-expense' style={{ width: '30%' }}>{element.totalExpense}</div>
                    <div style={{ width: '30%' }}>{((element.totalExpense * 100) / totalExpense).toFixed(2)}%</div>
                    <div id='iconsContainer' className='icons-container'>
                        <a className='edit-icon material-icons'>
                            <MuiThemeProvider><EditIcon onClick={() => { this.editDistribution(element.expenseArea, element.totalExpense, element.id) }} /></MuiThemeProvider>
                        </a>
                        <a id='deleteIcon' className='material-icons'>
                            <MuiThemeProvider><DeleteIcon onClick={() => { this.deleteDistribution(element.id) }} /></MuiThemeProvider>
                        </a>
                    </div>
                </div>)

            });
            if (!expenseJsx.length) expenseJsx.push(<div key={'noDistributionFound'} className="no-distribution-found" style={{ display: 'flex' }}>No distribution found</div>)
            return expenseJsx;

        }       

        this.deleteDistribution = (id) => {
            this.setState({
                showConfirmationDialog: true, buttonName: "Delete", buttonClick: () => {
                    socket.emit("deleteDistribution", { id: id, userId: this.userId });
                    socket.on("distributionDeleted", () => {
                        toastr.info("Distribution deleted");
                    })
                    this.closeDialog();
                }
            });
        }

        this.editDistribution = (expenseArea, totalExpense, id) => {
            this.setState({
                numberOfRows: 1, isMultiLine: false, showAddDistributionDialog: true, dialogTitle: "Edit Distribution", distributionName: expenseArea, totalExpense: totalExpense, buttonName: "Save", buttonClick: () => {
                    const isValid = this.validate(expenseArea);
                    if (isValid) {
                        const distributions = document.getElementById('distributionName').value;
                        const amounts = document.getElementById('amountValue').value;
                        socket.emit("editDistribution", { id: id, expenseArea: distributions, allocatedAmount: amounts, userId: this.userId });
                        this.closeDialog();
                    }
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
                let distributions = document.getElementById('distributionName').value.trim().split("\n");
                let amounts = document.getElementById('amountValue').value.trim().split("\n");
                //need to make sure that distribution and amount must be of same size.
                const noOfDistributions = distributions.length;
                const noOfAmounts = amounts.length;
                if (noOfDistributions !== noOfAmounts) {
                    if (noOfDistributions > noOfAmounts) distributions = distributions.slice(0, noOfAmounts);
                    else if (noOfDistributions < noOfAmounts) amounts = amounts.slice(0, noOfDistributions);
                }
                socket.emit("addDistribution", {
                    distributions: distributions,
                    amounts: amounts,
                    userId: this.userId
                });
                this.closeDialog();
            }
        }

        this.refreshDistribution = (distributions) => {
            let expenses = [];
            distributions.forEach((distribution) => {
                expenses.push({ id: distribution.id, expenseArea: distribution.expense_area, totalExpense: distribution.allocated_expense_amount });
            });
            this.setState({ expenses: expenses });
        }

        this.validate = (expenseArea) => {
            const distributionNameText = document.getElementById('distributionName').value;
            const amountValue = parseFloat(document.getElementById('amountValue').value);
            let isValid = distributionNameText && amountValue;
            if (!distributionNameText) {
                this.setState({ nameErrorText: 'Distribution name must be specified.' });
            }
            else {
                const distributions = distributionNameText.split("\n");
                const duplicateDistributions = distributions.filter((value) => {
                    const expense = Enumerable.from(this.expenses).where(x => x.expenseArea === value).firstOrDefault(null);
                    if (expense != null) return expense.expenseArea;
                });
                if (duplicateDistributions.length) {
                    if (!expenseArea || expenseArea !== duplicateDistributions) {
                        this.setState({ nameErrorText: `${duplicateDistributions.join(',')} already exits.` });
                        isValid = false;
                    }
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
            height: '70%',
            width: '50%',
            margin: 20,
            textAlign: 'left',
            display: 'inline-block',
            position: 'relative'
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
                    <Paper style={style} zDepth={1} rounded={false}>
                        <div id="distributionTable" className="distribution-table custom-scrollBar">
                            {this.populateDistributionTable()}
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
            },
            error: (xhr, status, err) => {
                console.error(this.props.url, status, err.toString());
            }
        });
    }
}


export default Distribution;