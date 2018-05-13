import React, { Component } from 'react';
import OverView from './OverViewPage';
import FolderBar from './FolderBarPage';
import './ToolbarPage.css';
import $ from 'jquery';
import AppBar from 'material-ui/AppBar';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import History from './HistoryPage'
import ReactDOM from 'react-dom';
import Budget from './BudgetPage';
import Distribution from './DistributionPage';
import FlatButton from 'material-ui/FlatButton';
import Login from './Login';
import cookie from 'react-cookies'
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import DropDownMenu from 'material-ui/DropDownMenu';
import Enumerable from '../node_modules/linq';
import { deepOrange500, transparent, white } from 'material-ui/styles/colors';
import Snackbar from 'material-ui/Snackbar';
import { Link } from 'react-router-dom';
import toastr from "toastr";
import './toastr.css'



class Toolbar extends Component {
    constructor(prop) {
        super(prop);
        const socket = prop.socket;
        const userId = prop.userId;
        this.fullName = prop.fullName;
        toastr.options = { closeButton: true, positionClass: "toast-top-right" };
        socket.on("expenseAdded", () => {
            toastr.success("Expense added successfully");
        });

        socket.on("passwordChangedSuccessfully", () => {
            toastr.success("Password changed successfully");
            this.closeDialog();
        });

        socket.on("incorrectOldPassword", () => {
            this.setState({ oldPassword: "Incorrect old password." });
        });
        this.openFolderBar = () => {
            this.setState({ isCollapsed: !this.state.isCollapsed })
        };

        this.handleClose = () => this.setState({ isCollapsed: false });

        this.state = {
            isCollapsed: false,
            showAddExpenseDialog: false,
            expenseAreas: [],
            selectedExpense: 1,
            notificationMessage: "",
            showChangePasswordDialog: false
        };

        this.addExpense = () => {
            const amount = document.getElementById("expenseAmount").value;
            if (!amount) {
                this.setState({ amountErrorText: "Expense amount must be specified." });
                return;
            }
            const expenseArea = this.state.expenseAreas[this.state.selectedExpense - 1];
            socket.emit("addExpense", { expenseArea: expenseArea, amount: amount, userId: userId });
            this.closeDialog();

        }

        this.closeDialog = () => {
            this.setState({ showAddExpenseDialog: false, oldPassword: "", newPassword: '', selectedExpense: 1, amountErrorText: "", showChangePasswordDialog: false });
        }

        this.onAmountChange = () => {
            this.setState({ amountErrorText: "" });
        }

        this.getExpenseAreas = () => {
            return new Promise((res, rej) => {
                $.ajax({
                    url: "http://127.0.0.1:8080/expenseDistribution",
                    cache: false,
                    data: { userId: userId },
                    success: (data) => {
                        res(Enumerable.from(JSON.parse(data)).select(x => x.expense_area).toArray());
                    },
                    error: (xhr, status, err) => {
                        console.error(this.props.url, status, err.toString());
                    }
                });
            });
        }

        this.getExpense = () => {
            let menus = [];
            for (let i = 0; i < this.state.expenseAreas.length; i++) {
                menus.push(<MenuItem value={i + 1} primaryText={this.state.expenseAreas[i]} />)
            }
            return menus;
        }

        this.showAddExpenseDialog = () => {
            this.getExpenseAreas().then((areas) => {
                this.setState({ showAddExpenseDialog: true, expenseAreas: areas });
            });
        }

        this.showChangePasswordDialog = () => {
            this.setState({ showChangePasswordDialog: true });
        }

        this.changePassword = () => {
            this.setState({ oldPassword: "", newPassword: '' });;
            const oldPassword = document.getElementById("oldPassword").value;
            const newPassword = document.getElementById("newPassword").value;
            const confirmNewPassword = document.getElementById("confirmOldPassword").value;
            let isValid = true;
            if (!oldPassword) {
                this.setState({ oldPassword: "Old password must be specified." });
                isValid = false;
            }

            if (!newPassword || !confirmNewPassword) {
                this.setState({ newPassword: "New password must be specified." });
                isValid = false;
            } else if (newPassword != confirmNewPassword) {
                this.setState({ newPassword: "New passwords are not same." });
                isValid = false;
            }
            if (!isValid) return;
            socket.emit("changePassword", { oldPassword: oldPassword, newPassword: newPassword, userId: userId });

        }

        this.selectExpense = (event, index, value) => {
            this.setState({ selectedExpense: value });
        }
    }

