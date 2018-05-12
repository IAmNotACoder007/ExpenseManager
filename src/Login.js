import React, { Component } from 'react';
import Paper from 'material-ui/Paper';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import './LoginPageStyle.css'
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Toolbar from './Toolbar'
import ReactDOM from 'react-dom';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import Dialog from 'material-ui/Dialog';
import openSocket from 'socket.io-client';
import CircularProgress from 'material-ui/CircularProgress';
import ReactDOMServer from 'react-dom/server';
import cookie from 'react-cookies';
import Routes from './routes';
import {
    BrowserRouter as Router,
    Route,
    Link,
    Redirect,
    withRouter
} from "react-router-dom";



class Login extends Component {
    constructor(prop) {
        super(prop);
        const socket = prop.socket;      
        const progressBar = <MuiThemeProvider> <CircularProgress size={80} thickness={5} /></MuiThemeProvider>;
        this.state = {
            userNameErrorText: '',
            passwordErrorText: '',
            showSignInDialog: false,
            signInPasswordErrorText: '',
            signInUserNameErrorText: '',
            signInEmailErrorText: '',
            signInFullNameErrorText: '',
            signInMobileErrorText: '',
            showSpinner: 'none',
            disabledButton: false,
            showConfirmationDialog: false,
            otpEmailAddress: '',
            confirmationMsg: "Congratulations!! you have been registered successfully.",
            loginBoxStyle: '350px',
            redirect: false,
        }


        const dbConfig = {
            server: "DESKTOP-LR002GL",
            database: "Expense Manager",
            user: "sa",
            password: "admin123",
            port: 1433
        };
        this.setCookie = (name, val) => {
            cookie.save(name, val, { path: "/" });
        };

        this.doLogin = () => {
            const userName = document.getElementById("userName").value;
            const password = document.getElementById("password").value;
            const isAuthenticUser = (userName && password);
            if (!userName) this.setState({ userNameErrorText: 'username or email must be specified.' });
            if (!password) this.setState({ passwordErrorText: 'password must be specified.' });
            if (isAuthenticUser) {
                socket.emit('doLogin', { userName: userName, password: password });
                socket.on('validUser', (data) => {
                    this.setCookie("userId", data[0].id);
                    this.setCookie("fullName", data[0].full_name)
                    this.setState({ redirect: true });
                    //  ReactDOM.render(<Routes socket={socket} userId={data[0].id} fullName={data[0].full_name} />);
                });

                socket.on('loginFailed', () => {
                    this.setState({ passwordErrorText: 'username or password is not correct.' });
                })
            } else {
                this.setState({ loginBoxStyle: '375px' });
            }
        }

        this.signInNewUser = () => {
            const email = document.getElementById("signInEmail").value;
            const fullName = document.getElementById("signInFullName").value;
            const userName = document.getElementById("signInUserName").value;
            const mobileNumber = document.getElementById("signInMobile").value;
            const password = document.getElementById("signInPassword").value;
            if (!email) this.setState({ signInEmailErrorText: 'Email must be specified.' });
            if (!fullName) this.setState({ signInFullNameErrorText: 'Full name must be specified.' });
            if (!userName) this.setState({ signInUserNameErrorText: 'Username must be specified.' });
            if (!mobileNumber) this.setState({ signInMobileErrorText: 'Mobile number must be specified.' });
            if (!password) this.setState({ signInPasswordErrorText: 'Password must be specified.' });
            const isValid = (email && fullName && userName && mobileNumber && password);
            if (isValid) {
                this.setState({ showSpinner: 'block', disabledButton: true });
                socket.emit('signIn', {
                    email: email,
                    fullName: fullName,
                    userName: userName,
                    mobileNumber: mobileNumber,
                    password: password
                });

                socket.on("signedUpSuccessfully", (data) => {
                    this.closeDialog();
                    this.setState({ showConfirmationDialog: true });
                })

                //put some spinner here and close the dialog once signIn finished
                //after that show some confirmation dialog for user.
                // this.closeDialog();

            }
        }

        this.closeDialog = () => {
            this.setState({
                showSignInDialog: false,
                signInEmailErrorText: '',
                signInFullNameErrorText: '',
                signInUserNameErrorText: '',
                signInMobileErrorText: '',
                signInPasswordErrorText: '',
                showConfirmationDialog: false,
                showSpinner: 'none',
                disabledButton: false,
                showSendPasswordDialog: false
            });
        }

        this.sendEmail = () => {
            const emailAddress = document.getElementById('otp').value;
            if (!emailAddress) {
                this.setState({ otpEmailAddress: 'Email Address must be specified.' })
            } else {
                this.setState({ showSpinner: true, disabledButton: true });
                socket.emit('sendOtp', emailAddress);

                socket.on("emailSendSuccessfully", () => {
                    this.closeDialog();
                    this.setState({ showConfirmationDialog: true, confirmationMsg: `Your password has been send on '${emailAddress}'` });
                })

                socket.on("emailSendingFailed", () => {
                    this.closeDialog();
                    this.setState({ showConfirmationDialog: true, confirmationMsg: `Enable to send email on '${emailAddress}', please verify your email or try again later.` });
                });

                socket.on("emailNotRegistered", () => {
                    this.setState({ otpEmailAddress: `'${emailAddress}' is not registered.`, showSpinner: 'none', disabledButton: false });
                });
            }
        }
    }

