import React, { Component } from 'react';
import Paper from 'material-ui/Paper';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import './HistoryPageStyle.css';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import Enumerable from '../node_modules/linq';
import Divider from 'material-ui/Divider';
import ReactDOMServer from 'react-dom/server';
import $ from 'jquery';



class History extends Component {
    constructor(prop) {
        super(prop);
        const socket = prop.socket;
        this.userId = prop.userId;
        this.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        this.monthNames = [];
        this.years = []
        this.expenses = []
        this.date = new Date();

        this.state = {
            selectedMonth: 0,
            selectedYear: 0,
            totalExpense: 0
        }

        this.getMonthsMenu = () => {
            let menus = [];
            for (let i = 0; i < this.monthNames.length; i++) {
                menus.push(<MenuItem value={i + 1} primaryText={this.monthNames[i]} />)
            }
            return menus;
        }

        this.getYearsMenu = () => {
            let menus = [];
            for (let i = 0; i < this.years.length; i++) {
                menus.push(<MenuItem value={i + 1} primaryText={this.years[i]} />)
            }
            return menus;
        }

        const divider = <MuiThemeProvider> <Divider /> </MuiThemeProvider>;

        this.populateDistributionTable = () => {
            const distributionContainer = document.getElementById('historyDistributionTable');
            this.expenses.forEach((element, index) => {
                let lastColumnClass = '';
                if (this.expenses.length == index + 1) {
                    lastColumnClass = "last-column";
                }
                distributionContainer.innerHTML += `               
                <div class='expense-area row ${lastColumnClass}'>${element.expenseArea}</div>
                <div class='total-expense row ${lastColumnClass}'>${element.totalExpense}</div>
                <div class='row ${lastColumnClass}'>${((element.totalExpense * 100) / this.state.totalExpense).toFixed(2)}%</div>                       
                `;
            });
        }

        this.handleMonthChange = (event, index, value) => {
            this.setState({ selectedMonth: value });
            this.refreshHistoryTable(value, undefined);
        }

        this.handleYearChange = (event, index, value) => {
            this.setState({ selectedYear: value });
            this.refreshHistoryTable(undefined, value);
        }

        this.refreshHistoryTable = (month, year) => {
            const selectedMonth = this.monthNames[(month || this.state.selectedMonth) - 1];
            const selectedYear = this.years[(year || this.state.selectedYear) - 1];

            $.ajax({
                url: "http://127.0.0.1:8080/getHistoryForMonthAndYear",
                cache: false,
                data: { userId: this.userId, month: selectedMonth, year: selectedYear },
                success: (data) => {
                    const history = JSON.parse(data);
                    this.expenses = [];
                    document.getElementById('historyDistributionTable').innerHTML = '';
                    history.forEach((expense, index) => {
                        this.expenses.push({ expenseArea: expense.expense_area, totalExpense: expense.total_expense_amount });
                    });
                    const totalExpense = Enumerable.from(this.expenses).select(x => x.totalExpense).sum();
                    this.setState({ totalExpense: totalExpense });
                    this.populateDistributionTable();
                },
                error: (xhr, status, err) => {
                    console.error(this.props.url, status, err.toString());
                }
            });
        }


    }

    render() {
        const style = {
            height: '60%',
            width: '45%',
            margin: 20,
            textAlign: 'left',
            display: 'inline-block',
        };

        const ddstyles = {
            customWidth: {
                width: 150,
            },
        };

        const menuStyle = {
            'text-transform': 'uppercase'
        }

        return (
            <div className="history-page-container">
                <MuiThemeProvider>
                    <Paper style={style} zDepth={4} rounded={false}>
                        <DropDownMenu value={this.state.selectedMonth} menuStyle={menuStyle} labelStyle={menuStyle} style={ddstyles.customWidth} autoWidth={false} onChange={this.handleMonthChange}>
                            {this.getMonthsMenu()}
                        </DropDownMenu>
                        <DropDownMenu value={this.state.selectedYear} style={ddstyles.customWidth} autoWidth={false} onChange={this.handleYearChange}>
                            {this.getYearsMenu()}
                        </DropDownMenu>
                        <div id="historyDistributionTable" className="history-distribution-table"></div>
                        <div className="total-expense-amount">Total Expense: {this.state.totalExpense}</div>
                    </Paper>
                </MuiThemeProvider>

            </div>
        )
    }

    componentDidMount() {
        $.ajax({
            url: "http://127.0.0.1:8080/getHistory",
            cache: false,
            data: { userId: this.userId },
            success: (data) => {
                const history = JSON.parse(data);
                this.monthNames = history.months;
                this.years = history.years;
                history.expenses.forEach((expense, index) => {
                    this.expenses.push({ expenseArea: expense.expense_area, totalExpense: expense.total_expense_amount })
                });
                const totalExpense = Enumerable.from(this.expenses).select(x => x.totalExpense).sum();
                const monthToSelect = history.months.findIndex(m => this.months[this.date.getMonth()].toLowerCase() === m.toLowerCase());
                this.setState({ totalExpense: totalExpense, selectedMonth: monthToSelect + 1, selectedYear: history.years.indexOf(this.date.getFullYear()) + 1 });
                this.populateDistributionTable();
            },
            error: (xhr, status, err) => {
                console.error(this.props.url, status, err.toString());
            }
        });

    }
}

export default History;