    render() {
        const menuStyle = {
            color: 'white',
            'font-size': '25px',
            backgroundColor: 'rgb(0, 188, 212)',
            paddingBottom: '10px'
        }
        const customContentStyle = {
            width: '500px',
            maxWidth: 'none',
        };

        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onClick={this.closeDialog}
            />,
            <FlatButton
                label="Add"
                primary={true}
                onClick={this.addExpense}
            />,
        ];
        const ddstyles = {
            customWidth: {
                width: 275,
            },
        };

        const notificationStyle = {
            backgroundColor: '#3071a9',
            'border-color': '#285e8e',
            fontFamily: 'verdana',
            'font-size': '15px'
        }

        return (

            <div className="header-container">

                <MuiThemeProvider>
                    <AppBar
                        title="Expense Manager"
                        iconClassNameRight="muidocs-icon-navigation-expand-more"
                        onLeftIconButtonClick={this.openFolderBar}
                        iconElementRight={<div className="app-bar-right-element">{this.fullName}<IconMenu
                            iconButtonElement={
                                <IconButton><MoreVertIcon style={{ color: white }} /></IconButton>
                            }
                            targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                        >
                            <MenuItem primaryText="Add Expense" onClick={this.showAddExpenseDialog} />
                            <MenuItem primaryText="Change Password" onClick={this.showChangePasswordDialog} />
                            <Link to="/logout" className="menu-item">Sign out</Link>

                        </IconMenu></div>}
                    />
                </MuiThemeProvider>
                <div className="page-container">
                    <MuiThemeProvider>
                        <Drawer docked={false} open={this.state.isCollapsed} onRequestChange={this.handleClose}>
                            <MenuItem disabled={true} style={menuStyle}>Expense Manager</MenuItem>
                            <Link to="/" className="menu-item" onClick={this.handleClose}>Dashboard</Link>
                            <Link to="/history" className="menu-item" onClick={this.handleClose}>History</Link>
                            <Link to="/budget" className="menu-item" onClick={this.handleClose}>Budget</Link>
                            <Link to="/distribution" className="menu-item" onClick={this.handleClose}>Distribution</Link>
                        </Drawer>
                    </MuiThemeProvider>
                    <MuiThemeProvider>

                        <Dialog
                            title="Add Expense"
                            actions={actions}
                            modal={true}
                            open={this.state.showAddExpenseDialog}
                            contentStyle={customContentStyle}>

                            <TextField id="expenseAmount" errorStyle={{ fontFamily: 'verdana' }} type="number" onChange={this.onAmountChange}
                                floatingLabelText="Expense amount" hintText="Expense amount" errorText={this.state.amountErrorText} />
                            <br />
                            <DropDownMenu value={this.state.selectedExpense} style={ddstyles.customWidth} autoWidth={false} onChange={this.selectExpense}>
                                {this.getExpense()}
                            </DropDownMenu>

                        </Dialog>
                    </MuiThemeProvider>
                    <MuiThemeProvider>
                        <Dialog
                            title="Change Password"
                            actions={[
                                <FlatButton
                                    label="Cancel"
                                    primary={true}
                                    onClick={this.closeDialog}
                                />,
                                <FlatButton
                                    label="Change password"
                                    primary={true}
                                    onClick={this.changePassword}
                                />,
                            ]}
                            modal={true}
                            open={this.state.showChangePasswordDialog}
                            contentStyle={customContentStyle}>

                            <TextField id="oldPassword" type="password" errorStyle={{ fontFamily: 'verdana' }}
                                floatingLabelText="Old Password" hintText="Old Password" errorText={this.state.oldPassword} />
                            <br />
                            <TextField id="newPassword" type="password" errorStyle={{ fontFamily: 'verdana' }}
                                floatingLabelText="New Password" hintText="New Password" />
                            <br />
                            <TextField id="confirmOldPassword" type="password" errorStyle={{ fontFamily: 'verdana' }}
                                floatingLabelText="Confirm New Password" hintText="Confirm New Password" errorText={this.state.newPassword} />

                        </Dialog>
                    </MuiThemeProvider>
                </div>
            </div>


        )
    }
}

export default Toolbar;