    render() {
        const onUserNameChange = (event, newValue) => {
            if (newValue) {
                this.setState({ userNameErrorText: '', loginBoxStyle: '350px' })
            }
        }
        const onPasswordChange = (event, newValue) => {
            if (newValue) {
                this.setState({ passwordErrorText: '', loginBoxStyle: '350px' })
            }
        };

        const onSignInUserNameChange = (event, newValue) => {
            //Need to verify if the username is already taken.
            if (newValue) this.setState({ signInUserNameErrorText: '' });
        }

        const onSignInPasswordChange = (event, newValue) => {
            if (newValue) this.setState({ signInPasswordErrorText: '' });
        }

        const onSignInEmailChange = (event, newValue) => {
            if (newValue && newValue.indexOf('@') == -1) this.setState({ signInEmailErrorText: 'Email must contains @.' });
            else if (newValue) this.setState({ signInEmailErrorText: '' });
        }

        const onSignInFullNameChange = (event, newValue) => {
            if (newValue) this.setState({ signInFullNameErrorText: '' });
        }

        const onSignInMobileChange = (event, newValue) => {
            if (newValue && newValue.length != 10) this.setState({ signInMobileErrorText: 'Please enter a valid mobile number.' });
            else if (newValue) this.setState({ signInMobileErrorText: '' });
        }
        const style = {
            height: this.state.loginBoxStyle,
            width: '405px',
            margin: 20,
            textAlign: 'left',
            display: 'inline-block',
        };

        const linkStyle = {
            color: 'rgb(255, 64, 129)',
            'font-size': '15px',
            'padding-right': '15px'
        }

        const styles = {
            title: {
                cursor: 'pointer',
            },
        };

        const signInDialogActions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onClick={this.closeDialog}
                disabled={this.state.disabledButton}
            />,
            <FlatButton
                label="Register Me"
                primary={true}
                onClick={this.signInNewUser}
                disabled={this.state.disabledButton}
            />,
        ];

