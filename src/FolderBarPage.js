import React, { Component } from 'react';
import './FolderBarPage.css'
import History from './HistoryPage'
import ReactDOM from 'react-dom';
import OverView from './OverViewPage';
import Budget from './BudgetPage';
import Distribution from './DistributionPage';


class FolderBar extends Component {

    constructor(props) {
        super(props);
        this.state = { isCollapsed: this.props.isCollapsed };

        this.renderHistoryPage = () => {
            ReactDOM.render(<History />, document.getElementById('pageContent'))
        }

        this.renderOverviewPage = () => {
            ReactDOM.render(<OverView />, document.getElementById('pageContent'))
        }

        this.renderBudgetPage = () => {
            ReactDOM.render(<Budget />, document.getElementById('pageContent'))
        }

        this.renderDistributionPage = () => {
            ReactDOM.render(<Distribution />, document.getElementById('pageContent'))
        }

        this.makeInactive = () => {
            const container = document.getElementById('folderBarContainer');
            const element = container.getElementsByClassName('active')[0];
            if (element)
                element.className = element.className.replace(/\bactive\b/g, "");
        }
    }


    render() {
        const customStyle = {
            visibility: (this.props.isCollapsed == true ? 'hidden' : 'visible'),
            opacity: (this.props.isCollapsed == true ? '0' : '1'),
            transition: 'visibility 0s linear 300ms, opacity 300ms'
        }
        return (
            <div id="folderBarContainer" className="folderBar-container" style={customStyle} >
                <div className="tab active" id="overviewTab">Overview</div>
                <div className="tab" id="historyTab">History</div>
                <div className="tab" id="budgetTab">Budget</div>
                <div className="tab" id="distributionTab">Distribution</div>
            </div>
        )
    }

    componentDidMount() {

        document.getElementById('historyTab').addEventListener("click", (e) => {
            this.makeInactive();
            this.renderHistoryPage();
            e.currentTarget.className += ' active';

        });

        document.getElementById('overviewTab').addEventListener("click", (e) => {
            this.makeInactive();
            this.renderOverviewPage();
            e.currentTarget.className += ' active';
        });

        document.getElementById('budgetTab').addEventListener("click", (e) => {
            this.makeInactive();
            this.renderBudgetPage();
            e.currentTarget.className += ' active';
        });

        document.getElementById('distributionTab').addEventListener("click", (e) => {
            this.makeInactive();
            this.renderDistributionPage();
            e.currentTarget.className += ' active';
        });
    }


}

export default FolderBar;