import React, { Component } from 'react';
import './OverViewPage.css';
import $ from 'jquery';

class OverView extends Component {
    constructor(prop) {
        super(prop);
        const socket = prop.socket;
        this.currentMonth = () => {
            var objDate = new Date();
            var locale = "en-us";
            return objDate.toLocaleString(locale, { month: "long" }).toUpperCase();
        }

        this.colors = ["#5179D6", "#66CC66", "#EF2F41", "#FFC700", "#61BDF2", "#FF7900", "#7588DD", "#2F5E8C", "#07BACE", "#BAE55C", "#BA1871", "#FFFFCC", "#BDE6FC", "#C7C7C7", "#ADA8FF", "#2FA675"];
        this.expenses = [
            { expenseArea: 'HouseHold', totalExpense: 1800 },
            { expenseArea: 'CreditCard', totalExpense: 1500 },
            { expenseArea: 'Rent', totalExpense: 1300 },
            { expenseArea: 'personal Expense', totalExpense: 400 }
        ]

        this.getExpenses = () => {
            if (this.expenses.length) {
                for (let i = 0; i < this.expenses.length; i++) {
                    const element = this.expenses[i];
                    const container = $('#chartContainer')[0];
                    const totalAvailableWidth = container.offsetWidth;
                    let width = '100%';
                    if (i > 0) {
                        let newWidth = (totalAvailableWidth / this.expenses[0].totalExpense) * element.totalExpense;
                        width = `${((newWidth * 100) / totalAvailableWidth).toFixed(2)}%`;
                    }
                    container.innerHTML += `<div class="expense">
                        <span class="expenseArea" style='color:${this.colors[i]}'>${element.expenseArea}  ${element.totalExpense}Rs</span><br />
                        <div style='height: 15px;background-color:${this.colors[i]};width:${width}'></div>
                    </div>`;
                }

            };
        };
    }

    render() {
        return (
            <div className="overview-container">
                <div className="summary">
                    <div className="current-Month">{this.currentMonth()}</div><br />
                    <span className="overall">OVERALL</span><br />
                    <span className="total-Expense">5000 Rs</span><br />
                    <span className="total-Expense-left">5000 Rs left until you reach your monthly limit.</span>
                </div>

                <div className="separator"></div>

                <div className="summary-chart">
                    <div className="summary-chart-title">EXPENSES</div>
                    <div id="chartContainer" className="chart-container">                       
                    </div>
                </div>
            </div>
        )
    }

    componentDidMount() { this.getExpenses(); }


}

export default OverView;