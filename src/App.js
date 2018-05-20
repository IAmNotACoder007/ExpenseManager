import React, { Component } from 'react';
import './App.css';
import openSocket from 'socket.io-client';
import cookie from 'react-cookies'
import Routes from './routes'


class App extends Component {
  constructor() {
    super();
    this.userId = cookie.load("userId");
    this.fullName = cookie.load("fullName");
  }
  render() {
    const socket = openSocket('http://127.0.0.1:8080');

    return (
      <Routes socket={socket} userId={this.userId} />
    )
  }
}

export default App;
