import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import Menu from '../../components/Menu/Menu'
import Pagination from '../../components/Pagination/Pagination';
import Footer from '../../components/Footer/Footer';
import AutomationRow from './AutomationRow';
import AutomationModal from './AutomationModal/AutomationModal';
import Toast from '../../components/Toast/Toast';
import { getAutomations, startAutomation, stopAutomation, deleteAutomation } from '../../services/AutomationsService';
import NewAutomationButton from './NewAutomationButton';
import GridModal from './GridModal/GridModal';

function Automations() {

    const defaultLocation = useLocation();

    function getPage(location) {
        if (!location) location = defaultLocation;
        return new URLSearchParams(location.search).get('page');
    }

    const history = useHistory();

    const [automations, setAutomations] = useState([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(getPage());
    const [notification, setNotification] = useState({ type: '', text: '' });

    const DEFAULT_AUTOMATION = {
        name: '',
        conditions: '',
        indexes: ''
    }
    const [editAutomation, setEditAutomation] = useState(DEFAULT_AUTOMATION);

    useEffect(() => {
        return history.listen(location => setPage(getPage(location)));
    }, [history])

    useEffect(() => {
        const token = localStorage.getItem('token');
        getAutomations(page || 1, token)
            .then(result => {
                setAutomations(result.rows);
                setCount(result.count);
            })
            .catch(err => {
                console.error(err.response ? err.response.data : err.message);
                setNotification({ type: 'error', text: err.response ? err.response.data : err.message });
            });
    }, [page])

    function onNewAutomationClick(event) {
        setEditAutomation(DEFAULT_AUTOMATION);
    }

    function onEditAutomationClick(event) {
        const id = event.target.id.replace('edit', '');
        setEditAutomation(automations.find(a => a.id == id));
    }

    function onStartAutomationClick(event) {
        const id = event.target.id.replace('start', '');
        const token = localStorage.getItem('token');
        startAutomation(id, token)
            .then(automation => history.go(0))
            .catch(err => {
                console.log(err.response ? err.response.data : err.message);
                setNotification({ type: 'error', text: err.response ? err.response.data : err.message });
            });
    }

    function onStopAutomationClick(event) {
        const id = event.target.id.replace('stop', '');
        const token = localStorage.getItem('token');
        stopAutomation(id, token)
            .then(automation => history.go(0))
            .catch(err => {
                console.log(err.response ? err.response.data : err.message);
                setNotification({ type: 'error', text: err.response ? err.response.data : err.message });
            });
    }

    function onDeleteAutomationClick(event) {
        const id = event.target.id.replace('delete', '');
        const token = localStorage.getItem('token');
        deleteAutomation(id, token)
            .then(automation => history.go(0))
            .catch(err => {
                console.log(err.response ? err.response.data : err.message);
                setNotification({ type: 'error', text: err.response ? err.response.data : err.message });
            });
    }

    function onAutomationSubmit(event) {
        history.go(0);
    }

    return (
        <React.Fragment>
            <Menu />
            <main className="content">
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
                    <div className="d-block mb-4 mb-md-0">
                        <h2 className="h4">Automations</h2>
                    </div>
                    <div className="btn-toolbar mb-2 mb-md-0">
                        <div className="d-inline-flex align-items-center">
                            <NewAutomationButton onClick={onNewAutomationClick} />
                        </div>
                    </div>
                </div>
                <div className="card card-body border-0 shadow table-wrapper table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th className="border-gray-200">Symbol</th>
                                <th className="border-gray-200">Name</th>
                                <th className="border-gray-200">Active</th>
                                <th className="border-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                automations && automations.length
                                    ? automations.map(automation => (<AutomationRow key={automation.id} data={automation} onEditClick={onEditAutomationClick} onStopClick={onStopAutomationClick} onStartClick={onStartAutomationClick} onDeleteClick={onDeleteAutomationClick} />))
                                    : <React.Fragment></React.Fragment>
                            }
                        </tbody>
                    </table>
                    <Pagination count={count} />
                </div>
                <Footer />
            </main>
            <AutomationModal data={editAutomation} onSubmit={onAutomationSubmit} />
            <GridModal data={editAutomation} onSubmit={onAutomationSubmit} />
            <Toast type={notification.type} text={notification.text} />
        </React.Fragment>
    )
}

export default Automations;