import React, { Component } from 'react';
import { BrowserRouter, Route, Link,Switch } from 'react-router-dom'
import Toolbar from './Toolbar'
import History from './HistoryPage';
import Budget from './BudgetPage';
import Distribution from './DistributionPage';
import OverView from './OverViewPage'


class Routes extends Component {
    constructor(props) {
        super(props);
        this.userId = props.userId;
        this.socket = props.socket;
    }
    render() {
        return (            
                <div id="pageContent" className="page-content">
                    <Switch>
                        <Route exact path='/' render={(props) => (
                            <OverView socket={this.socket} userId={this.userId} />
                        )} />
                        <Route path='/history' render={(props) => (
                            <History socket={this.socket} userId={this.userId} />
                        )} />
                        <Route path='/budget' render={(props) => (
                            <Budget socket={this.socket} userId={this.userId} />
                        )} />
                        <Route path='/distribution' render={(props) => (
                            <Distribution socket={this.socket} userId={this.userId} />
                        )} />
                    </Switch>
                </div>
            
        )
    }

}

export default Routes;