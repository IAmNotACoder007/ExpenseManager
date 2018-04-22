import React, { Component } from 'react';
import './App.css';
import Login from './Login';
import openSocket from 'socket.io-client';
import cookie from 'react-cookies'
import Toolbar from './Toolbar'


class App extends Component {
  constructor() {
    super();
    this.userId = cookie.load("userId");
    this.fullName = cookie.load("fullName");
  }
  render() {
    const socket = openSocket('http://127.0.0.1:8080');
    if (this.userId) {
      return (
        <div id="main-page-container" style={{ height: '100%' }}>
          <Toolbar socket={socket} userId={this.userId} fullName={this.fullName} />
        </div>
      )
    } else {
      return (
        <div id="main-page-container" style={{ height: '100%' }}>
          <Login socket={socket} userId={this.userId}/>
        </div>
      )
    }
  }
}

export default App;
