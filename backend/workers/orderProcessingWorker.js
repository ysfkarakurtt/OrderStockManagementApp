const { parentPort, workerData } = require('worker_threads');

try {
    const { task, data } = workerData;

    switch (task) {
        case 'approveOrders':
            const processedOrders = data.map(order => {
                const now = new Date();
                const waitingTime = Math.floor((now - new Date(order.date)) / 1000); 
                const baseScore = order.customer_type === 'premium' ? 15 : 10;
                const priorityScore = baseScore + waitingTime * 0.5;

                return {
                    ...order,
                    waiting_time: waitingTime,
                    priority_score: priorityScore,
                };
            });
            parentPort.postMessage({ success: true, processedOrders });
            break;

        case 'otherTask': 
            parentPort.postMessage({ success: true, message: 'Other task processing.' });
            break;

        default:
            throw new Error(`Undefined Task: ${task}`);
    }
} catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
}