        const otpDialogActions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onClick={this.closeDialog}
                disabled={this.state.disabledButton}
            />,
            <FlatButton
                label="Send"
                primary={true}
                onClick={this.sendEmail}
                disabled={this.state.disabledButton}
            />,
        ];

        const confirmationDialogActions = [
            <FlatButton
                label="Dismiss"
                primary={true}
                onClick={this.closeDialog}
            />
        ]

        const signInDialogStyle = {
            width: '400px',
            maxWidth: 'none',

        };

        const customContentStyle = {
            width: '500px',
            maxWidth: 'none',
        };

        const spinnerStyle = {
            display: this.state.showSpinner,
            position: 'absolute',
            left: '78%',
            bottom: '2%'
        }
        const otpSpinnerStyle = {
            display: this.state.showSpinner,
            position: 'absolute',
            left: '87%',
            bottom: '4%'
        }

        if (this.state.redirect) {
            return <Redirect to="/"/>;
        }

        return (
            <div className="login-page-container">
                <MuiThemeProvider>

                    <Paper style={style} zDepth={1} rounded={false}>
                        <AppBar iconClassNameLeft="icon-left"
                            title={<span style={styles.title}>Expense Manager</span>}
                            iconElementRight={<FlatButton label="Sign Up" onClick={() => {
                                this.setState({ showSignInDialog: true });
                            }} />}
                            iconElementLeft={<div style={{ display: 'none' }} />}
                        />
                        <div className="login-page">
                            <TextField fullWidth={true} id="userName" errorStyle={{ fontFamily: 'verdana' }} onChange={onUserNameChange}
                                floatingLabelText="username or email" errorText={this.state.userNameErrorText} />
                            <TextField fullWidth={true} id="password" floatingLabelText="password" errorStyle={{ fontFamily: 'verdana' }} type="password" onChange={onPasswordChange}
                                errorText={this.state.passwordErrorText} />
                            <br />
                            <div className="login-button">
                                <RaisedButton fullWidth={true} label="Login" primary={true} onClick={() => {
                                    this.doLogin();
                                }} />
                            </div>
                            <a className="links" style={linkStyle} onClick={() => {
                                this.setState({ showSendPasswordDialog: true })
                            }}>Forgot Password?</a>
                        </div>
                    </Paper>

                </MuiThemeProvider>

                <MuiThemeProvider>

                    <Dialog
                        title="Sign Up"
                        actions={signInDialogActions}
                        modal={true}
                        autoScrollBodyContent={true}
                        open={this.state.showSignInDialog}
                        contentStyle={signInDialogStyle}>
                        <TextField fullWidth={true} id="signInEmail" errorStyle={{ fontFamily: 'verdana' }} onChange={onSignInEmailChange}
                            floatingLabelText="Email" errorText={this.state.signInEmailErrorText} />
                        <TextField fullWidth={true} id="signInFullName" errorStyle={{ fontFamily: 'verdana' }} onChange={onSignInFullNameChange}
                            floatingLabelText="Full Name" errorText={this.state.signInFullNameErrorText} />
                        <TextField fullWidth={true} id="signInUserName" errorStyle={{ fontFamily: 'verdana' }} onChange={onSignInUserNameChange}
                            floatingLabelText="Username" errorText={this.state.signInUserNameErrorText} />
                        <TextField fullWidth={true} id="signInMobile" errorStyle={{ fontFamily: 'verdana' }} onChange={onSignInMobileChange}
                            floatingLabelText="Mobile Number" type="number" errorText={this.state.signInMobileErrorText} />
                        <TextField fullWidth={true} id="signInPassword" errorStyle={{ fontFamily: 'verdana' }} type="password" onChange={onSignInPasswordChange}
                            floatingLabelText="Password" errorText={this.state.signInPasswordErrorText} />
                        <CircularProgress style={spinnerStyle} size={30} thickness={3} />
                    </Dialog>
                </MuiThemeProvider>

                <MuiThemeProvider>
                    <Dialog
                        actions={confirmationDialogActions}
                        modal={false}
                        open={this.state.showConfirmationDialog}
                        onRequestClose={this.handleClose}
                        contentStyle={customContentStyle}>

                        {this.state.confirmationMsg}
                    </Dialog>
                </MuiThemeProvider>

                <MuiThemeProvider>
                    <Dialog
                        actions={otpDialogActions}
                        modal={true}
                        open={this.state.showSendPasswordDialog}
                        onRequestClose={this.handleClose}
                        contentStyle={customContentStyle}>

                        <TextField fullWidth={true} id="otp" errorStyle={{ fontFamily: 'verdana' }} onChange={onSignInEmailChange}
                            floatingLabelText="Enter your registered Email" errorText={this.state.otpEmailAddress} />
                        <CircularProgress style={otpSpinnerStyle} size={30} thickness={3} />
                    </Dialog>
                </MuiThemeProvider>
            </div>
        )


    }
}

export default Login;