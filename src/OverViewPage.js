import React, { Component } from 'react';
import './OverViewPage.css';
import $ from 'jquery';
import Enumerable from '../node_modules/linq';
import cookie from 'react-cookies';
import openSocket from 'socket.io-client';

class OverView extends Component {
    constructor(prop) {
        super(prop);
        const socket = prop.socket || openSocket('http://127.0.0.1:8080');
        this.userId = prop.userId || cookie.load("userId");;
        this.currentMonth = () => {
            var objDate = new Date();
            var locale = "en-us";
            return objDate.toLocaleString(locale, { month: "long" }).toUpperCase();
        }
        this.state = {
            totalExpense: 0,
            totalAllocatedExpense: 0,
            limitExceededClass: ''
        }

        socket.on("expenseAdded", (data) => {
            this.refreshOverview(JSON.parse(data));
        })

        this.refreshOverview = (expenses) => {
            const chartContainer = document.getElementById("chartContainer");
            if (!chartContainer) return;
            chartContainer.innerHTML = '';
            this.expenses = [];
            expenses.forEach((expense, index) => {
                if (expense.total_expense_amount != null)
                    this.expenses.push({ expenseArea: expense.expense_area, totalExpense: expense.total_expense_amount })
            });
            const totalExpense = Enumerable.from(expenses).where(x => x.total_expense_amount != null).select(x => x.total_expense_amount).sum();
            const totalAllocatedExpense = Enumerable.from(expenses).select(x => x.allocated_expense_amount).sum();
            let limitExceededClass = '';
            if (totalAllocatedExpense - totalExpense < 0) { limitExceededClass = 'limit-exceeded' };
            this.setState({
                totalExpense: totalExpense,
                totalAllocatedExpense: totalAllocatedExpense,
                limitExceededClass: limitExceededClass
            });
            this.populateExpenseChart();
        }
        this.colors = ["#5179D6", "#66CC66", "#EF2F41", "#FFC700", "#61BDF2", "#FF7900", "#7588DD", "#2F5E8C", "#07BACE", "#BAE55C", "#BA1871", "#FFFFCC", "#BDE6FC", "#C7C7C7", "#ADA8FF", "#2FA675"];
        this.expenses = []


        this.populateExpenseChart = () => {
            if (this.expenses.length) {
                this.expenses = this.expenses.sort((a, b) => { return b.totalExpense - a.totalExpense });
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

        this.getLimitMsg = () => {
            const limitLeft = this.state.totalAllocatedExpense - this.state.totalExpense;
            if (limitLeft >= 0) {
                return `${limitLeft} Rs left until you reach your monthly limit.`;
            } else {
                return `you have exceeded your monthly limit by ${limitLeft - (limitLeft * 2)} Rs.`;
            }
        }
    }

    render() {
        const limitLeftClass=`total-Expense-left ${this.state.limitExceededClass}`;
        return (
            <div className="overview-container">
                <div className="summary">
                    <div className="current-Month">{this.currentMonth()}</div><br />
                    <span className="overall">OVERALL</span><br />
                    <span className="total-Expense">{this.state.totalExpense} Rs</span><br />
                    <span className={limitLeftClass}>{this.getLimitMsg()}</span>
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

    componentDidMount() {
        $.ajax({
            url: "http://127.0.0.1:8080/getOverview",
            cache: false,
            data: { userId: this.userId },
            success: (data) => {
                const expenses = JSON.parse(data);
                this.refreshOverview(expenses);
            },
            error: (xhr, status, err) => {
                console.error(this.props.url, status, err.toString());
            }
        });


    }


}

export default OverView;