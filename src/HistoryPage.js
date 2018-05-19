import React, { Component } from 'react';
import Paper from 'material-ui/Paper';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import './HistoryPageStyle.css';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import Enumerable from '../node_modules/linq';
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
        this.date = new Date();

        this.state = {
            selectedMonth: 0,
            selectedYear: 0,
            totalExpense: 0,
            expenses: []
        }

        socket.on("expenseAdded", (data) => {
            this.refreshHistory(JSON.parse(data));
        })

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

        this.populateHistoryTable = () => {            
            let historyJsx = [];
            const expenses = this.state.expenses;
            expenses.forEach((element, index) => {
                let lastColumnClass = '';
                if (expenses.length == index + 1) {
                    lastColumnClass = "last-column";
                }
                historyJsx.push(
                    <div id={element.id} className={`history-row ${lastColumnClass}`}>
                        <div className='expense-area row'>{element.expenseArea}</div>
                        <div className='total-expense row'>{element.totalExpense}</div>
                        <div className='row percentage'>{((element.totalExpense * 100) / this.state.totalExpense).toFixed(2)}%</div>
                    </div>
                );
            });

            if (!historyJsx.length) historyJsx.push(<div id="noExpenseFound" className="no-expense-found" style={{ display: 'flex' }}> No expenses found</div>);
            return historyJsx;
        }

        this.handleMonthChange = (event, index, value) => {
            this.setState({ selectedMonth: value });
            this.getHistory(value, undefined);
        }

        this.handleYearChange = (event, index, value) => {
            this.setState({ selectedYear: value });
            this.getHistory(undefined, value);
        }

        this.getHistory = (month, year) => {
            const selectedMonth = this.monthNames[(month || this.state.selectedMonth) - 1];
            const selectedYear = this.years[(year || this.state.selectedYear) - 1];

            $.ajax({
                url: "http://127.0.0.1:8080/getHistoryForMonthAndYear",
                cache: false,
                data: { userId: this.userId, month: selectedMonth, year: selectedYear },
                success: (data) => {
                    const history = JSON.parse(data);
                    this.refreshHistory(history);
                },
                error: (xhr, status, err) => {
                    console.error(this.props.url, status, err.toString());
                }
            });
        }

        this.refreshHistory = (history) => {           
            history = Enumerable.from(history).where(x => x.total_expense_amount != null).toArray();
            const expenses = [];            
            history.forEach((expense, index) => {
                expenses.push({ id: expense.id, expenseArea: expense.expense_area, totalExpense: expense.total_expense_amount });
            });
            const totalExpense = Enumerable.from(expenses).select(x => x.totalExpense).sum();
            this.setState({ totalExpense: totalExpense, expenses: expenses });           
        }


    }

    render() {
        const style = {
            height: '70%',
            width: '45%',
            margin: 20,
            textAlign: 'left',
            display: 'inline-block',
            position: 'relative'
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
                    <Paper style={style} zDepth={1} rounded={false}>
                        <DropDownMenu value={this.state.selectedMonth} menuStyle={menuStyle} labelStyle={menuStyle} style={ddstyles.customWidth} autoWidth={false} onChange={this.handleMonthChange}>
                            {this.getMonthsMenu()}
                        </DropDownMenu>
                        <DropDownMenu value={this.state.selectedYear} style={ddstyles.customWidth} autoWidth={false} onChange={this.handleYearChange}>
                            {this.getYearsMenu()}
                        </DropDownMenu>
                        <div id="historyDistributionTable" className="history-distribution-table custom-scrollBar">
                            {this.populateHistoryTable()}
                        </div>
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
                const monthToSelect = history.months.findIndex(m => this.months[this.date.getMonth()].toLowerCase() === m.toLowerCase());
                this.setState({ selectedMonth: monthToSelect + 1, selectedYear: history.years.indexOf(this.date.getFullYear()) + 1 });
                this.refreshHistory(history.expenses);
            },
            error: (xhr, status, err) => {
                console.error(this.props.url, status, err.toString());
            }
        });

    }
}

export default History;