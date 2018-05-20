import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom'
import Toolbar from './Toolbar'
import History from './HistoryPage';
import Budget from './BudgetPage';
import Distribution from './DistributionPage';
import OverView from './OverViewPage';
import Login from './Login';
import cookie from 'react-cookies'


class Routes extends Component {
    constructor(props) {
        super(props);
        this.userId = props.userId;
        this.socket = props.socket;
        this.fullName = props.fullName;
    }
    render() {
        if (!this.userId) this.userId = cookie.load("userId");
        const isUserLoggedIn = () => {
            const isLoggedIn = this.userId;
            if (isLoggedIn) this.fullName = this.fullName || cookie.load("fullName");
            return isLoggedIn;
        }

        const logout = () => {
            this.userId = "";
            cookie.remove("userId");
        }
        return (
            <div id="pageContent" className="page-content">
                <Switch>
                    <Route exact path='/' render={(props) => (
                        isUserLoggedIn() ? (
                            <div id="main-page-container" >
                                <Toolbar socket={this.socket} userId={this.userId} fullName={this.fullName} />
                                <OverView socket={this.socket} userId={this.userId} /></div>) :
                            (<Redirect to="/login" />)
                    )} />
                    <Route path='/history' render={(props) => (
                        isUserLoggedIn() ? (
                            <div id="main-page-container">
                                <Toolbar socket={this.socket} userId={this.userId} fullName={this.fullName} />
                                <History socket={this.socket} userId={this.userId} /></div>
                        ) :
                            (<Redirect to="/login" />)
                    )} />
                    <Route path='/budget' render={(props) => (
                        isUserLoggedIn() ? (
                            <div id="main-page-container">
                                <Toolbar socket={this.socket} userId={this.userId} fullName={this.fullName} />
                                <Budget socket={this.socket} userId={this.userId} /></div>) :
                            (<Redirect to="/login" />)
                    )} />
                    <Route path='/distribution' render={(props) => (
                        isUserLoggedIn() ? (
                            <div id="main-page-container">
                                <Toolbar socket={this.socket} userId={this.userId} fullName={this.fullName} />
                                <Distribution socket={this.socket} userId={this.userId} /></div>) :
                            (<Redirect to="/login" />)
                    )} />
                    <Route path='/login' render={(props) => (
                        isUserLoggedIn() ? (<Redirect to="/" />) :
                            (<Login socket={this.socket} />)
                    )} />
                    <Route path='/logout' render={(props) => (
                        logout(),
                        (<Redirect to="/login" />)
                    )} />
                </Switch>
            </div>

        )
    }

}

export default Routes;